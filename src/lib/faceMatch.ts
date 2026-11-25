const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
const MATCH_DISTANCE = 0.55;

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
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.35 });
  const found = await faceapi.detectSingleFace(source, options).withFaceLandmarks().withFaceDescriptor();
  if (!found) throw new Error('No face found. Use a clear, front-facing photo.');
  return found.descriptor;
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

export async function matchLiveFace(video: HTMLVideoElement, profile: number[]) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height || profile.length < 64) {
    return { aligned: false, match: false, descriptor: null as number[] | null };
  }
  const faceapi = await faceApi();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { aligned: false, match: false, descriptor: null as number[] | null };
  ctx.drawImage(video, 0, 0, width, height);
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
  const found = await faceapi.detectSingleFace(canvas, options).withFaceLandmarks().withFaceDescriptor();
  if (!found) return { aligned: false, match: false, descriptor: null as number[] | null };
  const box = found.detection.box;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const aligned = Math.abs(centerX - width / 2) < width * 0.24
    && Math.abs(centerY - height / 2) < height * 0.26
    && box.width > width * 0.12
    && box.width < width * 0.8;
  const descriptor = Array.from(found.descriptor);
  const distance = faceapi.euclideanDistance(Float32Array.from(profile), found.descriptor);
  return { aligned, match: aligned && distance <= MATCH_DISTANCE, descriptor };
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
