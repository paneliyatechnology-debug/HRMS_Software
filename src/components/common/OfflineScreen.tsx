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
    <div className="fixed inset-0 z-[9999] bg-[#FFFDF7] flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto selection:bg-[#FFE600] selection:text-black">
      {/* Top Neo-Brutalist Ticker Warning */}
      <div className="w-full absolute top-0 left-0 bg-[#FF5E97] border-b-[3px] border-black py-2.5 px-4 overflow-hidden">
        <div className="flex items-center justify-center gap-4 text-xs font-black uppercase tracking-widest text-black text-center">
          <span>⚡ NETWORK DISCONNECTED</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">LOCAL CACHE &amp; ATTENDANCE SAFE</span>
          <span className="hidden sm:inline">|</span>
          <span>AUTO-RECONNECT ACTIVE</span>
        </div>
      </div>

      {/* Main Neo-Brutalist Window Box */}
      <div className="relative max-w-xl w-full rounded-3xl bg-white border-4 border-black shadow-[10px_10px_0px_0px_#000] p-6 sm:p-10 my-8">
        {/* Retro Window Control Bar */}
        <div className="flex items-center justify-between pb-5 border-b-2 border-black mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#FF5E97] border-2 border-black" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#FFE600] border-2 border-black" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#00F0B5] border-2 border-black" />
            <span className="ml-2 text-xs font-mono font-black text-black bg-[#FAF8F5] px-2.5 py-0.5 rounded border border-black">
              status: offline_0x0
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-black bg-[#FFE600] px-2.5 py-1 rounded-md border-2 border-black">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            NO SIGNAL
          </span>
        </div>

        {/* Center Graphic Icon Box */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-[#FFE600] border-[3px] border-black flex items-center justify-center text-black shadow-[5px_5px_0px_0px_#000] -rotate-2">
              <WifiOff className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-[#FF5E97] border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_#000] rotate-6">
              <Zap className="w-4 h-4 stroke-[3] text-black" />
            </div>
          </div>
        </div>

        {/* Big Brutalist Heading */}
        <div className="text-center">
          <div className="inline-block bg-[#FF5E97] text-white border-2 border-black px-3 py-1 font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_#000] -rotate-1 mb-3">
            YOU ARE CURRENTLY OFFLINE
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight leading-tight">
            Internet Connection Lost!
          </h1>
          <p className="text-sm font-semibold text-slate-700 mt-3 leading-relaxed max-w-md mx-auto">
            Looks like your Wi-Fi or mobile data took a break. Don&apos;t worry — your biometric punches and cached work are safely preserved locally!
          </p>
        </div>

        {/* Feature Safeguards Checklist */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FFFDF0] border-2 border-black shadow-[3px_3px_0px_0px_#000]">
            <div className="w-9 h-9 rounded-xl bg-[#00F0B5] border-2 border-black text-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
              <HardDriveDownload className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-black">Offline Punches Queued</p>
              <p className="text-[11px] font-bold text-slate-600">Attendance clock-ins are saved on device &amp; will auto-sync.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F0FFF9] border-2 border-black shadow-[3px_3px_0px_0px_#000]">
            <div className="w-9 h-9 rounded-xl bg-[#38BDF8] border-2 border-black text-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-black">Automatic Recovery</p>
              <p className="text-[11px] font-bold text-slate-600">The app will automatically re-open as soon as your internet returns.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
          <button
            onClick={handleRetry}
            disabled={isReconnecting}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-[#FFE600] hover:bg-[#ffd700] text-black font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isReconnecting ? 'animate-spin' : ''}`} />
            <span>{isReconnecting ? 'Testing Connection...' : 'Retry Connection'}</span>
          </button>

          <button
            onClick={() => setDismissedTemporarily(true)}
            className="py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-50 text-black font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>View Cached App</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="text-center text-[11px] font-black uppercase tracking-wider text-black">
        <span className="bg-[#FAF8F5] px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]">
          My Own HRMS • Enterprise Offline Resilience Engine
        </span>
      </div>
    </div>
  );
};
