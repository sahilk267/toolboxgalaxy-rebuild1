// Orbital Workbench: compact browser-native install control, shown only when the browser offers a PWA prompt.
import { Download } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function InstallWorkbench() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => { const onPrompt = (event: Event) => { event.preventDefault(); setPromptEvent(event as InstallPromptEvent); }; const onInstalled = () => { setInstalled(true); setPromptEvent(null); }; window.addEventListener("beforeinstallprompt", onPrompt); window.addEventListener("appinstalled", onInstalled); return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); }; }, []);
  const install = async () => { if (!promptEvent) return; await promptEvent.prompt(); const result = await promptEvent.userChoice; if (result.outcome === "accepted") setInstalled(true); setPromptEvent(null); };
  if (!promptEvent || installed) return null;
  return <button type="button" className="install-workbench" onClick={install}><Download size={15} /> Install workbench</button>;
}
