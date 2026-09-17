/* Orbital Workbench / EXIF & GPS Metadata Remover & Privacy Relay */
import { Download, FileOutput, ImageUp, RotateCcw, ShieldCheck, Sparkles, MapPin, Camera, Clock, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { imageMetadataLimits, metadataDimensionError, metadataFileError, metadataFormatExtension, metadataFormatLabel, type MetadataImageFormat } from "@/lib/localImageMetadata";
import { parseExifFromBlob, type ExifTagSummary } from "@/lib/exifReader";

type SourceImage = { file: File; url: string; width: number; height: number; basename: string; format: MetadataImageFormat };
type CleanOutput = { blob: Blob; url: string; width: number; height: number; format: MetadataImageFormat };

const describeBytes = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const sourceFromFile = (file: File) => new Promise<SourceImage>((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
    const error = metadataDimensionError(dimensions);
    if (error) {
      URL.revokeObjectURL(url);
      reject(new Error(error));
      return;
    }
    resolve({
      file,
      url,
      ...dimensions,
      basename: file.name.replace(/\.[^/.]+$/, "") || "image",
      format: file.type as MetadataImageFormat
    });
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error("This image could not be decoded in your browser."));
  };
  image.src = url;
});

export default function ImageMetadataTool() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [output, setOutput] = useState<CleanOutput | null>(null);
  const [exifData, setExifData] = useState<ExifTagSummary | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [fileKey, setFileKey] = useState(0);

  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);
  useEffect(() => () => { if (output) URL.revokeObjectURL(output.url); }, [output]);

  const sourceSummary = useMemo(() =>
    source ? `${metadataFormatLabel(source.format)} · ${source.width} × ${source.height} · ${describeBytes(source.file.size)}` :
    `PNG, JPG, or WebP · up to 20 MB / ${imageMetadataLimits.maxEdge.toLocaleString()} px edge`,
    [source]
  );

  const clearOutput = () => setOutput((current) => {
    if (current) URL.revokeObjectURL(current.url);
    return null;
  });

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileError = metadataFileError(file);
    if (fileError) {
      setError(fileError);
      return;
    }

    setWorking(true);
    setError("");
    clearOutput();
    setExifData(null);

    try {
      const [next, exif] = await Promise.all([
        sourceFromFile(file),
        parseExifFromBlob(file)
      ]);
      setSource((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return next;
      });
      setExifData(exif);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The image could not be opened.");
    } finally {
      setWorking(false);
    }
  };

  const clean = async () => {
    if (!source) return;
    setWorking(true);
    setError("");

    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("The selected image could not be processed."));
        image.src = source.url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = source.width;
      canvas.height = source.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas re-export is not available in this browser.");

      if (source.format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.drawImage(image, 0, 0, source.width, source.height);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error("The browser could not create this clean image."))),
          source.format,
          source.format === "image/png" ? undefined : 0.92
        )
      );

      const url = URL.createObjectURL(blob);
      setOutput((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { blob, url, width: source.width, height: source.height, format: source.format };
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The clean re-export could not be created.");
    } finally {
      setWorking(false);
    }
  };

  const reset = () => {
    clearOutput();
    setSource((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setExifData(null);
    setError("");
    setWorking(false);
    setFileKey((current) => current + 1);
  };

  const hasPrivacyRisk = exifData && (exifData.gps || exifData.make || exifData.model || exifData.dateTime);

  return (
    <div className="image-metadata" data-image-metadata>
      {/* Upload Banner */}
      <div className="image-metadata__upload">
        <ImageUp size={25} />
        <div>
          <strong>Choose an image to audit EXIF/GPS &amp; wipe metadata</strong>
          <p>{sourceSummary}</p>
        </div>
        <label className="signal-button image-upload-button">
          Choose image
          <input key={fileKey} data-field="metadata-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={choose} />
        </label>
      </div>

      {source ? (
        <>
          <div className="instrument-signature instrument-signature--metadata">
            <span>PRIVACY RELAY / LOCAL EXIF AUDIT</span>
            <b>{source.width} × {source.height} NATIVE FRAME</b>
            <i aria-hidden="true"><em /><em /><em /><em /></i>
          </div>

          {/* EXIF / GPS Audit Card */}
          {exifData && (
            <div className="my-4 p-4 rounded-xl bg-[#0e1628] border border-white/10 text-xs font-mono space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Camera size={16} className="text-sky-400" />
                  <span className="font-bold text-white uppercase">METADATA &amp; GPS AUDIT SCAN</span>
                </div>
                {hasPrivacyRisk ? (
                  <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    <AlertTriangle size={13} />
                    <span>METADATA DETECTED</span>
                  </span>
                ) : (
                  <span className="text-lime-400 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>NO EXIF DETECTED</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {exifData.model && (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                    <span className="text-white/40 block text-[11px]">DEVICE / CAMERA</span>
                    <b className="text-slate-200">{exifData.make ? `${exifData.make} ` : ""}{exifData.model}</b>
                    {exifData.lensModel && <p className="text-white/50 text-[10px]">{exifData.lensModel}</p>}
                  </div>
                )}

                {exifData.dateTime && (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                    <span className="text-white/40 block text-[11px]">DATE &amp; TIME TAKEN</span>
                    <b className="text-slate-200">{exifData.dateTime}</b>
                  </div>
                )}

                {(exifData.focalLength || exifData.fNumber || exifData.iso) && (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                    <span className="text-white/40 block text-[11px]">EXPOSURE METRICS</span>
                    <span className="text-slate-200">
                      {[exifData.focalLength, exifData.fNumber, exifData.exposureTime, exifData.iso].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                )}

                {exifData.gps && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-rose-300 font-bold flex items-center gap-1 text-[11px]">
                        <MapPin size={13} />
                        <span>PRECISE GPS COORDINATES EMBEDDED</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${exifData.gps.latitude}&mlon=${exifData.gps.longitude}#map=16/${exifData.gps.latitude}/${exifData.gps.longitude}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-[10px] text-sky-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>OpenStreetMap</span>
                          <ExternalLink size={10} />
                        </a>
                        <a
                          href={`https://maps.google.com/?q=${exifData.gps.latitude},${exifData.gps.longitude}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-[10px] text-sky-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>Google Maps</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                    <p className="text-rose-200 font-mono text-[11px]">
                      {exifData.gps.latDms}, {exifData.gps.lonDms} ({exifData.gps.latitude.toFixed(5)}, {exifData.gps.longitude.toFixed(5)})
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Source & Details Grid */}
          <div className="image-metadata__grid">
            <section className="image-metadata__source">
              <div className="image-metadata__label">
                <span>CHOSEN SOURCE</span>
                <b>{metadataFormatLabel(source.format)} · {source.width} × {source.height}</b>
              </div>
              <img src={source.url} alt="Selected source image preview" />
            </section>

            <section className="image-metadata__mission" aria-label="Clean re-export details">
              <div className="image-metadata__label">
                <span>OUTPUT RULE</span>
                <b>PIXELS / NATIVE SCRUB</b>
              </div>
              <Sparkles size={25} />
              <strong>Render a completely stripped local image.</strong>
              <p>The browser redraws the decoded image at its native dimensions and creates a clean {metadataFormatLabel(source.format)} file. Zero metadata, GPS tags, or device identifiers are carried over.</p>
              <dl>
                <div>
                  <dt>Original file</dt>
                  <dd>Never modified or uploaded</dd>
                </div>
                <div>
                  <dt>GPS &amp; EXIF data</dt>
                  <dd className="text-emerald-400 font-bold">100% Stripped</dd>
                </div>
                <div>
                  <dt>Output format</dt>
                  <dd>{metadataFormatLabel(source.format)} only</dd>
                </div>
              </dl>
            </section>
          </div>

          <p className="tool-disclaimer image-metadata__note">
            <ShieldCheck size={15} /> 
            This creates a clean local raster export that leaves behind all EXIF tags, GPS coordinates, serial numbers, and camera timestamps. The entire operation executes strictly inside your browser memory.
          </p>

          <div className="image-metadata__actions">
            <button type="button" data-clean-image className="signal-button" disabled={working} onClick={clean}>
              <FileOutput size={16} /> {working ? "Wiping metadata locally…" : "Create clean re-export"}
            </button>
            <button type="button" data-reset-tool className="reset-button" onClick={reset}>
              <RotateCcw size={15} /> Clear image
            </button>
            {output ? (
              <a
                data-download-image
                className="quiet-button"
                href={output.url}
                download={`${source.basename}-clean.${metadataFormatExtension(output.format)}`}
              >
                <Download size={16} /> Download clean {metadataFormatLabel(output.format)}
              </a>
            ) : null}
          </div>

          <section className="image-metadata__output" aria-live="polite">
            <div className="image-metadata__label">
              <span>CLEAN LOCAL OUTPUT (METADATA STRIPPED)</span>
              <b>{output ? `${output.width} × ${output.height} · ${describeBytes(output.blob.size)}` : "WAITING FOR RE-EXPORT"}</b>
            </div>
            {output ? (
              <div className="space-y-3">
                <img src={output.url} alt="Clean local re-export preview" />
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span>Clean Re-Export Ready: 0 Metadata Tags, Zero GPS Telemetry</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-bold">SAFE TO SHARE</span>
                </div>
              </div>
            ) : (
              <div className="image-preview-placeholder">
                <FileOutput size={21} /> Your clean native-dimension re-export appears here
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="image-metadata__empty">
          <ShieldCheck size={21} />
          <strong>Privacy-First EXIF &amp; GPS Remover</strong>
          <p>
            Choose any photo from your phone or camera. This workspace audits embedded device metadata and GPS location coordinates, then re-exports a fresh raster file with 100% of tracking tags permanently scrubbed.
          </p>
        </div>
      )}

      {error ? <p className="image-resizer__error" role="alert">{error}</p> : null}
    </div>
  );
}
