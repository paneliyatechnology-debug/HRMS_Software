'use client';

import React from 'react';
import {
  LogOut,
  Clock,
  Sparkles,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';

interface ResignationsModuleProps {
  portalMode?: 'employee' | 'admin';
}

export const ResignationsModule: React.FC<ResignationsModuleProps> = () => {
  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto select-none">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200 shadow-2xs">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Resignations &amp; Clearance</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Separation workflow, notice period tracking, departmental clearance, and relieving letters
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Backend API In Progress
          </span>
        </div>

        {/* Informational Under Development Banner */}
        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-slate-50 to-rose-50/30 border border-amber-200/80 text-center sm:text-left flex flex-col sm:flex-row items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300 shadow-2xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-bold text-slate-900">
              Module Under Active Development
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Resignation workflow endpoints (<code className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-800">/api/resignations</code>)
              are currently being prepared by the backend team. Once available, employees can submit resignations, track their notice period, and receive automated relieving letters.
            </p>
          </div>
        </div>

        {/* Feature Roadmap Preview Cards */}
        <div className="mt-6">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Separation &amp; Clearance Features
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-800">Notice Period Tracking</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Automated calculation of 30/60/90 days notice, last working day confirmation, and management approval.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-800">Asset &amp; IT Clearance</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sequential sign-offs from IT (laptop, accounts), Finance (dues), and HR before exit clearance.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-800">Automated Relieving Letter</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                One-click formal Relieving &amp; Experience certificate generation with company seal and digital signature.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
