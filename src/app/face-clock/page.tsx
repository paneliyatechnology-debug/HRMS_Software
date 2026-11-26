'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanFace } from 'lucide-react';
import { useAuth, isUserAdminRole } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { prepareFaceModels, sameProfileFace, scanKioskFace } from '../../lib/faceMatch';

type Result = {
  tone: 'ok' | 'warn' | 'error';
  title: string;
  detail: string;
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

export default function FaceClockPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const missedRef = useRef(0);
  const lastFaceRef = useRef<number[] | null>(null);
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
      const descriptor = await scanKioskFace(video);
      if (stopped) return;
      if (!descriptor) {
        missedRef.current += 1;
        if (missedRef.current >= 2) lastFaceRef.current = null;
        if (!lastFaceRef.current) setStatus((current) => current === 'Look at the camera.' ? current : 'Look at the camera.');
        return;
      }
      missedRef.current = 0;
      if (lastFaceRef.current && sameProfileFace(lastFaceRef.current, descriptor)) return;
      lastFaceRef.current = descriptor;
      setStatus('Checking this face…');
      const photo = framePhoto(video);
      void api.faceKioskClock({
        faceDescriptor: descriptor,
        photo: photo || undefined,
      }).then((saved) => {
        if (stopped) return;
        const name = `${saved.employee?.firstName || ''} ${saved.employee?.lastName || ''}`.trim() || 'Employee';
        if (saved.action === 'clock-in') {
          setResult({ tone: 'ok', title: `${name} clocked in`, detail: saved.message || 'Clock in saved.' });
        } else if (saved.action === 'clock-out') {
          setResult({ tone: 'ok', title: `${name} clocked out`, detail: saved.message || 'Clock out saved.' });
        } else {
          setResult({ tone: 'warn', title: name, detail: saved.message || 'Clock is not allowed right now.' });
        }
        setStatus('Next person, look at the camera.');
      }).catch((error: unknown) => {
        if (stopped) return;
        const message = error instanceof Error ? error.message : 'Face clock failed.';
        setResult({ tone: 'error', title: 'Not matched', detail: message });
        setStatus('Next person, look at the camera.');
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
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <p className="text-sm font-semibold truncate">{user?.companyName || 'Face clock'}</p>
        <button type="button" onClick={() => router.push('/attendance')} className="text-xs font-semibold px-3 py-2 rounded-lg bg-black/50">
          Close
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6 pt-10 bg-gradient-to-t from-black/70 to-transparent space-y-3">
        <p className="text-sm text-center">{status}</p>
        {result && (
          <div className={`mx-auto w-full max-w-lg rounded-2xl px-4 py-3 ${banner}`}>
            <p className="text-base font-bold">{result.title}</p>
            <p className="text-sm opacity-90">{result.detail}</p>
          </div>
        )}
      </div>
    </div>
  );
}
