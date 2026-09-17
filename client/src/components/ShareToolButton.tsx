// Orbital Workbench: Share tool action with personalized ?by= parameter and Web Share API
import { useState, useEffect, useMemo, useRef } from "react";
import { Share2, Check, Copy, X, Link as LinkIcon, User } from "lucide-react";
import type { ToolDefinition } from "@/data/toolRegistry";
import { cleanUserName } from "@shared/userParam";

interface ShareToolButtonProps {
  tool: ToolDefinition;
  className?: string;
}

const STORAGE_KEY = "toolboxgalaxy:sharer_name";

export default function ShareToolButton({ tool, className = "" }: ShareToolButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize stored name from local browser storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setName(cleanUserName(stored));
      }
    } catch {
      // Ignore storage access restrictions in restricted sandboxes
    }
  }, []);

  // Close on Escape key press
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus input field when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.select();
      }, 50);
    }
  }, [open]);

  const sanitizedName = useMemo(() => cleanUserName(name), [name]);

  const shareUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://toolboxgalaxy.com";
    const base = `${origin}/tools/${tool.slug}`;
    if (sanitizedName) {
      return `${base}?by=${encodeURIComponent(sanitizedName)}`;
    }
    return base;
  }, [tool.slug, sanitizedName]);

  const shareTitle = useMemo(() => {
    if (sanitizedName) {
      return `${sanitizedName} thinks you'll find this useful: ${tool.name} | Toolbox Galaxy`;
    }
    return `${tool.name} – Free Online Tool | Toolbox Galaxy`;
  }, [tool.name, sanitizedName]);

  const shareText = useMemo(() => {
    if (sanitizedName) {
      return `${sanitizedName} shared this free, private in-browser tool with you: ${tool.name}`;
    }
    return `Check out this free, private in-browser tool: ${tool.name}`;
  }, [tool.name, sanitizedName]);

  const handleNameChange = (val: string) => {
    const cleaned = cleanUserName(val);
    setName(cleaned);
    try {
      if (cleaned) {
        localStorage.setItem(STORAGE_KEY, cleaned);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage safe fallback
    }
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fallback below
      }
    }
    // Fallback using textarea execCommand
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setFeedback("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2200);
      setTimeout(() => setFeedback(""), 3000);
    }
  };

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleNativeShare = async () => {
    if (!canShare) {
      await handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      setFeedback("Shared successfully!");
      setTimeout(() => setFeedback(""), 3000);
    } catch (err: unknown) {
      // If user aborted/dismissed the share sheet, do not overwrite or error
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      // If native sharing is blocked or fails, seamlessly fall back to clipboard copy
      await handleCopyLink();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`share-tool-button ${className}`}
        aria-label={`Share ${tool.name}`}
        title="Share this tool with a friend or colleague"
      >
        <Share2 size={13} />
        <span>Share</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0e1628] p-5 sm:p-6 shadow-2xl text-[#f4f2ea] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-dialog-title"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close share dialog"
            >
              <X size={17} />
            </button>

            {/* Dialog Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c7f36b]/15 text-[#c7f36b] border border-[#c7f36b]/30">
                <Share2 size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#c7f36b]">
                  VIRAL SHARE · BROWSER LOCAL
                </span>
                <h3 id="share-dialog-title" className="font-display text-lg font-semibold tracking-tight text-white">
                  Share {tool.name}
                </h3>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-white/70">
              Recommend this free, private client-side utility to a friend or coworker. Add your name below to personalize their preview card.
            </p>

            {/* Personalized Name Input */}
            <div className="mt-4 space-y-1.5">
              <label htmlFor="sharer-name-input" className="flex items-center justify-between text-xs font-mono text-white/80">
                <span className="flex items-center gap-1.5">
                  <User size={12} className="text-[#c7f36b]" />
                  Your name <span className="text-white/40 font-normal">(optional)</span>:
                </span>
                <span className="text-[11px] text-white/40">
                  {sanitizedName.length}/30
                </span>
              </label>
              <input
                id="sharer-name-input"
                ref={inputRef}
                type="text"
                maxLength={30}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#c7f36b] focus:outline-none focus:ring-1 focus:ring-[#c7f36b] font-mono transition-colors"
              />
              {sanitizedName ? (
                <p className="text-[11px] text-[#c7f36b]/90 font-mono">
                  Preview card: &ldquo;{sanitizedName} thinks you&apos;ll find this useful: {tool.name}&rdquo;
                </p>
              ) : (
                <p className="text-[11px] text-white/40 font-mono">
                  No name: link will display standard {tool.name} preview tags.
                </p>
              )}
            </div>

            {/* URL Display */}
            <div className="mt-4 space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-white/60 flex items-center gap-1">
                <LinkIcon size={12} /> Shareable Link:
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 p-2.5">
                <div className="flex-1 overflow-x-auto font-mono text-xs text-white/80 whitespace-nowrap scrollbar-none select-all">
                  {shareUrl}
                </div>
              </div>
            </div>

            {/* Status Feedback Toast */}
            {feedback && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-[#c7f36b] animate-in fade-in duration-100">
                <Check size={14} />
                <span>{feedback}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-5 flex items-center gap-2.5">
              {canShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#c7f36b] px-4 py-2.5 text-xs font-semibold text-[#0b1020] hover:bg-[#b8e35f] active:scale-[0.98] transition-all"
                >
                  <Share2 size={14} />
                  <span>Share via Device</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-xs font-semibold transition-all ${
                  canShare
                    ? "bg-white/5 text-white hover:bg-white/10"
                    : "bg-[#c7f36b] text-[#0b1020] hover:bg-[#b8e35f]"
                } ${copied ? "!border-[#c7f36b] !text-[#c7f36b]" : ""}`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? "Link Copied!" : "Copy Link"}</span>
              </button>
            </div>

            {/* Local Privacy Guarantee */}
            <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-white/40 font-mono text-center">
              100% in-browser link generation · Zero server analytics or tracking cookies
            </div>
          </div>
        </div>
      )}
    </>
  );
}
