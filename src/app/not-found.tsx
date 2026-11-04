'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[#a3b18a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#d8ebd9] shadow-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#059669] bg-[#ecfdf5] px-3 py-1 rounded-full border border-[#a7f3d0]">
            Error 404
          </span>
          <h1 className="text-2xl font-black text-[#0d271d] tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-[#4e6a5d] leading-relaxed">
            The requested module or page route does not exist in the Paneliya HRMS system. Please verify the URL or return to the main dashboard.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#053d2e] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Portal Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

