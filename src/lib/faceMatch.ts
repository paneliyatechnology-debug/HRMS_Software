const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
const MATCH_DISTANCE = 0.36;

type FaceApi = typeof import('@vladmandic/face-api');

let ready: Promise<FaceApi> | null = null;

let tinyReady: Promise<FaceApi> | null = null;

async function tinyFaceApi(): Promise<FaceApi> {
  if (!tinyReady) {
    tinyReady = (async () => {
      const faceapi = await import('@vladmandic/face-api');
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      return faceapi;
    })().catch((error) => {
      tinyReady = null;
      throw error;
    });
  }
  return tinyReady;
}

type FaceBox = { x: number; y: number; width: number; height: number };
let browserDetector: { detect: (input: HTMLVideoElement) => Promise<Array<{ boundingBox: FaceBox }>> } | null = null;

export async function detectLiveFace(video: HTMLVideoElement): Promise<{ aligned: boolean }> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return { aligned: false };

  let box: FaceBox | null = null;
  type BrowserDetector = { detect: (input: HTMLVideoElement) => Promise<Array<{ boundingBox: FaceBox }>> };
  const Detector = (window as unknown as { FaceDetector?: new (options?: object) => BrowserDetector }).FaceDetector;
  if (Detector) {
    if (!browserDetector) {
      browserDetector = new Detector({ fastMode: true, maxDetectedFaces: 1 });
    }
    const faces = await (browserDetector as BrowserDetector).detect(video);
    box = faces[0]?.boundingBox || null;
  } else {
    const faceapi = await tinyFaceApi();
    const found = await faceapi.detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 }),
    );
    if (found) box = found.box;
  }

  if (!box) return { aligned: false };
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const centered = Math.abs(centerX - width / 2) < width * 0.2 && Math.abs(centerY - height / 2) < height * 0.22;
  const sized = box.width > width * 0.16 && box.width < width * 0.72;
  return { aligned: centered && sized };
}

async function faceApi(): Promise<FaceApi> {
  if (!ready) {
    ready = (async () => {
      const faceapi = await import('@vladmandic/face-api');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      return faceapi;
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Photo could not be read.'));
    image.src = src;
  });
}

async function descriptorOf(faceapi: FaceApi, source: HTMLImageElement | HTMLCanvasElement) {
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.55 });
  const faces = await faceapi.detectAllFaces(source, options).withFaceLandmarks().withFaceDescriptors();
  const clear = faces.filter((face) => face.detection.score >= 0.55);
  if (clear.length !== 1) throw new Error('No face found. Use a clear, front-facing photo.');
  const found = clear[0];
  const box = found.detection.box;
  if (box.width < 56 || box.height < 56) {
    throw new Error('Face is too small in the photo. Use a closer front-facing photo.');
  }
  const yaw = headYaw(found.landmarks.positions);
  if (yaw != null && Math.abs(yaw) > 0.28) {
    throw new Error('Look straight at the camera in your profile photo.');
  }
  // Validate enrollment brightness/contrast on an offscreen canvas
  try {
    const c = document.createElement('canvas');
    const w = Math.max(1, Math.round(box.width));
    const h = Math.max(1, Math.round(box.height));
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(source, box.x, box.y, box.width, box.height, 0, 0, w, h);
      const px = ctx.getImageData(0, 0, w, h).data;
      let sum = 0;
      let sumSq = 0;
      let count = 0;
      for (let i = 0; i < px.length; i += 16) {
        const luma = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
        sum += luma;
        sumSq += luma * luma;
        count += 1;
      }
      if (count > 0) {
        const mean = sum / count;
        const stdDev = Math.sqrt(Math.max(0, sumSq / count - mean * mean));
        if (mean < 28 || mean > 238 || stdDev < 15) {
          throw new Error('Photo lighting or clarity is too poor. Use a clear, well-lit photo.');
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Photo lighting')) throw err;
  }
  return found.descriptor;
}

function unitFace(values: number[]) {
  let sum = 0;
  for (const value of values) sum += value * value;
  const norm = Math.sqrt(sum) || 1;
  return values.map((value) => value / norm);
}

export function sameProfileFace(saved: number[] | null | undefined, live: number[] | null | undefined) {
  if (!saved || !live || saved.length !== live.length || saved.length < 64) return false;
  if (saved.some((value) => !Number.isFinite(value)) || live.some((value) => !Number.isFinite(value))) return false;
  const left = unitFace(saved);
  const right = unitFace(live);
  let sum = 0;
  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index] - right[index];
    sum += delta * delta;
  }
  return Math.sqrt(sum) <= MATCH_DISTANCE;
}

export async function descriptorForImage(src: string) {
  const faceapi = await faceApi();
  const image = await loadImage(src);
  return Array.from(await descriptorOf(faceapi, image));
}

export async function assertFaceInPhoto(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Profile photo must be an image.');
  const url = URL.createObjectURL(file);
  try {
    return await descriptorForImage(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'No face found. Use a clear, front-facing photo.' || message === 'Photo could not be read.') throw error;
    throw new Error('Face check could not start. Check your internet and try again.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function profileDescriptor(profileUrl: string) {
  try {
    return await descriptorForImage(profileUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'No face found. Use a clear, front-facing photo.' || message === 'Photo could not be read.') {
      throw new Error('Your profile photo has no clear face. Upload it again.');
    }
    throw new Error('Face check could not start. Check your internet and try again.');
  }
}

function visibleFrame(video: HTMLVideoElement) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  const boxW = video.clientWidth || width;
  const boxH = video.clientHeight || height;
  const videoRatio = width / height;
  const boxRatio = boxW / boxH;
  if (videoRatio > boxRatio) {
    const visibleW = height * boxRatio;
    return { x: (width - visibleW) / 2, y: 0, width: visibleW, height };
  }
  const visibleH = width / boxRatio;
  return { x: 0, y: (height - visibleH) / 2, width, height: visibleH };
}

function eyePair(positions: Array<{ x: number; y: number }> | undefined): { left: number; right: number; avg: number } | null {
  if (!positions || positions.length < 48) return null;
  const gap = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
  const side = (start: number) => {
    const vertical = gap(positions[start + 1], positions[start + 5]) + gap(positions[start + 2], positions[start + 4]);
    const horizontal = gap(positions[start], positions[start + 3]) || 1;
    return vertical / (2 * horizontal);
  };
  const left = side(36);
  const right = side(42);
  const avg = (left + right) / 2;
  if (!Number.isFinite(left) || !Number.isFinite(right) || !Number.isFinite(avg)) return null;
  return { left, right, avg };
}

function eyeOpen(positions: Array<{ x: number; y: number }> | undefined) {
  return eyePair(positions)?.avg ?? null;
}

function headYaw(positions: Array<{ x: number; y: number }> | undefined) {
  if (!positions || positions.length < 46) return null;
  const leftEye = positions[36];
  const rightEye = positions[45];
  const nose = positions[30];
  const span = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
  if (!span || span < 10) return null;
  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const ratio = (nose.x - eyeMidX) / span;
  return Number.isFinite(ratio) ? ratio : null;
}

function mouthOpen(positions: Array<{ x: number; y: number }> | undefined) {
  if (!positions || positions.length < 68) return null;
  const v = Math.hypot(positions[62].x - positions[66].x, positions[62].y - positions[66].y);
  const h = Math.hypot(positions[60].x - positions[64].x, positions[60].y - positions[64].y) || 1;
  const ratio = v / h;
  return Number.isFinite(ratio) ? ratio : null;
}

function noseVerticalRatio(positions: Array<{ x: number; y: number }> | undefined) {
  if (!positions || positions.length < 46) return null;
  const eyeMidY = (positions[36].y + positions[45].y) / 2;
  const chinY = positions[8]?.y;
  if (chinY == null) return null;
  const faceH = Math.abs(chinY - eyeMidY);
  if (!faceH || faceH < 10) return null;
  const ratio = (positions[30].y - eyeMidY) / faceH;
  return Number.isFinite(ratio) ? ratio : null;
}

export type BlinkTrack = {
  step: 0 | 1 | 2;
  base: number;
  low: number;
  samples?: number[];
  closedFrames?: number;
  lastBox?: { x: number; y: number; width: number; height: number };
};

export function nextBlink(
  track: BlinkTrack,
  eye: number | null,
  eyes?: { left: number; right: number; avg: number } | null,
  box?: { x: number; y: number; width: number; height: number } | null,
): { track: BlinkTrack; done: boolean } {
  if (eye == null) return { track, done: false };

  // Anti-photo-shake guard: reset only on large sudden shifts (>22% of face width)
  // so hand-held phone movement works, while shaking/swapping a photo resets.
  if (box && track.lastBox) {
    const prevCx = track.lastBox.x + track.lastBox.width / 2;
    const prevCy = track.lastBox.y + track.lastBox.height / 2;
    const currCx = box.x + box.width / 2;
    const currCy = box.y + box.height / 2;
    const shift = Math.hypot(currCx - prevCx, currCy - prevCy);
    if (shift > Math.max(box.width, 1) * 0.22) {
      return {
        track: { step: 0, base: 0, low: 0, samples: [], closedFrames: 0, lastBox: box },
        done: false,
      };
    }
  }

  const nextBox = box ?? track.lastBox;

  if (track.step === 0) {
    if (eye < 0.12) return { track: { ...track, lastBox: nextBox }, done: false };
    const samples = [...(track.samples ?? []), eye].slice(-2);
    if (samples.length < 2) {
      return { track: { step: 0, base: 0, low: 0, samples, closedFrames: 0, lastBox: nextBox }, done: false };
    }
    const base = (samples[0] + samples[1]) / 2;
    return { track: { step: 1, base, low: eye, samples, closedFrames: 0, lastBox: nextBox }, done: false };
  }

  if (track.step === 1) {
    // Slowly track open-eye baseline without letting a single spike inflate it.
    const base = eye > track.base * 0.93 ? track.base * 0.8 + eye * 0.2 : track.base;
    const low = Math.min(track.low, eye);
    const drop = base - eye;
    const bothClosed = eyes
      ? eyes.left < base * 0.9 && eyes.right < base * 0.9 && eye < base * 0.88 && drop >= 0.018
      : eye < base * 0.88 && drop >= 0.018;
    if (bothClosed) {
      return { track: { step: 2, base, low: eye, closedFrames: 1, lastBox: nextBox }, done: false };
    }
    return { track: { step: 1, base, low, closedFrames: 0, lastBox: nextBox }, done: false };
  }

  const opened = eye > track.low + 0.014 && eye >= track.base * 0.84;
  if (opened) {
    return { track: { step: 0, base: 0, low: 0, samples: [], closedFrames: 0, lastBox: nextBox }, done: true };
  }
  const closedFrames = (track.closedFrames ?? 0) + 1;
  if (closedFrames > 12) {
    return { track: { step: 0, base: 0, low: 0, samples: [], closedFrames: 0, lastBox: nextBox }, done: false };
  }
  return { track: { ...track, low: Math.min(track.low, eye), closedFrames, lastBox: nextBox }, done: false };
}

export type LivenessTrack = { step: 0 | 1 | 2 | 3; base: number; low: number; baseYaw: number };

export function nextLiveness(
  track: LivenessTrack,
  eye: number | null,
  yaw: number | null,
): { track: LivenessTrack; done: boolean } {
  if (eye == null || yaw == null) return { track, done: false };
  if (track.step === 0) {
    if (eye < 0.14) return { track, done: false };
    return { track: { step: 1, base: eye, low: eye, baseYaw: yaw }, done: false };
  }
  if (track.step === 1) {
    const base = Math.max(track.base, eye);
    const low = Math.min(track.low, eye);
    const closed = eye < base * 0.88 && base - eye >= 0.02;
    if (closed) return { track: { step: 2, base, low, baseYaw: track.baseYaw }, done: false };
    // Also allow advancing if user already performed a clear 3D head turn on mobile
    if (Math.abs(yaw - track.baseYaw) >= 0.11) {
      return { track: { step: 0, base: 0, low: 0, baseYaw: 0 }, done: true };
    }
    return { track: { step: 1, base, low, baseYaw: track.baseYaw }, done: false };
  }
  if (track.step === 2) {
    const opened = eye > track.low + 0.015;
    if (opened) return { track: { step: 3, base: track.base, low: track.low, baseYaw: yaw }, done: false };
    return { track: { ...track, low: Math.min(track.low, eye) }, done: false };
  }
  // Step 3: Gentle 3D head turn (~8 deg left or right)
  if (Math.abs(yaw - track.baseYaw) >= 0.08) {
    return { track: { step: 0, base: 0, low: 0, baseYaw: 0 }, done: true };
  }
  return { track, done: false };
}

export function prepareFaceModels() {
  return faceApi().then(() => undefined);
}

let scanCanvas: HTMLCanvasElement | null = null;

export async function scanKioskFace(video: HTMLVideoElement, withDescriptor = true) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;
  const faceapi = await faceApi();
  const max = 224;
  const scale = Math.min(1, max / Math.max(width, height));
  const canvas = scanCanvas || document.createElement('canvas');
  scanCanvas = canvas;
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.35 });
  // Fast Tiny landmarks for tracking/liveness frames; Full 68-point landmarks for descriptor generation (matches enrollment!).
  const faces = withDescriptor
    ? await faceapi.detectAllFaces(canvas, options).withFaceLandmarks().withFaceDescriptors()
    : await faceapi.detectAllFaces(canvas, options).withFaceLandmarks(true);
  const clear = faces.filter((face) => face.detection.score >= 0.35);
  if (!clear.length) return null;
  const closest = clear.reduce((best, face) => {
    const area = face.detection.box.width * face.detection.box.height;
    const bestArea = best.detection.box.width * best.detection.box.height;
    return area > bestArea ? face : best;
  });
  const box = closest.detection.box;
  const inv = 1 / scale;
  const rawDescriptor = 'descriptor' in closest ? (closest as { descriptor: Float32Array }).descriptor : null;

  // Soft presentation-attack metrics (<0.5ms) for layered liveness evaluation
  let meanLuma = 120;
  let stdDev = 35;
  let sharpness = 12;
  let coolCast = false;
  let moireSuspect = false;
  let bezelSuspect = false;
  try {
    const sx = Math.max(0, Math.floor(box.x));
    const sy = Math.max(0, Math.floor(box.y));
    const sw = Math.min(canvas.width - sx, Math.max(8, Math.floor(box.width)));
    const sh = Math.min(canvas.height - sy, Math.max(8, Math.floor(box.height)));
    const pixels = ctx.getImageData(sx, sy, sw, sh).data;
    let sum = 0;
    let sumSq = 0;
    let sumR = 0;
    let sumB = 0;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const luma = r * 0.299 + g * 0.587 + b * 0.114;
      sum += luma;
      sumSq += luma * luma;
      sumR += r;
      sumB += b;
      count += 1;
    }
    if (count > 0) {
      meanLuma = sum / count;
      stdDev = Math.sqrt(Math.max(0, sumSq / count - meanLuma * meanLuma));
      coolCast = sumB > sumR * 1.06;
    }

    if (sw >= 24 && sh >= 24) {
      const mx = sx + Math.floor(sw * 0.25);
      const my = sy + Math.floor(sh * 0.22);
      const mw = Math.max(12, Math.floor(sw * 0.5));
      const strip = ctx.getImageData(mx, my, mw, 1).data;
      let hfDiff = 0;
      let lfDiff = 0;
      let steps = 0;
      for (let x = 0; x + 4 < mw; x += 2) {
        const i0 = x * 4;
        const i1 = (x + 1) * 4;
        const i4 = (x + 4) * 4;
        const l0 = strip[i0] * 0.3 + strip[i0 + 1] * 0.59 + strip[i0 + 2] * 0.11;
        const l1 = strip[i1] * 0.3 + strip[i1 + 1] * 0.59 + strip[i1 + 2] * 0.11;
        const l4 = strip[i4] * 0.3 + strip[i4 + 1] * 0.59 + strip[i4 + 2] * 0.11;
        hfDiff += Math.abs(l0 - l1);
        lfDiff += Math.abs(l0 - l4);
        steps += 1;
      }
      if (steps > 0) {
        sharpness = lfDiff / steps;
        moireSuspect = hfDiff / steps > 12 && hfDiff > lfDiff * 1.18;
      }
    }

    const padX = Math.max(6, Math.floor(sw * 0.35));
    const lx = Math.max(0, sx - padX);
    const rx = Math.min(canvas.width - 2, sx + sw + Math.floor(padX * 0.6));
    const midY = Math.max(0, sy + Math.floor(sh * 0.2));
    const midH = Math.min(canvas.height - midY, Math.max(8, Math.floor(sh * 0.6)));
    const checkVerticalEdge = (colX: number) => {
      if (colX <= 1 || colX >= canvas.width - 2) return false;
      const strip = ctx.getImageData(colX - 1, midY, 3, midH).data;
      let sharpRows = 0;
      let darkBezelRows = 0;
      for (let r = 0; r < midH; r += 2) {
        const idx = r * 12;
        const l0 = strip[idx] * 0.299 + strip[idx + 1] * 0.587 + strip[idx + 2] * 0.114;
        const l1 = strip[idx + 4] * 0.299 + strip[idx + 5] * 0.587 + strip[idx + 6] * 0.114;
        const l2 = strip[idx + 8] * 0.299 + strip[idx + 9] * 0.587 + strip[idx + 10] * 0.114;
        if (Math.abs(l0 - l2) > 45) sharpRows += 1;
        if (l1 < 30) darkBezelRows += 1;
      }
      const sampled = Math.max(1, Math.ceil(midH / 2));
      return sharpRows / sampled > 0.6 || darkBezelRows / sampled > 0.8;
    };
    bezelSuspect = checkVerticalEdge(lx) && checkVerticalEdge(rx);
  } catch {
    // Keep safe defaults
  }

  return {
    descriptor: rawDescriptor ? Array.from(rawDescriptor) : null,
    score: closest.detection.score,
    textureOk: stdDev >= 16 && meanLuma >= 28 && meanLuma <= 235,
    liveness: {
      score: closest.detection.score,
      box: { x: box.x * inv, y: box.y * inv, width: box.width * inv, height: box.height * inv },
      eye: eyeOpen(closest.landmarks.positions),
      yaw: headYaw(closest.landmarks.positions),
      mouth: mouthOpen(closest.landmarks.positions),
      noseRatio: noseVerticalRatio(closest.landmarks.positions),
      meanLuma,
      stdDev,
      sharpness,
      coolCast,
      moireSuspect,
      bezelSuspect,
    },
    eye: eyeOpen(closest.landmarks.positions),
    eyes: eyePair(closest.landmarks.positions),
    yaw: headYaw(closest.landmarks.positions),
    points: closest.landmarks.positions.map((point) => ({ x: point.x * inv, y: point.y * inv })),
    box: { x: box.x * inv, y: box.y * inv, width: box.width * inv, height: box.height * inv },
  };
}

export async function matchLiveFace(video: HTMLVideoElement) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return { aligned: false, descriptor: null as number[] | null, eye: null as number | null, box: null as { x: number; y: number; width: number; height: number } | null };
  const faceapi = await faceApi();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { aligned: false, descriptor: null as number[] | null, eye: null as number | null, box: null as { x: number; y: number; width: number; height: number } | null };
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.62 });
  ctx.drawImage(video, 0, 0, width, height);
  const faces = await faceapi.detectAllFaces(canvas, options).withFaceLandmarks().withFaceDescriptors();
  const clear = faces.filter((face) => face.detection.score >= 0.62);
  if (clear.length !== 1) return { aligned: false, descriptor: null as number[] | null, eye: null as number | null, box: null as { x: number; y: number; width: number; height: number } | null };
  const found = clear[0];
  const view = visibleFrame(video);
  const box = found.detection.box;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const aligned = Math.abs(centerX - (view.x + view.width / 2)) < view.width * 0.34
    && Math.abs(centerY - (view.y + view.height / 2)) < view.height * 0.36
    && box.width > view.width * 0.12
    && box.width < view.width * 0.9;
  return {
    aligned,
    descriptor: Array.from(found.descriptor),
    eye: eyeOpen(found.landmarks.positions),
    box: { x: box.x, y: box.y, width: box.width, height: box.height },
  };
}

export async function facesMatch(profileUrl: string, selfieUrl: string) {
  try {
    const faceapi = await faceApi();
    const [profile, selfie] = await Promise.all([loadImage(profileUrl), loadImage(selfieUrl)]);
    const [profileFace, selfieFace] = await Promise.all([
      descriptorOf(faceapi, profile).catch(() => {
        throw new Error('Your profile photo has no clear face. Upload it again.');
      }),
      descriptorOf(faceapi, selfie).catch(() => {
        throw new Error('No face found in the selfie. Look at the camera and retake it.');
      }),
    ]);
    const distance = faceapi.euclideanDistance(profileFace, selfieFace);
    return { match: distance <= MATCH_DISTANCE, distance };
  } catch (error) {
    if (error instanceof Error && /face|photo|selfie/i.test(error.message)) throw error;
    throw new Error('Face check could not start. Check your internet and try again.');
  }
}
