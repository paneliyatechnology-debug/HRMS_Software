'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanFace } from 'lucide-react';
import { useAuth, isUserAdminRole } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { nextBlink, prepareFaceModels, sameProfileFace, scanKioskFace, type BlinkTrack } from '../../lib/faceMatch';

type Result = {
  tone: 'ok' | 'warn' | 'error';
  title: string;
  detail: string;
  photo?: string | null;
};

function canOpenKiosk(role?: string) {
  const normalized = String(role || '').trim().toUpperCase();
  return isUserAdminRole(normalized) || normalized === 'SUPERVISOR';
}

function framePhoto(video: HTMLVideoElement) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return '';
  const max = 640;
  const scale = Math.min(1, max / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
}

function paintScan(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  live: { box?: { x: number; y: number; width: number; height: number } } | null,
) {
  if (!canvas) return;
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  if (!live?.box) return;
  const { x, y, width: boxW, height: boxH } = live.box;
  const arm = Math.min(boxW, boxH) * 0.22;
  ctx.strokeStyle = '#39ff88';
  ctx.lineWidth = Math.max(5, width * 0.007);
  ctx.lineCap = 'square';
  const faceCorners = [
    [x, y + arm, x, y, x + arm, y],
    [x + boxW, y + arm, x + boxW, y, x + boxW - arm, y],
    [x, y + boxH - arm, x, y + boxH, x + arm, y + boxH],
    [x + boxW, y + boxH - arm, x + boxW, y + boxH, x + boxW - arm, y + boxH],
  ];
  faceCorners.forEach(([x1, y1, x2, y2, x3, y3]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  });
}

export default function FaceClockPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const missedRef = useRef(0);
  const lastFaceRef = useRef<number[] | null>(null);
  const blinkRef = useRef<BlinkTrack>({ step: 0, base: 0, low: 0 });
  const blinkFaceRef = useRef<number[] | null>(null);
  const holdRef = useRef(false);
  const differRef = useRef(0);
  const [status, setStatus] = useState('Starting camera…');
  const [result, setResult] = useState<Result | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    void prepareFaceModels().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!ready || isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [ready, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!ready || !isAuthenticated || !canOpenKiosk(user?.role)) return;
    let stopped = false;
    const video = videoRef.current;
    if (!video) return;

    const start = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setStatus('Camera needs a secure page (localhost or HTTPS).');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();
        setCameraReady(true);
        setStatus('Look at the camera. Your face clocks you in or out.');
      } catch {
        setStatus('Camera permission is blocked. Allow the camera and refresh.');
      }
    };
    void start();
    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [ready, isAuthenticated, user?.role]);

  useEffect(() => {
    if (!cameraReady) return;
    let timer = 0;
    let stopped = false;
    const tick = async () => {
      const video = videoRef.current;
      if (!video || stopped) return;
      let live: Awaited<ReturnType<typeof scanKioskFace>> = null;
      try {
        live = await scanKioskFace(video);
      } catch {
        return;
      }
      if (stopped) return;
      paintScan(overlayRef.current, video, live);
      if (!live) {
        missedRef.current += 1;
        if (missedRef.current >= 12) {
          lastFaceRef.current = null;
          blinkRef.current = { step: 0, base: 0, low: 0 };
          blinkFaceRef.current = null;
          holdRef.current = false;
          differRef.current = 0;
          setStatus('Look at the camera.');
        }
        return;
      }
      const descriptor = live.descriptor;
      missedRef.current = 0;
      if (holdRef.current && lastFaceRef.current) {
        if (sameProfileFace(lastFaceRef.current, descriptor)) {
          differRef.current = 0;
          return;
        }
        differRef.current += 1;
        if (differRef.current < 6) return;
        holdRef.current = false;
        differRef.current = 0;
      }
      if (!blinkFaceRef.current || !sameProfileFace(blinkFaceRef.current, descriptor)) {
        blinkFaceRef.current = descriptor;
        blinkRef.current = { step: 0, base: 0, low: 0 };
      }
      const moved = nextBlink(blinkRef.current, live.eye);
      blinkRef.current = moved.track;
      if (!moved.done) {
        setStatus(blinkRef.current.step === 0 ? 'Look at the camera.' : blinkRef.current.step === 1 ? 'Close your eyes once.' : 'Open your eyes.');
        return;
      }
      blinkRef.current = { step: 0, base: 0, low: 0 };
      setStatus('Checking this face…');
      const photo = framePhoto(video);
      void api.faceKioskClock({
        faceDescriptor: descriptor,
        photo: photo || undefined,
      }).then((saved) => {
        if (stopped) return;
        lastFaceRef.current = descriptor;
        const name = `${saved.employee?.firstName || ''} ${saved.employee?.lastName || ''}`.trim() || 'Employee';
        const avatar = saved.employee?.avatarUrl || null;
        if (saved.action === 'clock-in') {
          setResult({ tone: 'ok', title: `${name} clocked in`, detail: saved.message || 'Clock in saved.', photo: avatar });
        } else if (saved.action === 'clock-out') {
          setResult({ tone: 'ok', title: `${name} clocked out`, detail: saved.message || 'Clock out saved.', photo: avatar });
        } else {
          setResult({ tone: 'warn', title: name, detail: saved.message || 'Clock is not allowed right now.', photo: avatar });
        }
        holdRef.current = true;
        setStatus('Next person, look at the camera.');
      }).catch((error: unknown) => {
        if (stopped) return;
        const message = error instanceof Error ? error.message : 'Face clock failed.';
        setResult({ tone: 'error', title: 'Not matched', detail: message });
        lastFaceRef.current = null;
        holdRef.current = false;
        blinkFaceRef.current = null;
        blinkRef.current = { step: 0, base: 0, low: 0 };
        setStatus('Look at the camera.');
      });
    };
    const loop = async () => {
      if (stopped) return;
      await tick();
      if (!stopped) timer = window.setTimeout(loop, 40);
    };
    void loop();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [cameraReady]);

  if (!ready || isLoading || !isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!canOpenKiosk(user?.role)) {
    return (
      <div className="h-screen w-full bg-[#0f172a] text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
        <ScanFace className="w-10 h-10 text-emerald-400" />
        <p className="text-lg font-semibold">Only an admin or HR can open the face clock.</p>
        <button type="button" onClick={() => router.push('/attendance')} className="px-4 py-2 rounded-xl bg-white text-slate-900 text-sm font-semibold">
          Back to attendance
        </button>
      </div>
    );
  }

  const banner = result?.tone === 'ok'
    ? 'bg-emerald-500 text-white'
    : result?.tone === 'warn'
      ? 'bg-amber-400 text-slate-900'
      : 'bg-rose-500 text-white';

  return (
    <div className="fixed inset-0 bg-black text-white">
      <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover scale-x-[-1]" />
      <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full object-cover scale-x-[-1]" />
      <div className="absolute inset-x-0 top-0 z-10 px-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold truncate drop-shadow">{user?.companyName || 'Face clock'}</p>
          <button type="button" onClick={() => router.push('/attendance')} className="shrink-0 text-xs font-semibold px-3 py-2 rounded-full bg-black/55 backdrop-blur">
            Close
          </button>
        </div>
        <div className="mt-3 flex justify-center">
          <p className="rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur shadow-lg">
            {status}
          </p>
        </div>
      </div>
      {result && (
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5">
          <div className={`mx-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 shadow-xl ${banner}`}>
            {result.photo ? (
              <img src={result.photo} alt="" className="h-14 w-14 shrink-0 rounded-full border-2 border-white/80 object-cover" />
            ) : null}
            <div className="min-w-0">
              <p className="text-base font-bold leading-tight">{result.title}</p>
              <p className="mt-1 text-sm leading-snug opacity-95">{result.detail}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
