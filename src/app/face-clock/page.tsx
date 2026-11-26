'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ScanFace,
  Lock,
  Mail,
  Eye,
  EyeOff,
  RefreshCw,
  Maximize2,
  Minimize2,
  LogOut,
  ShieldCheck,
  Coffee,
  Play,
  Square,
  Volume2,
  VolumeX,
  Crown,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';
import { prepareFaceModels, sameProfileFace, scanKioskFace } from '../../lib/faceMatch';
import {
  KIOSK_VOICE_LANGUAGES,
  buildKioskPhrase,
  speakKioskText,
  unlockKioskSpeech,
  type KioskSpeechEvent,
  type KioskVoiceGender,
  type KioskVoiceLang,
} from '../../lib/kioskVoice';

type Result = {
  tone: 'ok' | 'warn' | 'error';
  title: string;
  detail: string;
  photo?: string | null;
  speech?: KioskSpeechEvent;
};

type PendingChoice = {
  employee: { id: string; firstName?: string; lastName?: string; avatarUrl?: string | null };
  state: 'working' | 'on_break';
  options: Array<'break-in' | 'break-out' | 'clock-out'>;
  descriptor: number[];
  photo?: string;
  message?: string;
};

function canOpenKiosk(role?: string) {
  const normalized = String(role || '').trim().toUpperCase();
  return ['ADMIN', 'COMPANY_ADMIN', 'ORG_ADMIN'].includes(normalized);
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
  tone: 'ok' | 'warn' = 'ok',
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
  ctx.strokeStyle = tone === 'warn' ? '#facc15' : '#39ff88';
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
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const socketRef = useRef(socket);
  const connectedRef = useRef(isConnected);
  useEffect(() => {
    socketRef.current = socket;
    connectedRef.current = isConnected;
  }, [socket, isConnected]);

  const runFaceKiosk = async (payload: {
    faceDescriptor: number[];
    action?: 'clock-in' | 'clock-out' | 'break-in' | 'break-out';
  }): Promise<Awaited<ReturnType<typeof api.faceKioskClock>>> => {
    const activeSocket = socketRef.current;
    if (activeSocket && connectedRef.current) {
      try {
        const res = await activeSocket.timeout(3500).emitWithAck('face_kiosk_clock', payload);
        if (res?.ok && res.data) {
          return res.data;
        }
        if (res && res.ok === false && res.error) {
          throw new Error(String(res.error));
        }
      } catch (err: unknown) {
        if (err instanceof Error && !err.message.includes('timed out')) {
          throw err;
        }
      }
    }
    return api.faceKioskClock(payload);
  };
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wakeLockRef = useRef<any>(null);
  const missedRef = useRef(0);
  const lastFaceRef = useRef<number[] | null>(null);
  const liveTrackRef = useRef<{ count: number; descriptor: number[] | null; box: { x: number; y: number; width: number; height: number } | null }>({
    count: 0,
    descriptor: null,
    box: null,
  });
  const holdRef = useRef(false);
  const holdUntilRef = useRef(0);
  const checkingRef = useRef(false);
  const differRef = useRef(0);
  const scanToneRef = useRef<'ok' | 'warn'>('ok');

  const [status, setStatus] = useState('Starting camera…');
  const [result, setResult] = useState<Result | null>(null);
  const [pendingChoice, setPendingChoice] = useState<PendingChoice | null>(null);
  const pendingChoiceRef = useRef<PendingChoice | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [needsHttps, setNeedsHttps] = useState(false);
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);
  const [cameraRetryTick, setCameraRetryTick] = useState(0);
  const [ready, setReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [wakeActive, setWakeActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clockText, setClockText] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  const soundOnRef = useRef(true);
  const [voiceLang, setVoiceLang] = useState<KioskVoiceLang>('en-IN');
  const [voiceGender, setVoiceGender] = useState<KioskVoiceGender>('female');
  const voiceLangRef = useRef<KioskVoiceLang>('en-IN');
  const voiceGenderRef = useRef<KioskVoiceGender>('female');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [savingVoice, setSavingVoice] = useState(false);
  const [premiumState, setPremiumState] = useState<{ loading: boolean; premium: boolean; message: string }>({
    loading: true,
    premium: false,
    message: '',
  });

  // Standalone Kiosk Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    setReady(true);
    void prepareFaceModels().catch(() => undefined);
  }, []);

  // Live clock display on kiosk
  useEffect(() => {
    const updateClock = () => {
      setClockText(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
      );
    };
    updateClock();
    const id = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(id);
  }, []);

  // 24x7 Screen Wake Lock (prevents screen from turning off on mobile, tablet, and desktop)
  useEffect(() => {
    if (!isAuthenticated || !canOpenKiosk(user?.role)) return;
    let cancelled = false;

    const acquireWakeLock = async () => {
      if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
      try {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        if (cancelled) {
          await sentinel.release().catch(() => undefined);
          return;
        }
        wakeLockRef.current = sentinel;
        setWakeActive(true);
        sentinel.addEventListener('release', () => {
          setWakeActive(false);
        });
      } catch {
        setWakeActive(false);
      }
    };

    void acquireWakeLock();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void acquireWakeLock();
      }
    };
    const keepAliveTimer = window.setInterval(() => {
      if (!wakeLockRef.current && document.visibilityState === 'visible') {
        void acquireWakeLock();
      }
    }, 30000);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(keepAliveTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
      wakeLockRef.current?.release?.().catch(() => undefined);
      wakeLockRef.current = null;
    };
  }, [isAuthenticated, user?.role]);

  const lastNotMatchedSpokenRef = useRef(0);

  // Speak attendance events (including 'not-matched') in selected language/gender & auto-clear after 5 seconds
  useEffect(() => {
    if (!result) return;
    if (result.speech) {
      if (result.speech.kind === 'not-matched') {
        const now = Date.now();
        if (now - lastNotMatchedSpokenRef.current >= 2500) {
          lastNotMatchedSpokenRef.current = now;
          speakKioskText(result.speech, {
            enabled: soundOnRef.current,
            lang: voiceLangRef.current,
            gender: voiceGenderRef.current,
          });
        }
      } else {
        speakKioskText(result.speech, {
          enabled: soundOnRef.current,
          lang: voiceLangRef.current,
          gender: voiceGenderRef.current,
        });
      }
    }
    const t = window.setTimeout(() => setResult(null), 5000);
    return () => window.clearTimeout(t);
  }, [result]);

  useEffect(() => {
    pendingChoiceRef.current = pendingChoice;
    if (!pendingChoice) return;
    const t = window.setTimeout(() => {
      setPendingChoice(null);
      setStatus('Look at the camera.');
    }, 15000);
    return () => window.clearTimeout(t);
  }, [pendingChoice]);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    voiceLangRef.current = voiceLang;
  }, [voiceLang]);

  useEffect(() => {
    voiceGenderRef.current = voiceGender;
  }, [voiceGender]);

  useEffect(() => {
    if (!isAuthenticated || !canOpenKiosk(user?.role)) return;
    let cancelled = false;
    api.getKioskVoice()
      .then((res: any) => {
        if (cancelled) return;
        const lang = String(res?.kioskVoiceLang || 'en-IN') as KioskVoiceLang;
        const gender = res?.kioskVoiceGender === 'male' ? 'male' : 'female';
        if (KIOSK_VOICE_LANGUAGES.some((item) => item.code === lang)) {
          setVoiceLang(lang);
        }
        setVoiceGender(gender);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      synth.getVoices();
    };
    loadVoices();
    synth.addEventListener?.('voiceschanged', loadVoices);
    const onFirstTouch = () => {
      unlockKioskSpeech();
    };
    window.addEventListener('pointerdown', onFirstTouch, { once: true, passive: true });
    return () => {
      synth.removeEventListener?.('voiceschanged', loadVoices);
      window.removeEventListener('pointerdown', onFirstTouch);
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // iOS Safari does not support Fullscreen API on div/document; ignore safely
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !canOpenKiosk(user?.role)) {
      setPremiumState({ loading: false, premium: false, message: '' });
      return;
    }
    let cancelled = false;
    setPremiumState((prev) => ({ ...prev, loading: true }));
    api.getCompanyPremium()
      .then((res: any) => {
        if (cancelled) return;
        const active = Boolean(res?.premium);
        const features = Array.isArray(res?.features) ? (res.features as string[]) : null;
        const hasFaceClock = active && (!features || features.includes('face_clock'));
        const expired = Boolean(res?.expired);
        const planName = res?.planName ? String(res.planName) : '';
        const msg = hasFaceClock
          ? ''
          : active && planName
            ? `Your ${planName} plan does not include Face Clock Kiosk. Please upgrade your plan.`
            : expired && planName
              ? `Your ${planName} plan has expired. Please upgrade to continue using Face Clock Kiosk.`
              : 'Face Clock Kiosk is a Premium feature. Please purchase a plan to continue.';
        setPremiumState({ loading: false, premium: hasFaceClock, message: msg });
      })
      .catch(() => {
        if (cancelled) return;
        setPremiumState({
          loading: false,
          premium: false,
          message: 'Please purchase a Premium plan to use Face Clock Kiosk.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.role]);

  // Start / restart camera when authenticated as Admin with active Premium
  useEffect(() => {
    if (!ready || !isAuthenticated || !canOpenKiosk(user?.role) || !premiumState.premium) return;
    let stopped = false;
    setCameraReady(false);
    const video = videoRef.current;
    if (!video) return;

    const start = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setNeedsHttps(true);
        setStatus('Live mobile camera requires HTTPS.');
        return;
      }
      setNeedsHttps(false);
      try {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode },
              audio: false,
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        }
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.srcObject = stream;
        try {
          await video.play();
          setNeedsTapToPlay(false);
          setCameraReady(true);
          setStatus('Look at the camera. Your face clocks you in or out.');
        } catch {
          setNeedsTapToPlay(true);
          setStatus('Tap "Start Live Camera" below to begin.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : 'Camera permission is blocked.';
        setStatus(`Camera error: ${msg}`);
      }
    };
    void start();
    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  // Update camera dependencies so it restarts when premium becomes active
  }, [ready, isAuthenticated, user?.role, facingMode, cameraRetryTick, premiumState.premium]);

  useEffect(() => {
    if (!cameraReady) return;
    let timer = 0;
    let stopped = false;
    const tick = async () => {
      const video = videoRef.current;
      if (!video || stopped) return;
      if (pendingChoiceRef.current || checkingRef.current) return;
      const needDescriptor = holdRef.current || !liveTrackRef.current.descriptor;
      let live: Awaited<ReturnType<typeof scanKioskFace>> = null;
      try {
        live = await scanKioskFace(video, needDescriptor);
      } catch {
        return;
      }
      if (stopped) return;
      paintScan(overlayRef.current, video, live, scanToneRef.current);
      if (!live) {
        missedRef.current += 1;
        if (missedRef.current >= 6) {
          lastFaceRef.current = null;
          liveTrackRef.current = { count: 0, descriptor: null, box: null };
          holdRef.current = false;
          holdUntilRef.current = 0;
          differRef.current = 0;
          scanToneRef.current = 'ok';
          setStatus('Look at the camera.');
        }
        return;
      }
      const descriptor = live.descriptor;
      missedRef.current = 0;
      if (holdRef.current) {
        if (Date.now() < holdUntilRef.current && lastFaceRef.current && descriptor && sameProfileFace(lastFaceRef.current, descriptor)) {
          differRef.current = 0;
          return;
        }
        if (Date.now() < holdUntilRef.current) {
          differRef.current += 1;
          if (differRef.current < 3) return;
        }
        holdRef.current = false;
        holdUntilRef.current = 0;
        differRef.current = 0;
        scanToneRef.current = 'ok';
      }

      // Passive real-face quality & stability check (fast scan, rejects flat/glare photos)
      const minFaceW = Math.max(60, video.videoWidth * 0.16);
      if (!live.textureOk) {
        liveTrackRef.current = { count: 0, descriptor: null, box: null };
        setStatus('Live face required. Please try again.');
        setResult({
          tone: 'error',
          title: 'Face is not match',
          detail: 'Photo or screen glare detected. Please try again.',
          speech: { kind: 'not-matched' },
        });
        return;
      }
      if (live.score < 0.54 || live.box.width < minFaceW) {
        liveTrackRef.current = { count: 0, descriptor: null, box: null };
        setStatus(live.box.width < minFaceW ? 'Move closer to the camera.' : 'Look clearly at the camera.');
        return;
      }

      const prevBox = liveTrackRef.current.box;
      if (prevBox) {
        const shift = Math.hypot(
          live.box.x + live.box.width / 2 - (prevBox.x + prevBox.width / 2),
          live.box.y + live.box.height / 2 - (prevBox.y + prevBox.height / 2),
        );
        if (shift > Math.max(live.box.width, 1) * 0.25) {
          liveTrackRef.current = { count: 1, descriptor: descriptor ?? liveTrackRef.current.descriptor, box: live.box };
          setStatus('Hold still for a moment…');
          return;
        }
      }

      const nextCount = liveTrackRef.current.count + 1;
      const trackedDescriptor = liveTrackRef.current.descriptor || descriptor;
      liveTrackRef.current = { count: nextCount, descriptor: trackedDescriptor, box: live.box };
      if (nextCount < 2 || !trackedDescriptor) {
        setStatus('Scanning face…');
        return;
      }

      liveTrackRef.current = { count: 0, descriptor: null, box: null };
      checkingRef.current = true;
      setStatus('Checking this face…');
      const matchDescriptor = trackedDescriptor;
      void runFaceKiosk({
        faceDescriptor: matchDescriptor,
      }).then((saved) => {
        checkingRef.current = false;
        if (stopped) return;
        lastFaceRef.current = matchDescriptor;
        const name = `${saved.employee?.firstName || ''} ${saved.employee?.lastName || ''}`.trim() || 'Employee';
        const avatar = saved.employee?.avatarUrl || null;
        if (saved.action === 'choose' && saved.employee && saved.state) {
          setResult(null);
          setPendingChoice({
            employee: saved.employee,
            state: saved.state,
            options: saved.options || (saved.state === 'on_break' ? ['break-out'] : ['break-in', 'clock-out']),
            descriptor: matchDescriptor,
            message: saved.message,
          });
          holdRef.current = true;
          holdUntilRef.current = Date.now() + 4000;
          setStatus(saved.state === 'on_break' ? `${name}: End your break?` : `${name}: Choose Break or Check Out.`);
          return;
        }
        if (saved.action === 'clock-in') {
          const lateMinutes = saved.logic?.lateMinutes ?? 0;
          if (lateMinutes > 0) {
            const hrs = Math.floor(lateMinutes / 60);
            const mins = lateMinutes % 60;
            const lateText = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
            scanToneRef.current = 'warn';
            setResult({
              tone: 'warn',
              title: `${name} clocked in`,
              detail: `Late by ${lateText}${saved.logic?.shiftStart ? ` (Shift: ${saved.logic.shiftStart})` : ''}`,
              photo: avatar,
              speech: { kind: 'clock-in', name, lateText },
            });
          } else {
            scanToneRef.current = 'ok';
            setResult({
              tone: 'ok',
              title: `${name} clocked in`,
              detail: saved.logic?.shiftStart ? `On time (Shift: ${saved.logic.shiftStart})` : (saved.message || 'Clock in saved.'),
              photo: avatar,
              speech: { kind: 'clock-in', name },
            });
          }
        } else if (saved.action === 'clock-out') {
          scanToneRef.current = 'ok';
          setResult({
            tone: 'ok',
            title: `${name} clocked out`,
            detail: saved.message || 'Clock out saved.',
            photo: avatar,
            speech: { kind: 'clock-out', name },
          });
        } else if (saved.action === 'break-in') {
          scanToneRef.current = 'warn';
          setResult({
            tone: 'warn',
            title: `${name} is on break`,
            detail: saved.message || 'Break started.',
            photo: avatar,
            speech: { kind: 'break-in', name },
          });
        } else if (saved.action === 'break-out') {
          scanToneRef.current = 'ok';
          setResult({
            tone: 'ok',
            title: `${name} is back from break`,
            detail: saved.message || 'Break ended.',
            photo: avatar,
            speech: { kind: 'break-out', name },
          });
        } else {
          scanToneRef.current = 'warn';
          setResult({ tone: 'warn', title: name, detail: saved.message || 'Clock is not allowed right now.', photo: avatar });
        }
        holdRef.current = true;
        holdUntilRef.current = Date.now() + 5000;
        setStatus('Next person, look at the camera.');
      }).catch((error: unknown) => {
        checkingRef.current = false;
        if (stopped) return;
        const message = error instanceof Error ? error.message : 'Face clock failed.';
        setResult({
          tone: 'error',
          title: 'Not matched',
          detail: message,
          speech: { kind: 'not-matched' },
        });
        lastFaceRef.current = null;
        holdRef.current = false;
        holdUntilRef.current = 0;
        liveTrackRef.current = { count: 0, descriptor: null, box: null };
        setStatus('Look at the camera.');
      });
    };
    const loop = async () => {
      if (stopped) return;
      await tick();
      if (!stopped) timer = window.setTimeout(loop, 10);
    };
    void loop();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [cameraReady]);

  const handleChoiceAction = async (action: 'break-in' | 'break-out' | 'clock-out') => {
    if (!pendingChoice || actionBusy) return;
    setActionBusy(true);
    setStatus('Saving…');
    try {
      const saved = await runFaceKiosk({
        faceDescriptor: pendingChoice.descriptor,
        action,
      });
      const name = `${saved.employee?.firstName || pendingChoice.employee.firstName || ''} ${saved.employee?.lastName || pendingChoice.employee.lastName || ''}`.trim() || 'Employee';
      const avatar = saved.employee?.avatarUrl ?? pendingChoice.employee.avatarUrl ?? null;
      lastFaceRef.current = pendingChoice.descriptor;
      holdRef.current = true;
      holdUntilRef.current = Date.now() + 5000;
      liveTrackRef.current = { count: 0, descriptor: null, box: null };
      setPendingChoice(null);
      if (action === 'break-in') {
        scanToneRef.current = 'warn';
        setResult({
          tone: 'warn',
          title: `${name} is on break`,
          detail: saved.message || 'Break started.',
          photo: avatar,
          speech: { kind: 'break-in', name },
        });
      } else if (action === 'break-out') {
        scanToneRef.current = 'ok';
        setResult({
          tone: 'ok',
          title: `${name} is back from break`,
          detail: saved.message || 'Break ended. Work resumed.',
          photo: avatar,
          speech: { kind: 'break-out', name },
        });
      } else {
        scanToneRef.current = 'ok';
        setResult({
          tone: 'ok',
          title: `${name} clocked out`,
          detail: saved.message || 'Clock out saved for today.',
          photo: avatar,
          speech: { kind: 'clock-out', name },
        });
      }
      setStatus('Next person, look at the camera.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Action failed.';
      setPendingChoice(null);
      setResult({ tone: 'error', title: 'Action failed', detail: message });
      setStatus('Look at the camera.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleKioskLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await login(loginEmail.trim(), loginPassword);
      if (!res.success) {
        setLoginError(res.message || 'Invalid email or password.');
      } else if (!canOpenKiosk(res.role)) {
        setLoginError('Only a Company Admin account can start the Face Clock Kiosk.');
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoggingIn(false);
    }
  };

  if (!ready || isLoading) {
    return (
      <div className="h-[100dvh] w-full bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Standalone Kiosk Login Screen (stays ONLY on /face-clock after login)
  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] w-full bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <ScanFace className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight mt-1">24×7 Face Clock Kiosk</h1>
            <p className="text-xs text-slate-400">
              Sign in with your Company Admin email &amp; password to run the always-on face attendance terminal.
            </p>
          </div>

          {loginError && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleKioskLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition cursor-pointer disabled:opacity-50"
            >
              {loggingIn ? 'Starting Kiosk...' : 'Start Face Clock Kiosk'}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Screen stays awake 24×7 · Works on Mobile &amp; Tablet</span>
          </div>
        </div>
      </div>
    );
  }

  if (!canOpenKiosk(user?.role)) {
    return (
      <div className="h-[100dvh] w-full bg-[#0f172a] text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
        <ScanFace className="w-10 h-10 text-emerald-400" />
        <p className="text-lg font-semibold">Only a Company Admin can open the face clock.</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => logout()}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
          >
            Login as Admin
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-xl bg-white text-slate-900 text-sm font-semibold cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (premiumState.loading) {
    return (
      <div className="h-[100dvh] w-full bg-slate-950 text-white flex flex-col items-center justify-center gap-3 px-6 text-center">
        <Crown className="w-10 h-10 text-amber-400 animate-pulse" />
        <p className="text-sm font-semibold text-slate-300">Checking company plan…</p>
      </div>
    );
  }

  if (!premiumState.premium) {
    return (
      <div className="h-[100dvh] w-full bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-400 flex items-center justify-center">
          <Crown className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
            Premium Feature
          </span>
          <h1 className="text-xl font-bold text-white">Face Clock Kiosk</h1>
          <p className="text-sm text-slate-400">
            {premiumState.message || 'Please purchase a Premium plan to unlock 24×7 Face Clock Kiosk.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => router.push('/dashboard?module=plans')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Crown className="w-4 h-4" />
            <span>Upgrade to Premium</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold cursor-pointer"
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const banner = result?.tone === 'ok'
    ? 'bg-emerald-500 text-white'
    : result?.tone === 'warn'
      ? 'bg-amber-400 text-slate-900'
      : 'bg-rose-500 text-white';

  const screenRing = result?.tone === 'warn'
    ? 'ring-8 ring-inset ring-amber-400'
    : result?.tone === 'ok'
      ? 'ring-8 ring-inset ring-emerald-500'
      : '';

  return (
    <div className={`fixed inset-0 h-[100dvh] w-full bg-black text-white select-none overflow-hidden ${screenRing}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
      />
      <canvas
        ref={overlayRef}
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
      />

      {/* Top Bar */}
      <div className="absolute inset-x-0 top-0 z-10 px-3 sm:px-5 pt-3 sm:pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-xs font-semibold truncate">
              <span className={`w-2 h-2 rounded-full ${wakeActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="truncate">{user?.companyName || 'Face Clock Kiosk'}</span>
            </span>
            {clockText && (
              <span className="hidden sm:inline-block rounded-full bg-black/55 backdrop-blur px-3 py-1.5 text-xs font-mono font-bold">
                {clockText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                if (next) {
                  unlockKioskSpeech();
                  speakKioskText({ kind: 'test' }, {
                    enabled: true,
                    lang: voiceLang,
                    gender: voiceGender,
                  });
                } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              title={soundOn ? 'Mute Voice' : 'Enable Voice'}
              className="min-h-[36px] inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur cursor-pointer"
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{soundOn ? 'Voice' : 'Muted'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                unlockKioskSpeech();
                setShowVoiceModal(true);
              }}
              title="Voice Language & Gender"
              className="min-h-[36px] inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Lang</span>
            </button>
            <button
              type="button"
              onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
              title="Switch Camera"
              className="min-h-[36px] inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flip</span>
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              title="Fullscreen"
              className="min-h-[36px] inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => logout()}
              title="Sign Out Kiosk"
              className="min-h-[36px] inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-black/60 hover:bg-rose-600/80 backdrop-blur cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <div className="mt-3 flex justify-center">
          <p className="rounded-full bg-black/65 px-4 py-2 text-xs sm:text-sm font-medium text-white backdrop-blur shadow-lg text-center">
            {status}
          </p>
        </div>
      </div>

      {/* Tap-to-Start Overlay for Mobile Autoplay / Permission Retry */}
      {!needsHttps && !cameraReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
          <div className="pointer-events-auto flex flex-col items-center gap-3 bg-black/70 backdrop-blur-md border border-white/15 rounded-3xl px-6 py-5 shadow-2xl max-w-xs w-full">
            <ScanFace className="w-9 h-9 text-emerald-400" />
            <p className="text-xs text-slate-200 font-medium">{status}</p>
            <button
              type="button"
              onClick={async () => {
                unlockKioskSpeech();
                if (needsTapToPlay && videoRef.current) {
                  try {
                    await videoRef.current.play();
                    setNeedsTapToPlay(false);
                    setCameraReady(true);
                    setStatus('Look at the camera. Your face clocks you in or out.');
                    return;
                  } catch {
                    // fall through to re-request stream
                  }
                }
                setCameraRetryTick((n) => n + 1);
              }}
              className="w-full py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm transition cursor-pointer"
            >
              {needsTapToPlay ? 'Start Live Camera' : 'Retry Camera'}
            </button>
          </div>
        </div>
      )}

      {/* Mobile HTTPS Prompt for Live Streaming Camera */}
      {needsHttps && (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center px-6 text-center bg-slate-950">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5">
            <ScanFace className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1.5">HTTPS Needed for Live Camera</h2>
          <p className="text-xs text-slate-400 max-w-xs mb-6">
            Mobile browsers require an <strong className="text-slate-200">https://</strong> connection to open the live face-scanning camera.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = `https://${window.location.hostname}:3443${window.location.pathname}`;
            }}
            className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl transition cursor-pointer"
          >
            Open HTTPS Live Camera
          </button>
          <p className="text-[11px] text-slate-500 mt-5 max-w-xs">
            Opens <code className="text-slate-300">https://&lt;your-ip&gt;:3443/face-clock</code> for live mobile camera access.
          </p>
        </div>
      )}

      {/* Employee Break / Check Out Choice Overlay */}
      {pendingChoice && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl text-center space-y-5">
            <div className="flex flex-col items-center gap-2.5">
              {pendingChoice.employee.avatarUrl ? (
                <img
                  src={pendingChoice.employee.avatarUrl}
                  alt=""
                  className="h-16 w-16 rounded-full border-2 border-emerald-400 object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-xl font-bold text-emerald-300">
                  {(pendingChoice.employee.firstName?.[0] || 'E').toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-white">
                  {`${pendingChoice.employee.firstName || ''} ${pendingChoice.employee.lastName || ''}`.trim() || 'Employee'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {pendingChoice.state === 'on_break'
                    ? 'Your break is currently active. End break?'
                    : 'You are clocked in. What would you like to do?'}
                </p>
              </div>
            </div>

            {pendingChoice.state === 'on_break' ? (
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => void handleChoiceAction('break-out')}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{actionBusy ? 'Saving...' : 'Break Out (Resume Work)'}</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void handleChoiceAction('break-in')}
                  className="py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Coffee className="w-4 h-4" />
                  <span>Break In</span>
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void handleChoiceAction('clock-out')}
                  className="py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Check Out</span>
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={actionBusy}
              onClick={() => {
                setPendingChoice(null);
                setStatus('Look at the camera.');
              }}
              className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Voice Language & Gender Customization Modal */}
      {showVoiceModal && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-xs px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Voice Settings</h2>
              <button
                type="button"
                onClick={() => setShowVoiceModal(false)}
                className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Language</label>
              <div className="grid grid-cols-2 gap-2">
                {KIOSK_VOICE_LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setVoiceLang(item.code)}
                    className={`px-3 py-2 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                      voiceLang === item.code
                        ? 'bg-emerald-600/20 border-emerald-400 text-white'
                        : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div>{item.label}</div>
                    <div className="text-[10px] text-slate-400">{item.native}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Voice Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['female', 'male'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setVoiceGender(g)}
                    className={`py-2.5 rounded-xl border text-xs font-bold capitalize transition cursor-pointer ${
                      voiceGender === g
                        ? 'bg-emerald-600/20 border-emerald-400 text-white'
                        : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  unlockKioskSpeech();
                  speakKioskText({ kind: 'test' }, {
                    enabled: true,
                    lang: voiceLang,
                    gender: voiceGender,
                  });
                }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Test Voice
              </button>
              <button
                type="button"
                disabled={savingVoice}
                onClick={async () => {
                  setSavingVoice(true);
                  try {
                    await api.saveKioskVoice({
                      kioskVoiceLang: voiceLang,
                      kioskVoiceGender: voiceGender,
                    });
                    setShowVoiceModal(false);
                  } catch {
                    // keep modal open if save fails
                  } finally {
                    setSavingVoice(false);
                  }
                }}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {savingVoice ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Result Banner */}
      {result && (
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6">
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
