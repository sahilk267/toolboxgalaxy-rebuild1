import React, { useState, useEffect } from "react";
import {
  FileText,
  Code,
  CheckSquare,
  X,
  Copy,
  Download,
  Trash2,
  Sparkles,
  Lock,
  Check,
  Plus,
} from "lucide-react";
import { unlockBadge } from "@/lib/achievementBadges";

type ScratchTab = "notes" | "code" | "todo";

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export const QuickScratchpad: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ScratchTab>("notes");

  // Persistent States
  const [notesText, setNotesText] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tg_scratchpad_notes") || "";
    }
    return "";
  });

  const [codeText, setCodeText] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tg_scratchpad_code") || "";
    }
    return "";
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tg_scratchpad_todos");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [
      { id: "1", text: "Validate production API payload", done: false },
      { id: "2", text: "Test daily word puzzle streak", done: true },
    ];
  });

  const [newTodoInput, setNewTodoInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [formatted, setFormatted] = useState(false);

  // Sync Notes to LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tg_scratchpad_notes", notesText);
      if (notesText.trim().length > 10) {
        unlockBadge("the-scribe");
      }
    }
  }, [notesText]);

  // Sync Code to LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tg_scratchpad_code", codeText);
      if (codeText.trim().length > 10) {
        unlockBadge("the-scribe");
      }
    }
  }, [codeText]);

  // Sync Todos to LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tg_scratchpad_todos", JSON.stringify(todos));
    }
  }, [todos]);

  // Hotkey listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentContent = activeTab === "notes" ? notesText : codeText;

  const handleCopy = () => {
    let textToCopy = "";
    if (activeTab === "notes") textToCopy = notesText;
    else if (activeTab === "code") textToCopy = codeText;
    else {
      textToCopy = todos.map((t) => `[${t.done ? "X" : " "}] ${t.text}`).join("\n");
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(codeText);
      setCodeText(JSON.stringify(parsed, null, 2));
      setFormatted(true);
      setTimeout(() => setFormatted(false), 2000);
    } catch {
      // not valid JSON, leave as is
    }
  };

  const handleDownload = () => {
    let content = "";
    let filename = "scratchpad.txt";
    if (activeTab === "notes") {
      content = notesText;
      filename = "galaxy-notes.txt";
    } else if (activeTab === "code") {
      content = codeText;
      filename = "galaxy-snippet.json";
    } else {
      content = todos.map((t) => `[${t.done ? "X" : " "}] ${t.text}`).join("\n");
      filename = "galaxy-todos.txt";
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (activeTab === "notes") setNotesText("");
    else if (activeTab === "code") setCodeText("");
    else setTodos([]);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoInput.trim()) return;
    setTodos([
      ...todos,
      { id: Date.now().toString(), text: newTodoInput.trim(), done: false },
    ]);
    setNewTodoInput("");
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const removeTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/15 bg-[#0e1628] text-white shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scratchpad-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c7f36b]/15 text-[#c7f36b] border border-[#c7f36b]/30">
              <FileText size={17} />
            </div>
            <div>
              <h2 id="scratchpad-title" className="font-display text-sm font-bold tracking-tight">
                Quick Scratchpad & Vault
              </h2>
              <p className="text-[11px] text-white/50 font-mono flex items-center gap-1">
                <Lock size={10} className="text-[#6fd5ff]" />
                100% In-Browser Memory · Never leaves this device
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close Scratchpad"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "notes"
                  ? "bg-[#c7f36b] text-[#090d18] shadow"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <FileText size={14} />
              <span>Notes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "code"
                  ? "bg-[#c7f36b] text-[#090d18] shadow"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Code size={14} />
              <span>JSON / Snippet</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("todo")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "todo"
                  ? "bg-[#c7f36b] text-[#090d18] shadow"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <CheckSquare size={14} />
              <span>Task List</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {activeTab === "code" && (
              <button
                type="button"
                onClick={handleFormatJson}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                title="Format as indented JSON"
              >
                <Sparkles size={12} className="text-[#c7f36b]" />
                <span>{formatted ? "Formatted!" : "Beautify"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              title="Copy to clipboard"
            >
              {copied ? <Check size={12} className="text-[#c7f36b]" /> : <Copy size={12} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10"
              title="Download content"
            >
              <Download size={14} />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
              title="Clear tab content"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto">
          {activeTab === "notes" && (
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Jot down quick thoughts, temporary API keys, formatted text, or scratch notes here... Auto-saved locally."
              className="w-full h-72 resize-none bg-transparent font-sans text-sm text-white/90 placeholder:text-white/30 focus:outline-none leading-relaxed"
            />
          )}

          {activeTab === "code" && (
            <textarea
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              placeholder='Paste JSON, SQL queries, regexes, curl scripts, or snippets here... Click "Beautify" to format JSON.'
              className="w-full h-72 resize-none bg-transparent font-mono text-xs text-lime-300/90 placeholder:text-white/30 focus:outline-none leading-relaxed"
              spellCheck={false}
            />
          )}

          {activeTab === "todo" && (
            <div className="flex flex-col h-72">
              <form onSubmit={handleAddTodo} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTodoInput}
                  onChange={(e) => setNewTodoInput(e.target.value)}
                  placeholder="Add a workbench task (e.g. Test image conversion)..."
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#c7f36b]"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-lg bg-[#c7f36b] px-3 py-1.5 text-xs font-semibold text-[#090d18] hover:bg-[#d6f78a]"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </form>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {todos.length === 0 ? (
                  <p className="text-center text-xs text-white/40 pt-10">No tasks active. Add one above!</p>
                ) : (
                  todos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/15"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTodo(todo.id)}
                        className="flex items-center gap-2.5 text-left flex-1"
                      >
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                            todo.done
                              ? "bg-[#c7f36b] border-[#c7f36b] text-[#090d18]"
                              : "border-white/30 hover:border-white/60"
                          }`}
                        >
                          {todo.done && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span
                          className={`text-xs ${
                            todo.done ? "line-through text-white/40" : "text-white/90"
                          }`}
                        >
                          {todo.text}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTodo(todo.id)}
                        className="p-1 text-white/30 hover:text-rose-400"
                        title="Delete task"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/10 bg-white/[0.02] text-[11px] font-mono text-white/50">
          <div className="flex items-center gap-3">
            {activeTab !== "todo" ? (
              <>
                <span>
                  Words: {currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0}
                </span>
                <span>Characters: {currentContent.length}</span>
              </>
            ) : (
              <span>
                {todos.filter((t) => t.done).length} of {todos.length} done
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[#c7f36b]">
            <Check size={12} />
            <span>Saved in local storage</span>
          </div>
        </div>
      </div>
    </div>
  );
};
