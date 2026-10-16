// Orbital Workbench: Workspace Profile Backup & Transfer Engine
// Enables users to backup and restore their streaks, achievements, scratchpad,
// and pinned tools locally without accounts or server storage.

export interface WorkspaceProfile {
  version: 1;
  exportedAt: string;
  favorites: string[];
  puzzleCompletions: Record<string, true>;
  achievements: Record<string, string>;
  scratchpad: {
    notes: string;
    code: string;
    todos: string;
  };
  dailyToolVisits: Record<string, string>;
}

export function exportWorkspaceProfile(): void {
  if (typeof window === "undefined") return;

  const profile: WorkspaceProfile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    favorites: JSON.parse(localStorage.getItem("toolbox-galaxy-favorite-tools-v1") ?? "[]"),
    puzzleCompletions: JSON.parse(localStorage.getItem("toolboxgalaxy:puzzle-completions") ?? "{}"),
    achievements: JSON.parse(localStorage.getItem("toolboxgalaxy:achievements-v1") ?? "{}"),
    scratchpad: {
      notes: localStorage.getItem("tg_scratchpad_notes") || "",
      code: localStorage.getItem("tg_scratchpad_code") || "",
      todos: localStorage.getItem("tg_scratchpad_todos") || "[]",
    },
    dailyToolVisits: {},
  };

  // Collect daily tool visits
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("toolboxgalaxy:daily-tool-visited:")) {
      profile.dailyToolVisits[key] = localStorage.getItem(key) || "true";
    }
  }

  const blob = new Blob([JSON.stringify(profile, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `toolbox-galaxy-profile-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importWorkspaceProfile(jsonString: string): { success: boolean; message: string } {
  if (typeof window === "undefined") return { success: false, message: "Window unavailable." };

  try {
    const data = JSON.parse(jsonString) as WorkspaceProfile;
    if (!data || data.version !== 1) {
      return { success: false, message: "Invalid or incompatible Galaxy backup file." };
    }

    if (Array.isArray(data.favorites)) {
      localStorage.setItem("toolbox-galaxy-favorite-tools-v1", JSON.stringify(data.favorites));
    }
    if (data.puzzleCompletions && typeof data.puzzleCompletions === "object") {
      localStorage.setItem("toolboxgalaxy:puzzle-completions", JSON.stringify(data.puzzleCompletions));
    }
    if (data.achievements && typeof data.achievements === "object") {
      localStorage.setItem("toolboxgalaxy:achievements-v1", JSON.stringify(data.achievements));
    }
    if (data.scratchpad) {
      if (data.scratchpad.notes) localStorage.setItem("tg_scratchpad_notes", data.scratchpad.notes);
      if (data.scratchpad.code) localStorage.setItem("tg_scratchpad_code", data.scratchpad.code);
      if (data.scratchpad.todos) localStorage.setItem("tg_scratchpad_todos", data.scratchpad.todos);
    }
    if (data.dailyToolVisits) {
      Object.entries(data.dailyToolVisits).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
    }

    // Trigger update events
    window.dispatchEvent(new CustomEvent("toolboxgalaxy:daily-habit-updated"));
    window.dispatchEvent(new CustomEvent("toolboxgalaxy:badge-unlocked"));
    window.dispatchEvent(new Event("storage"));

    return { success: true, message: "Profile & streaks restored successfully!" };
  } catch (err) {
    return { success: false, message: "Failed to parse JSON backup." };
  }
}
