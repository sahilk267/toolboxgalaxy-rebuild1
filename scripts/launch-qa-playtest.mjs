const preview = "https://3000-icfpg7yyn0cp1goiy9qur-376e73c5.sg1.manus.computer";
const targets = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const target = targets.find((item) => item.type === "page" && item.url.includes("3000-icfpg7yyn0cp1goiy9qur-376e73c5")) ?? targets.find((item) => item.type === "page");
if (!target?.webSocketDebuggerUrl) throw new Error("No Chromium page target is available for launch QA.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
let serial = 0;
const pending = new Map();
await new Promise((resolve, reject) => { socket.addEventListener("open", () => resolve(), { once: true }); socket.addEventListener("error", () => reject(new Error("Could not connect to the browser debugger.")), { once: true }); });
socket.addEventListener("message", (event) => { const message = JSON.parse(String(event.data)); if (!message.id) return; const callback = pending.get(message.id); if (!callback) return; pending.delete(message.id); message.error ? callback.reject(new Error(message.error.message)) : callback.resolve(message.result); });
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
const evaluate = async (expression) => { const result = await send("Runtime.evaluate", { expression: `(() => { ${expression} })()`, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(`${result.exceptionDetails.text}: ${result.exceptionDetails.exception?.description ?? ""}`); return result.result?.value; };
const navigate = async (path) => { await send("Page.navigate", { url: `${preview}${path}` }); await wait(700); };
const typeInto = async (selector, text) => { const focused = await evaluate(`const field = document.querySelector(${JSON.stringify(selector)}); if (!(field instanceof HTMLElement)) return false; field.focus(); return document.activeElement === field;`); if (!focused) throw new Error(`Could not focus ${selector}`); await send("Input.insertText", { text }); await wait(90); };
const checks = [];
const check = (name, pass, detail) => checks.push({ name, status: pass ? "PASS" : "FAIL", detail });

try {
  await navigate("/contact");
  check("Contact console copy", await evaluate("return document.querySelector('.contact-page h1')?.textContent === 'Send a useful signal.' && document.querySelector('.contact-readout')?.textContent?.includes('LOCAL DRAFT / EMAIL RELAY');"), "The public contact route clearly presents the email relay instead of implying an active backend.");
  const defaultRelayHref = await evaluate("const link = document.querySelector('[data-contact-relay]'); return link instanceof HTMLAnchorElement ? link.href : ''; ");
  check("Contact relay default", await evaluate("const link = document.querySelector('[data-contact-relay]'); return link instanceof HTMLAnchorElement && link.href.startsWith('mailto:support@toolboxgalaxy.com?') && decodeURIComponent(link.href).includes('subject=Tool feedback');"), `The fallback action is a visible mailto link with the expected support destination and default subject. Observed ${defaultRelayHref}`);
  await typeInto('.contact-form input[required]:not([type="email"])', 'QA Pilot'); await typeInto('.contact-form input[type="email"]', 'qa@example.test'); await typeInto('.contact-form textarea', 'The final public launch QA confirms this email relay draft behavior.');
  check("Contact relay draft handoff", await evaluate("const link = document.querySelector('[data-contact-relay]'); return link instanceof HTMLAnchorElement && decodeURIComponent(link.href).includes('Name: QA Pilot') && decodeURIComponent(link.href).includes('Email: qa@example.test') && decodeURIComponent(link.href).includes('final public launch QA');"), "Real browser text input updates only the user-triggered email draft handoff; no form request is made.");
  await navigate("/privacy");
  check("Privacy evidence ledger", await evaluate("return document.querySelectorAll('.policy-ledger-section').length === 4 && document.querySelector('.policy-readouts')?.textContent?.includes('LOCAL EXECUTION') && document.querySelector('.policy-page')?.textContent?.includes('CURRENT TAB ONLY') && document.querySelector('.policy-page')?.textContent?.includes('NO AUTO-SEND');"), "The public privacy route provides four readable operational ledger sections with local-only status readouts.");
  await navigate("/tools");
  check("Tools mounted module bays", await evaluate("return document.querySelectorAll('.tool-group__readout').length >= 4 && document.querySelector('.tool-module-fields') && document.querySelector('.tool-group__readout')?.textContent?.includes('BROWSER-LOCAL EXECUTOR');"), "The all-category public Tools view exposes mounted browser-local bay readouts instead of a purely repeated card catalogue.");
  await typeInto('.search-field input', 'UUID');
  check("Tool search narrow state", await evaluate("return document.querySelector('.tools-result-line')?.textContent?.includes('01 verified module') && document.querySelector('.tool-card')?.textContent?.includes('UUID Generator') && !document.querySelector('.empty-state');"), "A real keyboard search narrows the public tool registry without breaking its verified-module count or empty-state behavior.");
  await typeInto('.search-field input', 'unlikely-tool-query');
  check("Tool search empty state", await evaluate("return document.querySelector('.empty-state')?.textContent?.includes('NO MODULE FOUND') && document.querySelector('.tools-result-line')?.textContent?.includes('00 verified modules');"), "The public tool search supplies an explicit recovery state when no module matches.");
  await navigate("/terms");
  check("Terms public route", await evaluate("return document.body.textContent?.includes('Terms') && Boolean(document.querySelector('a[href=\"/\"]'));"), "The legal route renders after direct navigation and retains a public recovery path.");
  await navigate("/missing-public-route");
  check("Public fallback route", await evaluate("return document.body.textContent?.includes('404') && document.querySelector('a[href=\"/\"]') instanceof HTMLAnchorElement;"), "An unknown direct route renders a visible recovery path back to the public overview.");
} catch (error) { checks.push({ name: "Launch QA runtime", status: "FAIL", detail: error instanceof Error ? error.message : String(error) }); }

console.table(checks);
socket.close();
if (checks.some((check) => check.status === "FAIL")) process.exitCode = 1;
