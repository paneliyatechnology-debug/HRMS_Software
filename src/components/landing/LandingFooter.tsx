'use client';

import React from 'react';
import { ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="py-7 sm:py-8 bg-gradient-to-r from-[#e8f4ec] via-[#f4faf6] to-[#e8f4ec] border-t border-[#95d5b2]/70 text-xs text-slate-600 shadow-[0_-4px_20px_-6px_rgba(27,67,50,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#95d5b2]/80 flex items-center justify-center p-1 shadow-xs">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <img src="/brand-name.png" alt="myown hrms" className="h-4.5 w-auto object-contain" />
            <span className="text-[10px] font-semibold text-[#2d6a4f] tracking-wide">
              Enterprise Workforce Platform
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] font-bold text-[#1b4332]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#95d5b2]/70 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2d6a4f]" />
            <span>Tenant Isolated</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#95d5b2]/70 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#2d6a4f]" />
            <span>Live Attendance Sync</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#95d5b2]/70 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2d6a4f]" />
            <span>Statutory Payroll</span>
          </span>
        </div>

        <div className="text-center md:text-right">
          <p className="font-semibold text-slate-600">
            &copy; {new Date().getFullYear()} Paneliya Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
