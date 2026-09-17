import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAnalytics } from "./lib/analytics";

// Initialize privacy-respecting, cookieless analytics if configured in env (clean no-op otherwise)
initAnalytics();

createRoot(document.getElementById("root")!).render(<App />);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("/service-worker.js").catch(() => undefined); }, { once: true });
}
