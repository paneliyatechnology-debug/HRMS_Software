'use client';

/**
 * Dedicated browser-side Presentation Attack Detection (PAD) module
 * using MiniFASNetV2 (Silent-Face-Anti-Spoofing, Apache-2.0) via onnxruntime-web.
 *
 * Fail-closed design: if the ONNX model fails to load or infer, attendance is blocked.
 */

const PAD_MODEL_URL = '/models/minifasnet_v2.onnx';
const PAD_INPUT_SIZE = 80;
const PAD_SCALE = 2.7;

let ortModulePromise = null;
let sessionPromise = null;
let padCanvas = null;
let padCtx = null;
let inputBuffer = null;
let inferenceBusy = false;

function softmax(logits) {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i += 1) {
    if (logits[i] > max) max = logits[i];
  }
  const exps = new Float32Array(logits.length);
  let sum = 0;
  for (let i = 0; i < logits.length; i += 1) {
    const v = Math.exp(logits[i] - max);
    exps[i] = v;
    sum += v;
  }
  const denom = sum || 1;
  for (let i = 0; i < exps.length; i += 1) {
    exps[i] /= denom;
  }
  return exps;
}

async function getOrt() {
  if (!ortModulePromise) {
    ortModulePromise = import('onnxruntime-web').then((ort) => {
      if (ort?.env?.wasm) {
        ort.env.wasm.wasmPaths = '/ort/';
        ort.env.wasm.numThreads = 1;
      }
      return ort;
    });
  }
  return ortModulePromise;
}

/**
 * Load and cache the MiniFASNetV2 ONNX session once.
 * @returns {Promise<import('onnxruntime-web').InferenceSession>}
 */
export async function preparePadModel() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await getOrt();
      return ort.InferenceSession.create(PAD_MODEL_URL, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
    })().catch((err) => {
      sessionPromise = null;
      throw err;
    });
  }
  return sessionPromise;
}

function getPadCanvas() {
  if (!padCanvas && typeof document !== 'undefined') {
    padCanvas = document.createElement('canvas');
    padCanvas.width = PAD_INPUT_SIZE;
    padCanvas.height = PAD_INPUT_SIZE;
    padCtx = padCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (!inputBuffer) {
    inputBuffer = new Float32Array(3 * PAD_INPUT_SIZE * PAD_INPUT_SIZE);
  }
  return { canvas: padCanvas, ctx: padCtx, buffer: inputBuffer };
}

/**
 * Run MiniFASNetV2 PAD inference on a detected face box.
 * @param {HTMLVideoElement} video
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @returns {Promise<{
 *   ready: boolean,
 *   verdict: 'live' | 'uncertain' | 'spoof' | 'busy' | 'error',
 *   liveScore: number,
 *   spoofScore: number,
 *   probs: number[],
 *   latencyMs: number,
 *   error?: string
 * }>}
 */
export async function evaluateFacePad(video, box) {
  if (!video || !box || !video.videoWidth || !video.videoHeight) {
    return { ready: false, verdict: 'error', liveScore: 0, spoofScore: 1, probs: [], latencyMs: 0, error: 'Video frame unavailable.' };
  }
  if (inferenceBusy) {
    return { ready: true, verdict: 'busy', liveScore: 0, spoofScore: 0, probs: [], latencyMs: 0 };
  }

  inferenceBusy = true;
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    const [ort, session] = await Promise.all([getOrt(), preparePadModel()]);
    const { ctx, buffer } = getPadCanvas();
    if (!ctx) {
      return { ready: false, verdict: 'error', liveScore: 0, spoofScore: 1, probs: [], latencyMs: 0, error: 'Canvas unavailable.' };
    }

    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    const boxW = Math.max(1, box.width);
    const boxH = Math.max(1, box.height);
    const scale = Math.min((srcH - 1) / boxH, (srcW - 1) / boxW, PAD_SCALE);
    const newW = boxW * scale;
    const newH = boxH * scale;
    const cx = box.x + boxW / 2;
    const cy = box.y + boxH / 2;
    const sx = Math.max(0, Math.floor(cx - newW / 2));
    const sy = Math.max(0, Math.floor(cy - newH / 2));
    const sw = Math.min(srcW - sx, Math.max(1, Math.floor(newW)));
    const sh = Math.min(srcH - sy, Math.max(1, Math.floor(newH)));

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, PAD_INPUT_SIZE, PAD_INPUT_SIZE);
    const rgba = ctx.getImageData(0, 0, PAD_INPUT_SIZE, PAD_INPUT_SIZE).data;

    // Convert RGBA -> BGR NCHW float32 in [0.0, 255.0] (matching upstream Silent-Face-Anti-Spoofing MiniFASNetV2)
    const plane = PAD_INPUT_SIZE * PAD_INPUT_SIZE;
    for (let i = 0; i < plane; i += 1) {
      const p = i * 4;
      buffer[i] = rgba[p + 2]; // B
      buffer[plane + i] = rgba[p + 1]; // G
      buffer[plane * 2 + i] = rgba[p]; // R
    }

    const inputName = session.inputNames[0] || 'input';
    const outputName = session.outputNames[0] || 'output';
    const tensor = new ort.Tensor('float32', buffer, [1, 3, PAD_INPUT_SIZE, PAD_INPUT_SIZE]);
    const outputs = await session.run({ [inputName]: tensor });
    const raw = outputs[outputName]?.data;
    if (!raw || raw.length < 3) {
      return { ready: false, verdict: 'error', liveScore: 0, spoofScore: 1, probs: [], latencyMs: 0, error: 'Invalid PAD model output.' };
    }

    const probs = Array.from(softmax(raw));
    // Silent-Face-Anti-Spoofing MiniFASNetV2: class 1 is Live/Real, classes 0 & 2 are Spoof.
    const liveScore = probs[1] ?? 0;
    const spoofScore = 1 - liveScore;
    const latencyMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;

    let verdict = 'spoof';
    if (liveScore >= 0.80) verdict = 'live';
    else if (liveScore >= 0.50) verdict = 'uncertain';

    return {
      ready: true,
      verdict,
      liveScore,
      spoofScore,
      probs,
      latencyMs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'PAD inference failed.';
    return {
      ready: false,
      verdict: 'error',
      liveScore: 0,
      spoofScore: 1,
      probs: [],
      latencyMs: 0,
      error: msg,
    };
  } finally {
    inferenceBusy = false;
  }
}
