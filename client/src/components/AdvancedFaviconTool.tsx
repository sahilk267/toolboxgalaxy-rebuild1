import JSZip from "jszip";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Check, Clipboard, Download, ImageUp, RotateCcw, ShieldCheck } from "lucide-react";
import {
  FAVICON_SIZES, faviconFileError, encodePngIco, faviconManifest, faviconHtmlSnippet,
} from "@/lib/faviconPackage";

type Generated = { icons: Record<number, Blob>; ico: Blob; zip: Blob };
type Fit = "crop" | "contain";

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function pngFromCanvas(bitmap: ImageBitmap, dimension: number, fit: Fit, background: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = dimension; canvas.height = dimension;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser.");
  if (background !== "transparent") {
    context.fillStyle = background;
    context.fillRect(0, 0, dimension, dimension);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (fit === "crop") {
    const square = Math.min(bitmap.width, bitmap.height);
    context.drawImage(bitmap, (bitmap.width-square)/2, (bitmap.height-square)/2,
      square, square, 0, 0, dimension, dimension);
  } else {
    const scale = Math.min(dimension / bitmap.width, dimension / bitmap.height);
    const w = bitmap.width * scale, h = bitmap.height * scale;
    context.drawImage(bitmap, (dimension - w)/2, (dimension - h)/2, w, h);
  }
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(blob => blob && blob.type === "image/png" ? resolve(blob) :
      reject(new Error("PNG export is not supported.")), "image/png"));
}

export default function AdvancedFaviconTool() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [generatedPreview, setGeneratedPreview] = useState("");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [fit, setFit] = useState<Fit>("crop");
  const [background, setBackground] = useState("transparent");
  const [name, setName] = useState("My Website");
  const [themeColor, setThemeColor] = useState("#ffffff");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const generation = useRef(0);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { if (generatedPreview) URL.revokeObjectURL(generatedPreview); }, [generatedPreview]);
  const invalidate = () => { generation.current++; setGenerated(null); setGeneratedPreview(""); setStatus(""); setWorking(false); };

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    event.target.value = "";
    if (!next) return;
    let problem = faviconFileError(next.type, next.size);
    if (problem) { setError(problem); return; }
    try {
      const bitmap = await createImageBitmap(next);
      problem = faviconFileError(next.type, next.size, bitmap.width, bitmap.height);
      bitmap.close();
      if (problem) { setError(problem); return; }
      invalidate();
      setFile(next);
      setPreview(URL.createObjectURL(next));
      setError("");
    } catch { setError("Image could not be decoded in your browser."); }
  }

  function reset() {
    invalidate(); setFile(null); setPreview(""); setFit("crop");
    setBackground("transparent"); setName("My Website"); setThemeColor("#ffffff");
    setError(""); setWorking(false);
  }

  async function buildPackage() {
    if (!file || working) return;
    const job = ++generation.current;
    setWorking(true); setError(""); setStatus("Creating icon variants...");
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(file);
      if (faviconFileError(file.type, file.size, bitmap.width, bitmap.height)) throw new Error("Invalid image dimensions.");
      const icons: Record<number, Blob> = {};
      for (const dimension of FAVICON_SIZES) {
        icons[dimension] = await pngFromCanvas(bitmap, dimension, fit, background);
        if (generation.current !== job) return;
      }
      const frames = await Promise.all(([16,32,48] as const).map(async size => ({
        size, png: new Uint8Array(await icons[size].arrayBuffer()),
      })));
      const ico = new Blob([encodePngIco(frames)], { type: "image/x-icon" });
      const zip = new JSZip();
      for (const dimension of [16,32,48]) zip.file("favicon-" + dimension + "x" + dimension + ".png", icons[dimension]);
      zip.file("favicon.ico", ico);
      zip.file("apple-touch-icon.png", icons[180]);
      zip.file("android-chrome-192x192.png", icons[192]);
      zip.file("android-chrome-512x512.png", icons[512]);
      zip.file("site.webmanifest", faviconManifest(name, themeColor));
      zip.file("favicon-html-snippet.txt", faviconHtmlSnippet());
      setStatus("Compressing website favicon package...");
      const archive = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      if (generation.current !== job) return;
      setGenerated({ icons, ico, zip: archive });
      setGeneratedPreview(URL.createObjectURL(icons[180]));
      setStatus("Complete website icon package is ready.");
    } catch (reason) {
      if (generation.current === job) setError(reason instanceof Error ? reason.message : "Unable to create favicon package.");
    } finally {
      if (bitmap) bitmap.close();
      if (generation.current === job) setWorking(false);
    }
  }

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(faviconHtmlSnippet());
      setCopied(true); window.setTimeout(() => setCopied(false), 1500);
    } catch { setError("Clipboard unavailable; select the HTML snippet manually."); }
  }

  return <div className="runner-stack" data-tool="advanced-favicon">
    <div className="favicon-upload">
      <ImageUp size={22} />
      <div><strong>Upload an icon source</strong><p>Center-crop (legacy default) or fit inside a square. Files stay in your browser.</p></div>
      <label className="signal-button image-upload-button">Choose image
        <input data-field="favicon-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile} />
      </label>
    </div>
    <p className="tool-disclaimer">PNG / JPG / WebP only, up to 5 MB and 20 megapixels. Use a high-resolution square source for the best result.</p>
    {file && <div className="favicon-tool__workbench">
      <figure><figcaption>SOURCE</figcaption><img src={preview} alt="Chosen icon source" /></figure>
      <div className="favicon-tool__controls">
        <label>Fit mode
          <select data-field="favicon-fit" value={fit} onChange={event => { invalidate(); setFit(event.target.value as Fit); }}>
            <option value="crop">Crop to square</option><option value="contain">Contain whole image</option>
          </select>
        </label>
        <label>Canvas background
          <select value={background} onChange={event => { invalidate(); setBackground(event.target.value); }}>
            <option value="transparent">Transparent (PNG)</option><option value="#ffffff">White</option>
            <option value="#000000">Black</option><option value={themeColor}>Theme color</option>
          </select>
        </label>
        <label>Website name
          <input data-field="favicon-name" value={name} maxLength={80} onChange={event => { invalidate(); setName(event.target.value); }} />
        </label>
        <label>Theme color
          <input data-field="favicon-color" type="color" value={themeColor} onChange={event => { invalidate(); setThemeColor(event.target.value); }} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="signal-button" type="button" disabled={working} onClick={() => void buildPackage()}>
            <Download size={16} /> {working ? "Generating..." : "Create favicon package"}
          </button>
          <button className="reset-button" type="button" onClick={reset}><RotateCcw size={16} /> Clear</button>
        </div>
      </div>
      {generatedPreview ? <figure><figcaption>APPLE TOUCH PREVIEW · 180 × 180</figcaption>
        <div className="favicon-output"><img src={generatedPreview} alt="Generated 180 pixel favicon" />
          <span className="text-sm">Generated 16, 32, 48, 180, 192, 512px PNGs + multiframe ICO</span>
        </div></figure> : <div className="favicon-output-placeholder">Generated icons preview</div>}
    </div>}
    {status && <p role="status" className="text-sm">{status}</p>}
    {error && <p role="alert" className="image-resizer__error">{error}</p>}
    {generated && <section className="rounded-xl border border-white/15 p-4" aria-label="Favicon exports">
      <h2 className="font-semibold">Download complete icon kit</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="signal-button" onClick={() => triggerDownload(generated.zip, "toolboxgalaxy-favicon-kit.zip")}><Download size={16} /> Download ZIP</button>
        <button type="button" className="quiet-button" onClick={() => triggerDownload(generated.ico, "favicon.ico")}><Download size={16} /> Download ICO</button>
        <button type="button" className="quiet-button" onClick={() => triggerDownload(generated.icons[180], "apple-touch-icon.png")}><Download size={16} /> Apple PNG</button>
        <button type="button" className="quiet-button" onClick={() => void copySnippet()}>{copied ? <Check size={16}/> : <Clipboard size={16}/>} {copied ? "Copied" : "Copy HTML links"}</button>
      </div>
      <p className="mt-3 text-xs text-white/60"><ShieldCheck size={14} className="inline"/> Includes icon sizes, manifest and installation snippet. PNG-compressed ICO frames are intended for modern browsers; test older environments separately.</p>
      <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 p-3 text-xs">{faviconHtmlSnippet()}</pre>
    </section>}
  </div>;
}
