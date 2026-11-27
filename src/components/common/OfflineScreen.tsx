'use client';

import React, { useState, useEffect } from 'react';
import {
  WifiOff,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  HardDriveDownload,
  Activity,
  Globe,
} from 'lucide-react';

export const OfflineScreen: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [justRestored, setJustRestored] = useState(false);
  const [dismissedTemporarily, setDismissedTemporarily] = useState(false);

  useEffect(() => {
    // Check initial online status
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setJustRestored(false);
      setDismissedTemporarily(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setJustRestored(true);
      // Auto-hide the "Back Online" notification after 3.5 seconds
      setTimeout(() => {
        setJustRestored(false);
      }, 3500);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleRetry = async () => {
    setIsReconnecting(true);
    try {
      // Ping health or root with cache: no-store and 2.5s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('/favicon.ico?ping=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok || navigator.onLine) {
        setIsOffline(false);
        setJustRestored(true);
        setTimeout(() => setJustRestored(false), 3500);
      }
    } catch {
      // Still offline
    } finally {
      setTimeout(() => {
        setIsReconnecting(false);
      }, 600);
    }
  };

  // If connection was just restored, show sleek Neo-Brutalist floating recovery pill
  if (justRestored) {
    return (
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-6 duration-300">
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#00F0B5] border-[3px] border-black shadow-[5px_5px_0px_0px_#000] text-black">
          <div className="w-8 h-8 rounded-xl bg-black text-[#00F0B5] flex items-center justify-center font-black">
            <CheckCircle2 className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider">Back Online! 🚀</p>
            <p className="text-[11px] font-bold text-slate-900">Your connection is restored and live data is syncing.</p>
          </div>
        </div>
      </div>
    );
  }

  // If online or user chose to inspect cached view
  if (!isOffline || dismissedTemporarily) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto selection:bg-emerald-600 selection:text-white">
      {/* Enterprise Card */}
      <div className="relative max-w-md w-full rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-8 my-auto animate-in fade-in zoom-in-95">
        {/* Status Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Network Disconnected
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            status: offline
          </span>
        </div>

        {/* Center Graphic */}
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4 shadow-xs">
          <WifiOff className="w-7 h-7" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Connection Lost
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Your device appears to be offline. Your biometric shift records and attendance states are safely preserved.
          </p>
        </div>

        {/* Safeguards Checklist */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <HardDriveDownload className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">Offline Punches Queued</p>
              <p className="text-[11px] text-slate-500">Attendance clock-ins are saved on device &amp; will auto-sync.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">Automatic Recovery</p>
              <p className="text-[11px] text-slate-500">The app will automatically reconnect as soon as signal returns.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={handleRetry}
            disabled={isReconnecting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
            <span>{isReconnecting ? 'Testing Connection...' : 'Retry Connection'}</span>
          </button>

          <button
            onClick={() => setDismissedTemporarily(true)}
            className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>View Cached App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
