'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, ArrowRight, Menu, X, CalendarDays } from 'lucide-react';
import { BookDemoModal } from './BookDemoModal';

interface LandingNavProps {
  activePage?: 'home' | 'features' | 'portals' | 'how-it-works' | 'faq';
  onOpenLogin?: () => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({ activePage = 'home', onOpenLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);

  const navLinks = [
    { label: 'Core Features', href: '/features', id: 'features' },
    { label: 'Dual Portals', href: '/portals', id: 'portals' },
    { label: 'How It Works', href: '/how-it-works', id: 'how-it-works' },
    { label: 'FAQ', href: '/faq', id: 'faq' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
              <Building2 className="w-5 h-5 text-[#d8f3dc]" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight block leading-tight">
                MyOwn HRMS
              </span>
              <span className="text-[10px] font-bold text-[#2d6a4f] uppercase tracking-wider block">
                Workforce Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600">
            {navLinks.map((item) => {
              const isActive = activePage === item.id;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'text-[#1b4332] bg-[#d8f3dc]/70 font-extrabold shadow-2xs'
                      : 'hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Book Demo Button */}
            <button
              type="button"
              id="btn-book-demo-nav"
              onClick={() => setIsBookDemoOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#1b4332] bg-[#d8f3dc]/65 hover:bg-[#d8f3dc] border border-[#95d5b2]/80 transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>Book Demo</span>
            </button>

            <Link
              href="/login"
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-[#2d6a4f] hover:to-[#1b4332] shadow-xs hover:shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Register Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle & Actions */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsBookDemoOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#1b4332] bg-[#d8f3dc]/80 border border-[#95d5b2] flex items-center gap-1"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>Demo</span>
            </button>

            <Link
              href="/login"
              onClick={onOpenLogin}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 border border-slate-200"
            >
              Sign In
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white/98 px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-md">
            <div className="flex flex-col space-y-1 text-xs font-bold text-slate-700">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    activePage === item.id ? 'bg-[#d8f3dc] text-[#1b4332] font-black' : 'hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsBookDemoOpen(true);
                }}
                className="w-full h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1b4332] font-bold text-xs flex items-center justify-center gap-2 border border-emerald-200 shadow-2xs transition-all cursor-pointer"
              >
                <CalendarDays className="w-4 h-4 text-[#2d6a4f]" />
                <span>Schedule Live Demo</span>
              </button>

              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-10 rounded-xl bg-[#1b4332] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Register Company Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Book Demo Modal */}
      <BookDemoModal isOpen={isBookDemoOpen} onClose={() => setIsBookDemoOpen(false)} />
    </>
  );
};
