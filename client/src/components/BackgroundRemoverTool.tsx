import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Download, ImageUp, RotateCcw, ShieldCheck, X } from "lucide-react";
import {
  backgroundDimensionError, backgroundFileError, inferenceSize,
  safeOutputFilename, validHexColor, type BackgroundMode,
} from "@/lib/backgroundRemovalValidation";
import { assertCanvasImageEncoding } from "@/lib/imageExportValidation";

type LoadedFile = { file: File; url: string; width: number; height: number };
type ProcessedFile = { blob: Blob; url: string; width: number; height: number };
type WorkerResponse =
  | { type: "LOADING"; id: number; progress?: number }
  | { type: "DONE"; id: number; blob: Blob }
  | { type: "ERROR"; id: number; error: string };

function toPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Your browser could not create the PNG."));
      try { resolve(assertCanvasImageEncoding(blob, "image/png")); }
      catch (error) { reject(error); }
    }, "image/png");
  });
}

async function composeFullResolution(original: File, matte: Blob): Promise<Blob> {
  const source = await createImageBitmap(original);
  let mask: ImageBitmap | undefined;
  let canvas: HTMLCanvasElement | null = null;
  try {
    mask = await createImageBitmap(matte);
    const error = backgroundDimensionError({ width: source.width, height: source.height });
    if (error) throw new Error(error);
    canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available in this browser.");
    context.drawImage(source, 0, 0);
    // Use the AI cut-out only as an alpha matte, preserving original RGB detail.
    context.globalCompositeOperation = "destination-in";
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(mask, 0, 0, source.width, source.height);
    context.globalCompositeOperation = "source-over";
    return await toPng(canvas);
  } finally {
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    source.close();
    mask?.close();
  }
}

export default function BackgroundRemoverTool() {
  const [source, setSource] = useState<LoadedFile | null>(null);
  const [output, setOutput] = useState<ProcessedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<BackgroundMode>("transparent");
  const [customColor, setCustomColor] = useState("#c7f36b");
  const [compare, setCompare] = useState(50);
  const worker = useRef<Worker | null>(null);
  const job = useRef(0);

  useEffect(() => () => { worker.current?.terminate(); job.current++; }, []);
  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);
  useEffect(() => () => { if (output) URL.revokeObjectURL(output.url); }, [output]);

  function cancel() {
    job.current++;
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
    setProgress(null);
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const fileError = backgroundFileError(file.type, file.size);
    if (fileError) { setError(fileError); return; }
    cancel();
    const selectionId = job.current;
    setOutput(null);
    setError("");
    try {
      const bitmap = await createImageBitmap(file);
      const width = bitmap.width, height = bitmap.height;
      bitmap.close();
      if (selectionId !== job.current) return;
      const validation = backgroundDimensionError({ width, height });
      if (validation) { setError(validation); return; }
      const url = URL.createObjectURL(file);
      setSource({ file, url, width, height });
      setMode("transparent");
      setCompare(50);
    } catch {
      if (selectionId !== job.current) return;
      setError("This image could not be decoded. Try another JPG, PNG or WebP.");
    }
  }

  function clear() {
    cancel();
    setSource(null);
    setOutput(null);
    setError("");
  }

  function removeBackground() {
    if (!source || busy) return;
    cancel();
    const id = job.current;
    setError("");
    setOutput(null);
    setBusy(true);
    setProgress(null);
    try {
      const next = new Worker(
        new URL("../workers/backgroundRemoval.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.current = next;
      next.onmessage = async (event: MessageEvent<WorkerResponse>) => {
        const message = event.data;
        if (message.id !== job.current) return;
        if (message.type === "LOADING") {
          setProgress(Number.isFinite(message.progress) ? Math.round(message.progress!) : null);
          return;
        }
        if (message.type === "ERROR") {
          setError("AI processing failed. Please retry or try a smaller image. " + message.error);
          setBusy(false);
          next.terminate();
          if (worker.current === next) worker.current = null;
          return;
        }
        try {
          const blob = await composeFullResolution(source.file, message.blob);
          if (id !== job.current) return;
          const url = URL.createObjectURL(blob);
          setOutput({ blob, url, width: source.width, height: source.height });
        } catch (reason) {
          if (id === job.current) setError(reason instanceof Error ? reason.message : "Could not render the output.");
        } finally {
          if (id === job.current) {
            setBusy(false);
            setProgress(null);
            next.terminate();
            if (worker.current === next) worker.current = null;
          }
        }
      };
      next.onerror = () => {
        if (id !== job.current) return;
        setError("The browser AI worker failed. Try a smaller photo or another browser.");
        setBusy(false);
        setProgress(null);
        next.terminate();
        if (worker.current === next) worker.current = null;
      };
      next.postMessage({ type: "PROCESS", id, file: source.file });
    } catch {
      setBusy(false);
      setError("This browser could not start local AI processing.");
    }
  }

  async function download() {
    if (!source || !output || saving || (mode === "custom" && !validHexColor(customColor))) return;
    setSaving(true);
    setError("");
    try {
      let blob = output.blob;
      if (mode !== "transparent") {
        const bitmap = await createImageBitmap(blob);
        let canvas: HTMLCanvasElement | null = null;
        try {
          canvas = document.createElement("canvas");
          canvas.width = output.width;
          canvas.height = output.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas is unavailable.");
          ctx.fillStyle = mode === "white" ? "#ffffff" : mode === "black" ? "#000000" : customColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(bitmap, 0, 0);
          blob = await toPng(canvas);
        } finally {
          if (canvas) { canvas.width = 0; canvas.height = 0; }
          bitmap.close();
        }
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = safeOutputFilename(source.file.name);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Download failed.");
    } finally { setSaving(false); }
  }

  const previewBackground = mode === "white" ? "#ffffff" : mode === "black" ? "#000000" : mode === "custom" && validHexColor(customColor) ? customColor : undefined;
  const approximateInference = source ? inferenceSize(source) : null;

  return (
    <div className="runner-stack" style={{ gap: "1.25rem" }}>
      <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><ImageUp size={23} /><div><strong>Choose a photo</strong><p className="text-sm text-white/60">JPG, PNG or WebP · up to 10 MB / 8 megapixels</p></div></div>
          <label className="signal-button cursor-pointer">Upload image
            <input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" onChange={chooseFile} aria-label="Select image for background removal" />
          </label>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-white/60"><ShieldCheck size={16} /> Your image stays on this device. The AI model files load from ToolBoxGalaxy's host.</p>
      </div>

      {source && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/70">{source.width} × {source.height} · AI analyzes at {approximateInference?.width} × {approximateInference?.height}, exports original dimensions</p>
            <button className="quiet-button" type="button" onClick={clear}><RotateCcw size={16} /> Reset</button>
          </div>
          <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-white/15" style={{ aspectRatio: source.width + " / " + source.height, maxHeight: "520px", backgroundColor: previewBackground, backgroundImage: mode === "transparent" ? "linear-gradient(45deg,#64748b33 25%,transparent 25%),linear-gradient(-45deg,#64748b33 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#64748b33 75%),linear-gradient(-45deg,transparent 75%,#64748b33 75%)" : undefined, backgroundSize: "24px 24px", backgroundPosition: "0 0,0 12px,12px -12px,-12px 0" }}>
            <img src={source.url} alt="Original photo" className="absolute inset-0 h-full w-full object-contain" style={output ? { clipPath: "inset(0 " + (100 - compare) + "% 0 0)" } : undefined} />
            {output && <img src={output.url} alt="Photo with background removed" className="absolute inset-0 h-full w-full object-contain" style={{ clipPath: "inset(0 0 0 " + compare + "%)" }} />}
            {output && <div aria-hidden="true" className="absolute bottom-0 top-0 w-px bg-white shadow-lg" style={{ left: compare + "%" }} />}
          </div>
          {output && <label className="block text-sm">Compare original and removed background
            <input className="mt-2 w-full" type="range" min="0" max="100" value={compare} onChange={(event) => setCompare(Number(event.target.value))} aria-label="Reveal background removed photo" />
          </label>}
          {output && <div className="flex flex-wrap items-center gap-3">
            <label>Background
              <select value={mode} onChange={(event) => setMode(event.target.value as BackgroundMode)} className="ml-2">
                <option value="transparent">Transparent</option><option value="white">White</option>
                <option value="black">Black</option><option value="custom">Custom color</option>
              </select>
            </label>
            {mode === "custom" && <label>Color <input type="color" value={customColor} onChange={(event) => setCustomColor(event.target.value)} aria-label="Custom background color" /></label>}
          </div>}
          <div className="flex flex-wrap items-center gap-3">
            <button className="signal-button" type="button" disabled={busy} onClick={removeBackground}>{busy ? "Processing locally…" : output ? "Remove again" : "Remove background"}</button>
            {busy && <button type="button" className="quiet-button" onClick={cancel}><X size={16} /> Cancel</button>}
            {output && <button type="button" className="quiet-button" disabled={saving} onClick={download}><Download size={16} /> {saving ? "Preparing PNG…" : "Download PNG"}</button>}
          </div>
          {busy && <p role="status" aria-live="polite" className="text-sm text-white/70">Loading AI / processing image{progress === null ? "…" : " · " + progress + "%"} First visit downloads model assets; this may take longer on slow connections.</p>}
          {output && <p role="status" className="text-sm text-white/60">Result ready · {output.width} × {output.height}. Check fine hair and transparent objects before use.</p>}
        </>
      )}
      {error && <p role="alert" className="rounded-lg border border-red-400/50 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <p className="tool-disclaimer">AI edges are approximate. Background-removal results can be less accurate for hair, glass, pets and complex scenes. No signup and no server-side image upload.</p>
      <p className="text-xs text-white/60">Apache-2.0 model/runtime notices: <a className="underline" href="/licenses/AI-THIRD-PARTY-NOTICES.txt" target="_blank" rel="noopener noreferrer">view third-party licenses</a></p>
    </div>
  );
}
