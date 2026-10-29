'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  X,
  Wifi,
  Copy,
  Check,
  Globe,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Laptop,
  AlertCircle,
} from 'lucide-react';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileConnectModal: React.FC<MobileConnectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [networkInfo, setNetworkInfo] = useState<{
    ip: string;
    mobileUrl: string;
    backendUrl: string;
  }>({
    ip: '192.168.1.106',
    mobileUrl: 'http://192.168.1.106:3000',
    backendUrl: 'http://192.168.1.106:4000',
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'wifi' | 'tunnel'>('wifi');

  const fetchIp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/network-ip');
      if (res.ok) {
        const data = await res.json();
        setNetworkInfo(data);
      }
    } catch {
      // Fallback to current hostname
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        setNetworkInfo({
          ip: window.location.hostname,
          mobileUrl: `${window.location.protocol}//${window.location.hostname}:3000`,
          backendUrl: `${window.location.protocol}//${window.location.hostname}:4000`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIp();
    }
  }, [isOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    networkInfo.mobileUrl
  )}&color=064e3b&bgcolor=f0fdf4`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-900/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-[#064e3b] via-[#059669] to-[#047857] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white border border-white/20">
              <Smartphone className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Mobile & Multi-Device Access
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                Open Paneliya HRMS on any phone or tablet instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('wifi')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'wifi'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-900/10'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            Local Wi-Fi (Super Fast)
          </button>
          <button
            onClick={() => setActiveTab('tunnel')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tunnel'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-900/10'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            Anywhere (4G / 5G / Remote)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'wifi' ? (
            <>
              {/* QR Code and URL display */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-slate-50 border border-emerald-100/80">
                <div className="relative p-2.5 bg-white rounded-2xl shadow-sm border border-emerald-200/60 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="Scan for Mobile HRMS"
                    width={150}
                    height={150}
                    className="rounded-xl"
                  />
                  <div className="mt-1 text-center text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Scan with Camera
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Live Network IP
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-1">
                      Direct Mobile Link
                    </h3>
                    <p className="text-xs text-slate-500">
                      Type this in your phone’s Chrome or Safari browser:
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-xs">
                    <span className="text-xs font-mono font-bold text-emerald-900 truncate">
                      {networkInfo.mobileUrl}
                    </span>
                    <button
                      onClick={() => handleCopy(networkInfo.mobileUrl)}
                      className="ml-auto p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors shrink-0"
                      title="Copy URL"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <button
                      onClick={fetchIp}
                      disabled={loading}
                      className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`}
                      />
                      Refresh IP ({networkInfo.ip})
                    </button>
                  </div>
                </div>
              </div>

              {/* Troubleshooting: Permanent Windows Firewall Fix */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Agar Mobile Me Site Can&apos;t Be Reached Aaye (Firewall Solution):
                </div>
                <div className="text-xs text-amber-900/90 leading-relaxed space-y-1.5">
                  <p>
                    <strong>1. Same Wi-Fi:</strong> Mobile aur Laptop dono ek hi
                    Wi-Fi se connect hone chahiye.
                  </p>
                  <p>
                    <strong>2. Permanent Firewall Fix (1-Click):</strong> Project
                    folder me di gayi file{' '}
                    <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">
                      allow-mobile-access.bat
                    </code>{' '}
                    par right-click karke <strong>&quot;Run as administrator&quot;</strong>{' '}
                    karein. Ye Windows Firewall ke block ko permanently hata deta
                    hai.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Cloud Tunnel Instructions */}
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-blue-950">
                      Instant HTTPS Cloud Link (No Wi-Fi Needed)
                    </h3>
                    <p className="text-xs text-blue-800/80 mt-0.5">
                      Works on mobile data (4G/5G) or when you are outside the
                      office without configuring any router or firewall!
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Terminal Command:
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 text-emerald-400 font-mono text-xs px-3 py-2 rounded-lg">
                    <code>npm run mobile</code>
                    <button
                      onClick={() => handleCopy('npm run mobile')}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Copy Command"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ye command chalane par ek HTTPS link{' '}
                    <span className="font-mono font-bold text-blue-700">
                      https://paneliya-hrms.loca.lt
                    </span>{' '}
                    generate ho jayegi jise kisi bhi device me open kiya ja sakta
                    hai.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Quick checklist */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
              <Laptop className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Dev Server: <strong>Port 3000</strong> (-H 0.0.0.0)
              </span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Firewall: <strong>batch script ready</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-emerald-600" />
            IP dynamically adapts to daily router changes.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#064e3b] text-white text-xs font-bold hover:bg-[#047857] transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
