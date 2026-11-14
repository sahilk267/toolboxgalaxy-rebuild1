// Orbital Workbench: browser-only image resizing with no upload, no crop, and explicit export controls.
import { Download, ImageUp, Lock, Unlock } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { trackPageView } from "@/lib/analytics";
import { assertCanvasImageEncoding } from "@/lib/imageExportValidation";

type LoadedImage = { file: File; url: string; width: number; height: number };
type OutputImage = { blob: Blob; url: string; width: number; height: number; type: string };

const MAX_RESIZE_SIDE = 8192;
const MAX_RESIZE_PIXELS = 16_000_000;

/** Bound BOTH dimensions when ratio-lock is active, including extreme portrait images. */
export function fitResizeDimensions(
  sourceWidth: number, sourceHeight: number,
  currentWidth: number, currentHeight: number,
  axis: "width" | "height", raw: string, locked: boolean
): { width: number; height: number } | null {
  const input = Number(raw);
  if (!Number.isFinite(input) || input <= 0 ||
      !Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight) ||
      sourceWidth <= 0 || sourceHeight <= 0) return null;

  const cap = (value: number) => Math.max(1, Math.min(MAX_RESIZE_SIDE, Math.round(value)));
  const requested = cap(input);
  if (!locked) {
    return {
      width: axis === "width" ? requested : cap(currentWidth),
      height: axis === "height" ? requested : cap(currentHeight),
    };
  }

  const ratio = sourceWidth / sourceHeight;
  let width = axis === "width" ? requested : Math.max(1, Math.round(requested * ratio));
  let height = axis === "height" ? requested : Math.max(1, Math.round(requested / ratio));
  const scale = Math.min(1, MAX_RESIZE_SIDE / Math.max(width, height));
  width = cap(Math.floor(width * scale));
  height = cap(Math.floor(height * scale));
  return { width, height };
}

/** Refuse memory-intensive canvas allocation instead of rendering an unsafe image. */
export function imageResizeError(width: number, height: number): string | null {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 1 || height < 1 || width > MAX_RESIZE_SIDE || height > MAX_RESIZE_SIDE) {
    return "Width and height must be whole numbers between 1 and 8,192 pixels.";
  }
  if (width * height > MAX_RESIZE_PIXELS) {
    return "Output exceeds 16 megapixels. Reduce the dimensions before resizing.";
  }
  return null;
}


const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
const readDimensions = (file: File) => new Promise<LoadedImage>((resolve, reject) => { const url = URL.createObjectURL(file); const image = new Image(); image.onload = () => resolve({ file, url, width: image.naturalWidth, height: image.naturalHeight }); image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This image could not be read in your browser.")); }; image.src = url; });

export default function ImageResizerTool() {
  const [source, setSource] = useState<LoadedImage | null>(null); const [output, setOutput] = useState<OutputImage | null>(null); const [width, setWidth] = useState(0); const [height, setHeight] = useState(0); const [locked, setLocked] = useState(true); const [format, setFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/webp"); const [quality, setQuality] = useState(84); const [error, setError] = useState(""); const [working, setWorking] = useState(false);
  const selectedFileRevision = useRef(0);
  const outputRevision = useRef(0);
  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);
  useEffect(() => () => { if (output) URL.revokeObjectURL(output.url); }, [output]);
  // Never offer a stale download after changing output dimensions or encoding options.
  useEffect(() => {
    outputRevision.current++;
    setOutput(null);
  }, [source, width, height, format, quality]);
  const summary = useMemo(() => source ? `${source.width} × ${source.height} · ${formatBytes(source.file.size)}` : "Choose a PNG, JPG, WebP, or GIF frame to begin.", [source]);
  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const revision = ++selectedFileRevision.current;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file in a browser-supported format.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("For a responsive browser workflow, choose an image smaller than 25 MB.");
      return;
    }
    setError("");
    setOutput(null);
    try {
      const next = await readDimensions(file);
      if (revision !== selectedFileRevision.current) {
        URL.revokeObjectURL(next.url);
        return;
      }
      setSource(next);
      setWidth(next.width);
      setHeight(next.height);
    } catch (reason) {
      if (revision === selectedFileRevision.current) {
        setError(reason instanceof Error ? reason.message : "The image could not be opened.");
      }
    }
  };

  const setDimension = (axis: "width" | "height", raw: string) => {
    if (!source) return;
    const next = fitResizeDimensions(source.width, source.height, width, height, axis, raw, locked);
    if (!next) return;
    setWidth(next.width);
    setHeight(next.height);
  };
  const resize = async () => {
    if (!source || working) return;
    const validationError = imageResizeError(width, height);
    if (validationError) { setError(validationError); return; }
    const revision = outputRevision.current;
    setWorking(true);
    setError("");
    let canvas: HTMLCanvasElement | null = null;
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("The selected image could not be processed."));
        image.src = source.url;
      });
      if (revision !== outputRevision.current) return;
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas resizing is not available in this browser.");
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, width, height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas!.toBlob(value => value ? resolve(value) :
          reject(new Error("The browser could not create the resized file.")),
        format, format === "image/png" ? undefined : quality / 100));
      if (revision !== outputRevision.current) return;
      assertCanvasImageEncoding(blob, format);
      const url = URL.createObjectURL(blob);
      setOutput({ blob, url, width, height, type: format });
      trackPageView(undefined, undefined, "image-resized", { format, tool_slug: "image-resizer" });
    } catch (reason) {
      if (revision === outputRevision.current) {
        setError(reason instanceof Error ? reason.message : "The image could not be resized.");
      }
    } finally {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      setWorking(false);
    }
  };

  const extension = output?.type === "image/jpeg" ? "jpg" : output?.type === "image/png" ? "png" : "webp";
  return <div className="image-resizer"><div className="image-resizer__drop"><ImageUp size={24} /><div><strong>Load image locally</strong><p>{summary}</p></div><label className="signal-button image-upload-button">Choose image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectFile} /></label></div>{source && <><div className="image-resizer__controls"><label>Width (px)<input inputMode="numeric" min="1" max="8192" value={width} onChange={(event) => setDimension("width", event.target.value)} /></label><button type="button" className={`dimension-lock ${locked ? "dimension-lock--on" : ""}`} onClick={() => setLocked((value) => !value)} aria-pressed={locked}>{locked ? <Lock size={16} /> : <Unlock size={16} />} {locked ? "Ratio locked" : "Ratio unlocked"}</button><label>Height (px)<input inputMode="numeric" min="1" max="8192" value={height} onChange={(event) => setDimension("height", event.target.value)} /></label><label>Export<select value={format} onChange={(event) => setFormat(event.target.value as typeof format)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></label><label className={format === "image/png" ? "quality-field quality-field--disabled" : "quality-field"}>Quality <strong>{quality}</strong><input type="range" min="40" max="100" value={quality} disabled={format === "image/png"} onChange={(event) => setQuality(Number(event.target.value))} /></label></div><p className="tool-disclaimer">No crop is applied. With ratio lock on, every pixel of your image is preserved inside the resized frame. JPG exports use a white background for transparent areas.</p><div className="image-resizer__preview"><figure><figcaption>Source · {source.width} × {source.height}</figcaption><img src={source.url} alt="Selected image preview" /></figure><figure><figcaption>{output ? `Output · ${output.width} × ${output.height} · ${formatBytes(output.blob.size)}` : "Output preview"}</figcaption>{output ? <img src={output.url} alt="Resized image preview" /> : <div className="image-preview-placeholder">Resize output appears here</div>}</figure></div><div className="image-resizer__actions"><button className="signal-button" disabled={working} onClick={resize}>{working ? "Processing…" : "Resize image"}</button>{output && <a className="quiet-button" href={output.url} download={`toolbox-galaxy-resized.${extension}`}><Download size={16} /> Download {extension.toUpperCase()}</a>}</div></>}{error && <p className="image-resizer__error" role="alert">{error}</p>}</div>;
}
