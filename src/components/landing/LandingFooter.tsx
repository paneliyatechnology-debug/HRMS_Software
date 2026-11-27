'use client';

import React from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="py-8 sm:py-10 bg-white border-t border-slate-200 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
<<<<<<< HEAD
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-0.5 shadow-2xs">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <img src="/brand-name.png" alt="myown hrms" className="h-4.5 w-auto object-contain" />
=======
          <div className="w-7 h-7 rounded-lg bg-[#1b4332] text-white flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4 text-[#d8f3dc]" />
          </div>
          <span className="font-extrabold text-slate-900">MyOwn HRMS</span>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
          <span>&bull;</span>
          <span>Enterprise Workforce Platform</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link href="/features" className="hover:text-slate-900 transition-colors">
            Core Features
          </Link>
          <Link href="/portals" className="hover:text-slate-900 transition-colors">
            Dual Portals
          </Link>
          <Link href="/how-it-works" className="hover:text-slate-900 transition-colors">
            How It Works
          </Link>
          <Link href="/faq" className="hover:text-slate-900 transition-colors">
            FAQ
          </Link>
          <Link href="/login" className="hover:text-slate-900 transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="hover:text-slate-900 transition-colors">
            Register
          </Link>
        </div>

        <div>
          <p>&copy; {new Date().getFullYear()} Paneliya Technologies. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
