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
  return clear[0].descriptor;
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

export function prepareFaceModels() {
  return faceApi().then(() => undefined);
}

let scanCanvas: HTMLCanvasElement | null = null;

export async function scanKioskFace(video: HTMLVideoElement) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;
  const faceapi = await faceApi();
  const max = 320;
  const scale = Math.min(1, max / Math.max(width, height));
  const canvas = scanCanvas || document.createElement('canvas');
  scanCanvas = canvas;
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 });
  const faces = await faceapi.detectAllFaces(canvas, options).withFaceLandmarks().withFaceDescriptors();
  const clear = faces.filter((face) => face.detection.score >= 0.45);
  if (!clear.length) return null;
  const closest = clear.reduce((best, face) => {
    const area = face.detection.box.width * face.detection.box.height;
    const bestArea = best.detection.box.width * best.detection.box.height;
    return area > bestArea ? face : best;
  });
  return Array.from(closest.descriptor);
}

export async function matchLiveFace(video: HTMLVideoElement) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return { aligned: false, descriptor: null as number[] | null };
  const faceapi = await faceApi();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { aligned: false, descriptor: null as number[] | null };
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.62 });
  ctx.drawImage(video, 0, 0, width, height);
  const faces = await faceapi.detectAllFaces(canvas, options).withFaceLandmarks().withFaceDescriptors();
  const clear = faces.filter((face) => face.detection.score >= 0.62);
  if (clear.length !== 1) return { aligned: false, descriptor: null as number[] | null };
  const found = clear[0];
  const view = visibleFrame(video);
  const box = found.detection.box;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const aligned = Math.abs(centerX - (view.x + view.width / 2)) < view.width * 0.34
    && Math.abs(centerY - (view.y + view.height / 2)) < view.height * 0.36
    && box.width > view.width * 0.12
    && box.width < view.width * 0.9;
  return { aligned, descriptor: Array.from(found.descriptor) };
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
