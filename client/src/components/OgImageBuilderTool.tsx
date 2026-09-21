// Orbital Workbench: Zero-dependency OpenGraph & Social Share Image Builder
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  LayoutTemplate,
  Palette,
  Sliders,
  Type,
  Eye,
  Grid,
  Globe,
  Share2
} from "lucide-react";

type LayoutStyle = "modern" | "centered" | "terminal" | "split";
type ThemePreset = "obsidian" | "cyberlime" | "deepspace" | "sunset" | "studio";

interface PresetConfig {
  name: string;
  bgStart: string;
  bgEnd: string;
  accent: string;
  textColor: string;
  mutedColor: string;
}

const PRESETS: Record<ThemePreset, PresetConfig> = {
  obsidian: {
    name: "Dark Obsidian",
    bgStart: "#090d16",
    bgEnd: "#020408",
    accent: "#38bdf8",
    textColor: "#ffffff",
    mutedColor: "rgba(255, 255, 255, 0.65)",
  },
  cyberlime: {
    name: "Cyber Lime",
    bgStart: "#08140c",
    bgEnd: "#010804",
    accent: "#c7f36b",
    textColor: "#ffffff",
    mutedColor: "rgba(255, 255, 255, 0.70)",
  },
  deepspace: {
    name: "Deep Space",
    bgStart: "#130924",
    bgEnd: "#04010a",
    accent: "#a855f7",
    textColor: "#ffffff",
    mutedColor: "rgba(255, 255, 255, 0.65)",
  },
  sunset: {
    name: "Sunset Ember",
    bgStart: "#1c0a0a",
    bgEnd: "#080101",
    accent: "#f97316",
    textColor: "#ffffff",
    mutedColor: "rgba(255, 255, 255, 0.70)",
  },
  studio: {
    name: "Clean Slate",
    bgStart: "#0f172a",
    bgEnd: "#020617",
    accent: "#38bdf8",
    textColor: "#f8fafc",
    mutedColor: "#94a3b8",
  },
};

const ACCENT_SWATCHES = [
  "#c7f36b", // Lime
  "#38bdf8", // Sky
  "#a855f7", // Violet
  "#f97316", // Orange
  "#f43f5e", // Rose
  "#10b981", // Emerald
  "#fbbf24", // Amber
  "#e2e8f0", // Clean White
];

export function OgImageBuilderTool() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Content state
  const [title, setTitle] = useState("Build Fast. Ship Clean. Zero Bloat.");
  const [subtitle, setSubtitle] = useState("In-browser developer utilities running 100% client-side with zero tracking.");
  const [badge, setBadge] = useState("VERIFIED WORKBENCH");
  const [brand, setBrand] = useState("Toolbox Galaxy");
  const [domain, setDomain] = useState("toolboxgalaxy.com");

  // Styling state
  const [layout, setLayout] = useState<LayoutStyle>("modern");
  const [preset, setPreset] = useState<ThemePreset>("cyberlime");
  const [accentColor, setAccentColor] = useState(PRESETS.cyberlime.accent);
  const [titleSize, setTitleSize] = useState(54);
  const [showGrid, setShowGrid] = useState(true);
  const [showGlow, setShowGlow] = useState(true);

  // UI state
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Handle Preset change
  const applyPreset = (key: ThemePreset) => {
    setPreset(key);
    setAccentColor(PRESETS[key].accent);
  };

  // Canvas drawing routine
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    const theme = PRESETS[preset];

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, theme.bgStart);
    bgGrad.addColorStop(1, theme.bgEnd);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Radial Glow Orb
    if (showGlow) {
      const glowGrad = ctx.createRadialGradient(
        layout === "centered" ? width / 2 : width * 0.75,
        layout === "centered" ? height * 0.4 : height * 0.3,
        10,
        layout === "centered" ? width / 2 : width * 0.75,
        layout === "centered" ? height * 0.4 : height * 0.3,
        500
      );
      glowGrad.addColorStop(0, `${accentColor}25`); // 15% opacity
      glowGrad.addColorStop(0.5, `${accentColor}08`); // 3% opacity
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 3. Grid / Dot matrix pattern
    if (showGrid) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // 4. Subtle Outer Border & Corner Accents
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 30, width - 60, height - 56);

    // Corner tick marks
    const tickLen = 14;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(30, 30 + tickLen);
    ctx.lineTo(30, 30);
    ctx.lineTo(30 + tickLen, 30);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - 30 - tickLen, 30);
    ctx.lineTo(width - 30, 30);
    ctx.lineTo(width - 30, 30 + tickLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(30, height - 26 - tickLen);
    ctx.lineTo(30, height - 26);
    ctx.lineTo(30 + tickLen, height - 26);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - 30 - tickLen, height - 26);
    ctx.lineTo(width - 30, height - 26);
    ctx.lineTo(width - 30, height - 26 - tickLen);
    ctx.stroke();

    // Helper: Word Wrap
    const wrapText = (text: string, maxWidth: number, font: string): string[] => {
      ctx.font = font;
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // 5. Layout Rendering
    if (layout === "modern") {
      // Top row: Badge Pill & Brand
      const startX = 80;
      let startY = 90;

      // Badge Pill
      if (badge) {
        ctx.font = "bold 13px ui-monospace, monospace";
        const badgeWidth = ctx.measureText(badge.toUpperCase()).width + 24;
        ctx.fillStyle = `${accentColor}18`;
        ctx.strokeStyle = `${accentColor}60`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(startX, startY, badgeWidth, 30, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.fillText(badge.toUpperCase(), startX + 12, startY + 20);
      }

      // Brand on top right
      if (brand) {
        ctx.font = "600 18px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "right";
        ctx.fillStyle = theme.textColor;
        ctx.fillText(brand, width - 80, startY + 20);
        // glowing dot
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(width - 80 - ctx.measureText(brand).width - 12, startY + 14, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = "left";
      }

      // Title
      startY = 200;
      const titleFont = `bold ${titleSize}px system-ui, -apple-system, sans-serif`;
      const titleLines = wrapText(title, 880, titleFont);
      ctx.font = titleFont;
      ctx.fillStyle = theme.textColor;
      titleLines.slice(0, 3).forEach((line, idx) => {
        ctx.fillText(line, startX, startY + idx * (titleSize * 1.15));
      });

      // Subtitle
      const subY = startY + titleLines.slice(0, 3).length * (titleSize * 1.15) + 30;
      if (subtitle) {
        const subFont = "400 22px system-ui, -apple-system, sans-serif";
        const subLines = wrapText(subtitle, 860, subFont);
        ctx.font = subFont;
        ctx.fillStyle = theme.mutedColor;
        subLines.slice(0, 2).forEach((line, idx) => {
          ctx.fillText(line, startX, subY + idx * 32);
        });
      }

      // Bottom Bar: Domain with pill
      const botY = height - 90;
      ctx.font = "500 16px ui-monospace, monospace";
      ctx.fillStyle = theme.mutedColor;
      ctx.fillText(`⚡ ${domain}`, startX, botY);

      // Bottom Accent line
      ctx.fillStyle = accentColor;
      ctx.fillRect(startX, botY + 16, 120, 3);
    } else if (layout === "centered") {
      ctx.textAlign = "center";
      const centerX = width / 2;

      // Badge Pill
      if (badge) {
        ctx.font = "bold 13px ui-monospace, monospace";
        const badgeWidth = ctx.measureText(badge.toUpperCase()).width + 28;
        ctx.fillStyle = `${accentColor}18`;
        ctx.strokeStyle = `${accentColor}60`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(centerX - badgeWidth / 2, 100, badgeWidth, 32, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.fillText(badge.toUpperCase(), centerX, 121);
      }

      // Title
      const titleFont = `bold ${titleSize + 4}px system-ui, -apple-system, sans-serif`;
      const titleLines = wrapText(title, 1000, titleFont);
      ctx.font = titleFont;
      ctx.fillStyle = theme.textColor;
      const startY = 220;
      titleLines.slice(0, 3).forEach((line, idx) => {
        ctx.fillText(line, centerX, startY + idx * (titleSize * 1.15));
      });

      // Subtitle
      const subY = startY + titleLines.slice(0, 3).length * (titleSize * 1.15) + 25;
      if (subtitle) {
        const subFont = "400 22px system-ui, -apple-system, sans-serif";
        const subLines = wrapText(subtitle, 880, subFont);
        ctx.font = subFont;
        ctx.fillStyle = theme.mutedColor;
        subLines.slice(0, 2).forEach((line, idx) => {
          ctx.fillText(line, centerX, subY + idx * 32);
        });
      }

      // Bottom domain
      ctx.font = "600 17px ui-monospace, monospace";
      ctx.fillStyle = accentColor;
      ctx.fillText(`${brand} · ${domain}`, centerX, height - 90);
      ctx.textAlign = "left";
    } else if (layout === "terminal") {
      const boxX = 70;
      const boxY = 70;
      const boxW = width - 140;
      const boxH = height - 140;

      // Window Container
      ctx.fillStyle = "rgba(10, 15, 26, 0.92)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 12);
      ctx.fill();
      ctx.stroke();

      // Window Header
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, 44, [12, 12, 0, 0]);
      ctx.fill();

      // Window controls (Red, Yellow, Green)
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(boxX + 24, boxY + 22, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#eab308";
      ctx.beginPath();
      ctx.arc(boxX + 44, boxY + 22, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(boxX + 64, boxY + 22, 6, 0, Math.PI * 2);
      ctx.fill();

      // Window title
      ctx.font = "500 13px ui-monospace, monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.textAlign = "center";
      ctx.fillText(`${domain} — zsh`, boxX + boxW / 2, boxY + 27);
      ctx.textAlign = "left";

      // Terminal content
      const contentX = boxX + 40;
      let lineY = boxY + 95;

      // Prompt line
      ctx.font = "bold 18px ui-monospace, monospace";
      ctx.fillStyle = accentColor;
      ctx.fillText("~ $", contentX, lineY);
      ctx.fillStyle = theme.textColor;
      ctx.fillText(`npx launch --module="${badge}"`, contentX + 45, lineY);

      lineY += 50;

      // Main Title as output
      const titleFont = `bold ${titleSize - 2}px system-ui, -apple-system, sans-serif`;
      const titleLines = wrapText(title, boxW - 80, titleFont);
      ctx.font = titleFont;
      ctx.fillStyle = theme.textColor;
      titleLines.slice(0, 3).forEach((line, idx) => {
        ctx.fillText(line, contentX, lineY + idx * (titleSize * 1.15));
      });

      // Subtitle
      lineY += titleLines.slice(0, 3).length * (titleSize * 1.15) + 20;
      if (subtitle) {
        const subFont = "400 20px system-ui, -apple-system, sans-serif";
        const subLines = wrapText(subtitle, boxW - 80, subFont);
        ctx.font = subFont;
        ctx.fillStyle = theme.mutedColor;
        subLines.slice(0, 2).forEach((line, idx) => {
          ctx.fillText(line, contentX, lineY + idx * 30);
        });
      }

      // Status bar at bottom of terminal
      const statY = boxY + boxH - 24;
      ctx.font = "bold 13px ui-monospace, monospace";
      ctx.fillStyle = accentColor;
      ctx.fillText("● READY", contentX, statY);
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText(`[100% CLIENT-SIDE VERIFIED] · ${brand}`, contentX + 85, statY);
    } else if (layout === "split") {
      const leftW = 680;
      const startX = 80;
      let startY = 110;

      // Badge
      if (badge) {
        ctx.font = "bold 13px ui-monospace, monospace";
        ctx.fillStyle = accentColor;
        ctx.fillText(badge.toUpperCase(), startX, startY);
        startY += 40;
      }

      // Title
      const titleFont = `bold ${titleSize - 4}px system-ui, -apple-system, sans-serif`;
      const titleLines = wrapText(title, leftW - 60, titleFont);
      ctx.font = titleFont;
      ctx.fillStyle = theme.textColor;
      titleLines.slice(0, 4).forEach((line, idx) => {
        ctx.fillText(line, startX, startY + idx * (titleSize * 1.12));
      });

      // Subtitle
      startY += titleLines.slice(0, 4).length * (titleSize * 1.12) + 24;
      if (subtitle) {
        const subFont = "400 20px system-ui, -apple-system, sans-serif";
        const subLines = wrapText(subtitle, leftW - 60, subFont);
        ctx.font = subFont;
        ctx.fillStyle = theme.mutedColor;
        subLines.slice(0, 2).forEach((line, idx) => {
          ctx.fillText(line, startX, startY + idx * 28);
        });
      }

      // Brand on left bottom
      ctx.font = "600 16px ui-monospace, monospace";
      ctx.fillStyle = accentColor;
      ctx.fillText(`⚡ ${brand} · ${domain}`, startX, height - 90);

      // Right decorative showcase card
      const rightX = 760;
      const rightY = 100;
      const rightW = 360;
      const rightH = 430;

      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.strokeStyle = `${accentColor}40`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(rightX, rightY, rightW, rightH, 16);
      ctx.fill();
      ctx.stroke();

      // Card Header
      ctx.fillStyle = `${accentColor}15`;
      ctx.fillRect(rightX, rightY, rightW, 60);
      ctx.font = "bold 14px ui-monospace, monospace";
      ctx.fillStyle = accentColor;
      ctx.fillText("PLATFORM TELEMETRY", rightX + 24, rightY + 36);

      // Metric tiles inside card
      const metrics = [
        { label: "RESOLUTION", val: "1200 × 630" },
        { label: "PIXEL RATIO", val: "1.90 : 1" },
        { label: "STORAGE LEAK", val: "0% PRIVATE" },
        { label: "COMPLIANCE", val: "OPENGRAPH 2.0" },
      ];

      metrics.forEach((m, idx) => {
        const my = rightY + 90 + idx * 75;
        ctx.font = "500 11px ui-monospace, monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillText(m.label, rightX + 24, my);

        ctx.font = "bold 17px ui-monospace, monospace";
        ctx.fillStyle = theme.textColor;
        ctx.fillText(m.val, rightX + 24, my + 24);

        if (idx < metrics.length - 1) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
          ctx.beginPath();
          ctx.moveTo(rightX + 24, my + 38);
          ctx.lineTo(rightX + rightW - 24, my + 38);
          ctx.stroke();
        }
      });
    }
  }, [
    title,
    subtitle,
    badge,
    brand,
    domain,
    layout,
    preset,
    accentColor,
    titleSize,
    showGrid,
    showGlow,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Export 1200x630 PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);

    canvas.toBlob((blob) => {
      if (!blob) {
        setDownloading(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 30);
      a.href = url;
      a.download = `og-${safeTitle || "social-card"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloading(false);
    }, "image/png");
  };

  // Copy Image to Clipboard
  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Fallback if browser doesn't support clipboard image writing
          setCopied(false);
        }
      }, "image/png");
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = () => {
    setTitle("Build Fast. Ship Clean. Zero Bloat.");
    setSubtitle("In-browser developer utilities running 100% client-side with zero tracking.");
    setBadge("VERIFIED WORKBENCH");
    setBrand("Toolbox Galaxy");
    setDomain("toolboxgalaxy.com");
    setLayout("modern");
    setPreset("cyberlime");
    setAccentColor(PRESETS.cyberlime.accent);
    setTitleSize(54);
    setShowGrid(true);
    setShowGlow(true);
  };

  return (
    <div className="runner-stack space-y-6">
      {/* Live Canvas Preview */}
      <div className="rounded-2xl border border-white/10 bg-[#070b14] p-4 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-white/60">
            <Eye size={14} className="text-[#c7f36b]" />
            <span>LIVE 1200 × 630 PREVIEW · 1.90:1 RATIO</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="quiet-button text-xs flex items-center gap-1.5 px-3 py-1.5"
              title="Copy 1200x630 PNG directly to clipboard"
            >
              {copied ? <Check size={14} className="text-[#c7f36b]" /> : <Copy size={14} />}
              {copied ? "Image Copied!" : "Copy Image"}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="signal-button text-xs flex items-center gap-1.5 px-4 py-1.5"
            >
              <Download size={14} />
              {downloading ? "Exporting..." : "Download 1200×630 PNG"}
            </button>
          </div>
        </div>

        {/* Scaled Responsive Canvas Container */}
        <div className="w-full aspect-[1200/630] rounded-xl overflow-hidden border border-white/15 bg-black relative flex items-center justify-center shadow-inner">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block"
            style={{ imageRendering: "auto" }}
          />
        </div>
      </div>

      {/* Control Tabs & Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Text & Content Inputs */}
        <div className="space-y-4">
          <div className="text-xs font-mono text-white/50 tracking-wider flex items-center gap-1.5">
            <Type size={14} className="text-[#c7f36b]" />
            <span>CONTENT & LABELS</span>
          </div>

          <label className="wide-field block">
            <span className="text-xs text-white/70 font-mono mb-1 block">Main Headline / Title</span>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              className="w-full text-base font-semibold"
              placeholder="e.g. Build Fast. Ship Clean."
            />
          </label>

          <label className="wide-field block">
            <span className="text-xs text-white/70 font-mono mb-1 block">Subtitle / Description</span>
            <textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={2}
              className="w-full text-sm"
              placeholder="e.g. High performance developer tools running 100% locally."
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="wide-field block">
              <span className="text-xs text-white/70 font-mono mb-1 block">Tag / Badge</span>
              <input
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. BLOG POST"
              />
            </label>
            <label className="wide-field block">
              <span className="text-xs text-white/70 font-mono mb-1 block">Brand / Product</span>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. My App"
              />
            </label>
            <label className="wide-field block">
              <span className="text-xs text-white/70 font-mono mb-1 block">Domain URL</span>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. example.com"
              />
            </label>
          </div>
        </div>

        {/* Right Column: Layout, Themes & Styling */}
        <div className="space-y-4">
          <div className="text-xs font-mono text-white/50 tracking-wider flex items-center gap-1.5">
            <Palette size={14} className="text-[#c7f36b]" />
            <span>THEME, LAYOUT & ACCENTS</span>
          </div>

          {/* Layout Picker */}
          <div>
            <span className="text-xs text-white/70 font-mono mb-2 block">Card Layout Style</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "modern", name: "Modern" },
                { id: "centered", name: "Centered" },
                { id: "terminal", name: "Terminal" },
                { id: "split", name: "Split" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLayout(item.id as LayoutStyle)}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono transition text-center ${
                    layout === item.id
                      ? "border-[#c7f36b] bg-[#c7f36b]/15 text-[#c7f36b] font-bold"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Presets */}
          <div>
            <span className="text-xs text-white/70 font-mono mb-2 block">Background Palette Preset</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(PRESETS) as ThemePreset[]).map((key) => {
                const p = PRESETS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                      preset === key
                        ? "border-[#c7f36b] bg-white/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 border border-white/20"
                      style={{ background: p.accent }}
                    />
                    <span className="text-xs text-white/90 font-mono truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color Swatches */}
          <div>
            <span className="text-xs text-white/70 font-mono mb-2 block">Highlight Accent Color</span>
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setAccentColor(hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    accentColor === hex ? "scale-125 border-white shadow-lg" : "border-transparent hover:scale-110"
                  }`}
                  style={{ background: hex }}
                  title={hex}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0 ml-2"
                title="Custom color picker"
              />
            </div>
          </div>

          {/* Font Size & Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-mono text-white/70 mb-1">
                <span>Title Font Size</span>
                <span>{titleSize}px</span>
              </div>
              <input
                type="range"
                min={36}
                max={72}
                value={titleSize}
                onChange={(e) => setTitleSize(Number(e.target.value))}
                className="w-full accent-[#c7f36b]"
              />
            </div>

            <div className="flex items-center gap-4 pt-4 sm:pt-0">
              <label className="flex items-center gap-2 text-xs font-mono text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded accent-[#c7f36b]"
                />
                <span>Grid Overlay</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-mono text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGlow}
                  onChange={(e) => setShowGlow(e.target.checked)}
                  className="rounded accent-[#c7f36b]"
                />
                <span>Ambient Glow</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <button
          onClick={handleReset}
          className="reset-button text-xs flex items-center gap-1.5 px-3 py-2"
        >
          <RotateCcw size={14} />
          <span>Reset Defaults</span>
        </button>

        <div className="text-xs font-mono text-white/40">
          ZERO THIRD-PARTY LIBS · 100% IN-BROWSER HTML5 CANVAS
        </div>
      </div>
    </div>
  );
}
