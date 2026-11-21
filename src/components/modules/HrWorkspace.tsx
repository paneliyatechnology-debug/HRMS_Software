'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const HrWorkspace: React.FC = () => {
  const { user } = useAuth();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'HR';

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">HR workspace</p>
        <h1 className="text-xl font-bold text-slate-900 mt-1">Hello, {name}</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-xl">
          This layout is only for the HR role. Menus stay closed until permissions are assigned.
        </p>
      </div>

      <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 px-6 text-center">
        <ShieldCheck className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-800">No HR permissions yet</p>
        <p className="text-xs text-slate-500 mt-1">Profile and Settings are available from the sidebar.</p>
      </div>
    </div>
  );
};
