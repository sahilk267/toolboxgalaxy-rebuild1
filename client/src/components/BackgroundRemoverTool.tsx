import { Download, ImageUp, RotateCcw, ShieldCheck, X } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { assertCanvasImageEncoding } from "@/lib/imageExportValidation";
import {
  backgroundFileName, safeHexColor, validateBackgroundDimensions, validateBackgroundFile,
  type BackgroundFill,
} from "@/lib/backgroundRemovalValidation";

type Selected = { file: File; url: string; width: number; height: number };
type Result = { blob: Blob; url: string; width: number; height: number };
type WorkerResponse =
  | { type: "progress"; id: number; progress: number }
  | { type: "ready"; id: number }
  | { type: "complete"; id: number; png: Blob }
  | { type: "failed"; id: number; message: string };

const INFERENCE_EDGE = 1280;
const checkerboard = {
  backgroundColor: "#f9fafb",
  backgroundImage:
    "linear-gradient(45deg,#d1d5db 25%,transparent 25%),linear-gradient(-45deg,#d1d5db 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d1d5db 75%),linear-gradient(-45deg,transparent 75%,#d1d5db 75%)",
  backgroundPosition: "0 0,0 12px,12px -12px,-12px 0",
  backgroundSize: "24px 24px",
};

function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("This browser could not export PNG."));
      try { resolve(assertCanvasImageEncoding(blob, "image/png")); }
      catch (error) { reject(error); }
    }, "image/png");
  });
}

/** Bound decoded pixels supplied to the inference worker, without altering the user's source file. */
async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, INFERENCE_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not supported in this browser.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await canvasPng(canvas);
    canvas.width = 0; canvas.height = 0;
    return blob;
  } finally {
    bitmap.close();
  }
}

export default function BackgroundRemoverTool() {
  const [source, setSource] = useState<Selected | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [working, setWorking] = useState(false);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [fill, setFill] = useState<BackgroundFill>("transparent");
  const [custom, setCustom] = useState("#ffffff");
  const [exporting, setExporting] = useState(false);
  const worker = useRef<Worker | null>(null);
  const generation = useRef(0);

  useEffect(() => () => { generation.current += 1; worker.current?.terminate(); worker.current = null; }, []);
  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  const stop = () => {
    generation.current += 1;
    worker.current?.terminate();
    worker.current = null;
    setWorking(false);
    setProgress(null);
    setPhase("");
  };

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    stop();
    const selectionId = generation.current;
    setResult(null);
    setSource(null);
    setError("");
    const initialError = validateBackgroundFile(file);
    if (initialError) { setError(initialError); return; }
    try {
      // Decode the actual bytes; a spoofed MIME value is not sufficient.
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      if (selectionId !== generation.current) return;
      const dimensionsError = validateBackgroundDimensions(width, height);
      if (dimensionsError) { setError(dimensionsError); return; }
      const url = URL.createObjectURL(file);
      setSource({ file, url, width, height });
    } catch {
      if (selectionId === generation.current) setError("Your browser could not decode this file as a supported image.");
    }
  };

  const remove = async () => {
    if (!source || working) return;
    stop();
    const id = generation.current;
    setWorking(true);
    setProgress(null);
    setPhase("Preparing a browser-local copy…");
    setError("");
    setResult(null);
    try {
      const image = await prepareImage(source.file);
      if (id !== generation.current) return;
      const instance = new Worker(new URL("../workers/backgroundRemoval.worker.ts", import.meta.url), { type: "module" });
      worker.current = instance;
      instance.onerror = () => {
        if (id !== generation.current) return;
        setError("AI initialization failed in this browser. Try again or use a newer browser.");
        stop();
      };
      instance.onmessage = async (event: MessageEvent<WorkerResponse>) => {
        const message = event.data;
        if (!message || message.id !== id || id !== generation.current) return;
        if (message.type === "progress") {
          setPhase("Downloading local AI model assets…");
          setProgress(Math.round(message.progress));
        } else if (message.type === "ready") {
          setPhase("Removing the background on your device…");
          setProgress(null);
        } else if (message.type === "failed") {
          setError("Unable to remove the background: " + message.message);
          stop();
        } else if (message.type === "complete") {
          try {
            const decoded = await createImageBitmap(message.png);
            const { width, height } = decoded;
            decoded.close();
            if (id !== generation.current) return;
            if (validateBackgroundDimensions(width, height)) throw new Error("Output dimensions were invalid.");
            const url = URL.createObjectURL(message.png);
            setResult({ blob: message.png, url, width, height });
            setPhase("");
            setWorking(false);
            setProgress(null);
            // Dispose the heavy model and worker after output; the browser may retain its model cache.
            instance.terminate();
            if (worker.current === instance) worker.current = null;
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Output image could not be validated.");
            stop();
          }
        }
      };
      setPhase("Loading the AI model (first use may require a download)…");
      instance.postMessage({ type: "remove", id, image });
    } catch (reason) {
      if (id !== generation.current) return;
      setError(reason instanceof Error ? reason.message : "Unable to prepare the image.");
      stop();
    }
  };

  const download = async () => {
    if (!result || exporting) return;
    setExporting(true);
    setError("");
    try {
      let blob = result.blob;
      if (fill !== "transparent") {
        const background = fill === "custom" ? safeHexColor(custom) : fill === "white" ? "#ffffff" : "#000000";
        if (!background) throw new Error("Choose a valid background color.");
        const bitmap = await createImageBitmap(result.blob);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = result.width;
          canvas.height = result.height;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas rendering is unavailable.");
          context.fillStyle = background;
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(bitmap, 0, 0);
          blob = await canvasPng(canvas);
          canvas.width = 0; canvas.height = 0;
        } finally { bitmap.close(); }
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = backgroundFileName(source?.file.name || "image");
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The PNG could not be downloaded.");
    } finally { setExporting(false); }
  };

  const background =
    fill === "transparent" ? checkerboard :
    { backgroundColor: fill === "white" ? "#ffffff" : fill === "black" ? "#000000" : safeHexColor(custom) || "#ffffff" };

  return (
    <div className="runner-stack" aria-label="AI background remover">
      <div className="rounded-xl border border-white/15 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ImageUp size={26} aria-hidden="true" />
          <div><strong>Choose an image</strong><p className="text-sm text-white/60">JPG, PNG, WebP · up to 10 MB and 8 megapixels</p></div>
        </div>
        <label className="signal-button cursor-pointer">
          Browse images
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={choose} aria-label="Choose an image to remove its background" />
        </label>
      </div>
      <p className="tool-disclaimer flex gap-2 items-center">
        <ShieldCheck size={16} /> Your photo never leaves your device. First use downloads AI model assets from this website.
      </p>
      {source && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button className="signal-button" onClick={remove} disabled={working} type="button">
              {working ? "Processing…" : result ? "Remove again" : "Remove background"}
            </button>
            <button className="quiet-button" type="button" onClick={() => { stop(); setResult(null); setSource(null); setError(""); }}>
              <RotateCcw size={15} /> Reset
            </button>
            {working && <button className="quiet-button" type="button" onClick={stop}><X size={15} /> Cancel</button>}
          </div>
          {working && <p role="status" aria-live="polite">{phase} {progress !== null ? `${progress}%` : ""}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <figure className="rounded-lg overflow-hidden border border-white/15">
              <figcaption className="p-3 text-sm">Original · {source.width} × {source.height}</figcaption>
              <img className="w-full object-contain max-h-96" src={source.url} alt="Original selected image" />
            </figure>
            <figure className="rounded-lg overflow-hidden border border-white/15">
              <figcaption className="p-3 text-sm">{result ? `Background removed · ${result.width} × ${result.height}` : "Output preview"}</figcaption>
              <div className="min-h-48 grid place-items-center" style={background}>
                {result ? <img className="w-full object-contain max-h-96" src={result.url} alt="Image with background removed" /> :
                  <span className="text-sm text-slate-700 p-6">The transparent PNG preview appears here.</span>}
              </div>
            </figure>
          </div>
          {result && <div className="flex flex-wrap gap-3 items-end">
            <label>Background
              <select value={fill} onChange={(event) => setFill(event.target.value as BackgroundFill)}>
                <option value="transparent">Transparent</option>
                <option value="white">White</option>
                <option value="black">Black</option>
                <option value="custom">Custom color</option>
              </select>
            </label>
            {fill === "custom" && <label>Color <input type="color" value={custom} onChange={(event) => setCustom(event.target.value)} /></label>}
            <button className="signal-button" type="button" onClick={download} disabled={exporting}>
              <Download size={16} /> {exporting ? "Preparing…" : "Download PNG"}
            </button>
          </div>}
          <p className="text-sm text-white/60">AI output is limited to {INFERENCE_EDGE}px on the longest edge for safer mobile performance. Fine hair, glass, and complex edges may not cut out perfectly.</p>
        </>
      )}
      <p className="text-xs text-white/50">Powered by locally loaded open models. <a className="underline" href="/licenses/background-remover-notice.txt" target="_blank" rel="noopener noreferrer">AI model and license notices</a>.</p>
      {error && <p className="image-resizer__error" role="alert">{error}</p>}
    </div>
  );
}
