// Orbital Workbench: an explicit reload choice when the static PWA worker has a newer cached release ready.
import { RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function PwaUpdateNotice() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [reloading, setReloading] = useState(false);
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let requestedReload = false;
    const onControllerChange = () => { if (requestedReload) window.location.reload(); };
    const inspectRegistration = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) setWaitingWorker(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) setWaitingWorker(installing);
        });
      });
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    navigator.serviceWorker.getRegistration().then((registration) => { if (registration) inspectRegistration(registration); }).catch(() => undefined);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);
  const applyUpdate = () => { if (!waitingWorker) return; setReloading(true); waitingWorker.postMessage({ type: "SKIP_WAITING" }); };
  if (!waitingWorker) return null;
  return <aside className="pwa-update-notice" aria-live="polite"><div><p className="mono-label">NEW WORKBENCH BUILD READY</p><strong>Refresh when you are ready.</strong><span>Your current tab stays unchanged until you apply it.</span></div><button type="button" onClick={applyUpdate} disabled={reloading} className="pwa-update-notice__apply"><RefreshCw size={15} className={reloading ? "animate-spin" : ""} />{reloading ? "Refreshing…" : "Refresh"}</button><button type="button" onClick={() => setWaitingWorker(null)} className="pwa-update-notice__dismiss" aria-label="Dismiss update notice"><X size={16} /></button></aside>;
}
