/// <reference lib="webworker" />
/**
 * Dedicated worker: never sends photos off-device.
 * The model and WASM runtime are served from same-origin /models/.
 */
import { env, pipeline } from "@huggingface/transformers";

type Request = { type: "remove"; id: number; image: Blob };
type Response =
  | { type: "ready"; id: number }
  | { type: "progress"; id: number; progress: number }
  | { type: "complete"; id: number; png: Blob }
  | { type: "failed"; id: number; message: string };

const respond = (data: Response) => self.postMessage(data);

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = "/models/";
if (!env.backends.onnx.wasm) throw new Error("ONNX WebAssembly runtime is unavailable");
env.backends.onnx.wasm.wasmPaths = "/models/wasm/";
env.useBrowserCache = true;

let remover: any = null; // Pipeline task overloads cannot be represented as a single union in TS 5.6.

self.onmessage = async (event: MessageEvent<Request>) => {
  const input = event.data;
  if (!input || input.type !== "remove" || typeof input.id !== "number" ||
      !(input.image instanceof Blob) || input.image.size === 0) return;
  try {
    if (!remover) {
      remover = await pipeline("background-removal", "onnx-community/ormbg-ONNX", {
        device: "wasm",
        dtype: "uint8",
        progress_callback: (status: any) => {
          if (status?.status === "progress" && typeof status.progress === "number") {
            respond({ type: "progress", id: input.id, progress: Math.max(0, Math.min(100, status.progress)) });
          }
        },
      });
    }
    respond({ type: "ready", id: input.id });
    const results = await (remover as any)(input.image);
    const image = Array.isArray(results) ? results[0] : results;
    if (!image || image.channels !== 4 || !image.width || !image.height) {
      throw new Error("The AI did not produce a transparent image.");
    }
    const png: Blob = await image.toBlob("image/png");
    if (!png || png.size < 100 || png.type !== "image/png") {
      throw new Error("The browser could not encode the transparent PNG.");
    }
    respond({ type: "complete", id: input.id, png });
  } catch (error) {
    respond({ type: "failed", id: input.id, message: error instanceof Error ? error.message : "Background processing failed." });
  }
};
