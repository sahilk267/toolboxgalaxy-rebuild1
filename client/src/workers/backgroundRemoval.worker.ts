/// <reference lib="webworker" />
/**
 * Dedicated worker: only model/asset requests reach our own origin.
 * Selected image bytes never go to a remote endpoint.
 * Releasing/cancelling the worker immediately ends all outstanding jobs.
 */
import { env, pipeline, RawImage } from "@huggingface/transformers";
import { inferenceSize } from "../lib/backgroundRemovalValidation";

type Request = { type: "PROCESS"; id: number; file: File };
type LoadingEvent = { type: "LOADING"; id: number; progress?: number };
type DoneEvent = { type: "DONE"; id: number; blob: Blob };
type ErrorEvent = { type: "ERROR"; id: number; error: string };
type Response = LoadingEvent | DoneEvent | ErrorEvent;

const send = (message: Response) => self.postMessage(message);
const MODEL = "onnx-community/ormbg-ONNX";

env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = "/models/";
env.useBrowserCache = true;
env.backends.onnx.wasm.wasmPaths = "/ai-runtime/";

let modelPromise: ReturnType<typeof pipeline> | null = null;
function loadModel(id: number) {
  if (!modelPromise) {
    modelPromise = pipeline("background-removal", MODEL, {
      device: "wasm",
      dtype: "uint8",
      progress_callback: (item: { progress?: number }) => {
        if (Number.isFinite(item.progress)) send({ type: "LOADING", id, progress: item.progress });
      },
    });
  }
  return modelPromise;
}

async function processImage(id: number, file: File) {
  let bitmap: ImageBitmap | null = null;
  let canvas: OffscreenCanvas | null = null;
  try {
    send({ type: "LOADING", id });
    bitmap = await createImageBitmap(file);
    const size = inferenceSize({ width: bitmap.width, height: bitmap.height });
    canvas = new OffscreenCanvas(size.width, size.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot create an image canvas.");
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    const inputBlob = await canvas.convertToBlob({ type: "image/png" });
    bitmap.close();
    bitmap = null;
    const input = await RawImage.fromBlob(inputBlob);
    const model = await loadModel(id);
    const response = await model(input);
    const output = Array.isArray(response) ? response[0] : response;
    if (!output || typeof output.toBlob !== "function") {
      throw new Error("The AI model did not return a valid image.");
    }
    const blob = await output.toBlob();
    if (blob.type !== "image/png" || blob.size === 0) {
      throw new Error("AI output is not a valid PNG.");
    }
    send({ type: "DONE", id, blob });
  } catch (reason) {
    send({
      type: "ERROR", id,
      error: reason instanceof Error ? reason.message : "Background removal failed.",
    });
  } finally {
    bitmap?.close();
    canvas = null;
  }
}

self.onmessage = (event: MessageEvent<Request>) => {
  if (event.data?.type === "PROCESS") void processImage(event.data.id, event.data.file);
};
