'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Briefcase,
  Shield,
  Lock,
  ChevronDown,
  Megaphone,
  CreditCard,
  Coffee,
  Check,
  UserCheck,
  CalendarDays,
  Menu,
  X,
  Play,
  Pause,
  HelpCircle,
} from 'lucide-react';
import { LandingNav } from './LandingNav';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  // Portal Switcher Tab
  const [activePortalTab, setActivePortalTab] = useState<'admin' | 'employee'>('employee');

  // Real-time ticking shift timer inside the interactive preview
  const [simulatedClockedIn, setSimulatedClockedIn] = useState(true);
  const [simulatedOnBreak, setSimulatedOnBreak] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(16338); // 04h 32m 18s initial

  // Ticking effect
  useEffect(() => {
    if (!simulatedClockedIn || simulatedOnBreak) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [simulatedClockedIn, simulatedOnBreak]);

  // Format seconds into HH:MM:SS
  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the live attendance & shift timer work?',
      a: 'Employees can clock in with one click when starting their shift. The system maintains a real-time ticking work session with dedicated timers for lunch, tea, and official breaks, tracking exact productive hours.',
    },
    {
      q: 'Can employees view leave balances and apply directly?',
      a: 'Yes. The employee self-service portal displays real-time Casual, Sick, and Annual leave quotas. Staff can submit leave requests with specific dates and reasons, and reporting managers can approve or reject them with 1 click.',
    },
    {
      q: 'How do notices and announcements reach team members?',
      a: 'Administrators and HR managers can broadcast company-wide updates, departmental notices, or direct personal messages with priority levels (Urgent, High, Normal). Notices instantly reflect on the employee dashboard notice board.',
    },
    {
      q: 'Is multi-company data securely separated?',
      a: 'Absolutely. MyOwn HRMS implements strict tenant isolation. Every organization operates within its own private boundary with dedicated role-based access control (RBAC) across Admins, HRs, and Employees.',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] text-slate-800 selection:bg-emerald-600 selection:text-white relative overflow-x-hidden font-sans">
      {/* Dynamic Animated Ambient Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[480px] bg-gradient-to-tr from-emerald-300/15 via-teal-200/10 to-emerald-100/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />

      {/* ═══════════════════════════════════════════════════════════════════════════
          1. RESPONSIVE NAVIGATION BAR WITH BOOK DEMO MODAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <LandingNav activePage="home" onOpenLogin={onOpenLogin} />

      {/* ═══════════════════════════════════════════════════════════════════════════
          2. HERO SECTION WITH ANIMATED INTERACTIVE PREVIEW
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-8 sm:pt-14 pb-14 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Headline & CTAs */}
            <div className="lg:col-span-6 text-left space-y-5">
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.14]">
                All Your HR Operations in{' '}
                <span className="text-[#2d6a4f] inline-block hover:scale-[1.01] transition-transform">
                  One Unified Platform.
                </span>
              </h1>

              <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium leading-relaxed max-w-xl">
                Track live attendance and break sessions, manage leave quotas and approvals, generate monthly payroll
                slips, and broadcast company notices — all within a fast, high-performance workspace.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/register"
                  className="h-12 px-6 rounded-2xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Building2 className="w-4 h-4 text-[#d8f3dc] group-hover:scale-110 transition-transform" />
                  <span>Launch Company Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  onClick={onOpenLogin}
                  className="h-12 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-[#2d6a4f]" />
                  <span>Sign In to Portal</span>
                </Link>
              </div>

              {/* Highlight Cards Grid */}
              <div className="pt-5 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-[#95d5b2] transition-colors">
                  <Clock className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                  <span>Live Shifts</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-[#95d5b2] transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                  <span>Leave Quota</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-[#95d5b2] transition-colors">
                  <CreditCard className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                  <span>Payroll Slips</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-[#95d5b2] transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                  <span>Role Access</span>
                </div>
              </div>
            </div>

            {/* Right Interactive App Showcase with Floating Badges */}
            <div className="lg:col-span-6 relative">
              {/* Floating Badge 1 - Top Right */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 border border-emerald-300 shadow-md absolute -top-3 -right-2 z-20 text-[11px] font-bold text-[#1b4332] animate-float-subtle backdrop-blur-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Clock-In Verified &bull; 09:00 AM</span>
              </div>

              {/* Floating Badge 2 - Bottom Left */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 border border-[#95d5b2] shadow-md absolute -bottom-3 -left-2 z-20 text-[11px] font-bold text-[#1b4332] animate-float-subtle backdrop-blur-xs">
                <Calendar className="w-4 h-4 text-[#2d6a4f]" />
                <span>Leave Approved &bull; 2 Days Casual</span>
              </div>

              {/* Main Showcase Card Container */}
              <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                {/* Simulated Window Top Bar */}
                <div className="px-4 py-3 bg-[#f8f9fa] border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-mono text-[11px] font-semibold text-slate-600 ml-1">
                      myown.hrms // workspace
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#1b4332] bg-[#d8f3dc] border border-[#95d5b2]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" />
                    Interactive Live Demo
                  </span>
                </div>

                {/* Simulated Content Body */}
                <div className="p-4 sm:p-5 space-y-3.5 bg-white text-xs">
                  {/* Interactive Shift Console Tile */}
                  <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center font-bold shrink-0">
                          <Clock className="w-4 h-4 text-[#2d6a4f]" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">Daily Shift Console</p>
                          <p className="text-[10px] text-slate-500">General Shift (09:00 AM – 06:00 PM)</p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          simulatedOnBreak
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : simulatedClockedIn
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {simulatedOnBreak ? 'On Break' : simulatedClockedIn ? 'Active Working' : 'Not Clocked In'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Worked Time</span>
                          {simulatedClockedIn && !simulatedOnBreak && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          )}
                        </div>
                        <p className="font-mono text-xl font-black text-slate-900 mt-0.5 tracking-tight">
                          {simulatedClockedIn ? formatTimer(timerSeconds) : '00h 00m 00s'}
                        </p>
                      </div>

                      {/* Interactive Buttons (User can actually click!) */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSimulatedOnBreak(!simulatedOnBreak)}
                          disabled={!simulatedClockedIn}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                            simulatedOnBreak
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200/90'
                          }`}
                        >
                          <Coffee className="w-3.5 h-3.5" />
                          <span>{simulatedOnBreak ? 'Resume Work' : 'Take Break'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSimulatedClockedIn(!simulatedClockedIn);
                            setSimulatedOnBreak(false);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs text-white transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-xs ${
                            simulatedClockedIn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#2d6a4f] hover:bg-[#1b4332]'
                          }`}
                        >
                          {simulatedClockedIn ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Clock Out</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Clock In</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dual Grid: Leave Quota & Notice Board */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Live Leave Quota */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#2d6a4f]" />
                          <span>Leave Balances</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Available
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100 hover:border-blue-300 transition-colors">
                          <span className="text-[9px] font-bold uppercase text-slate-500 block">Casual</span>
                          <span className="text-xs font-black text-blue-700">10 Left</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 hover:border-emerald-300 transition-colors">
                          <span className="text-[9px] font-bold uppercase text-slate-500 block">Sick</span>
                          <span className="text-xs font-black text-emerald-700">7 Left</span>
                        </div>
                        <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100 hover:border-purple-300 transition-colors">
                          <span className="text-[9px] font-bold uppercase text-slate-500 block">Paid</span>
                          <span className="text-xs font-black text-purple-700">12 Left</span>
                        </div>
                      </div>
                    </div>

                    {/* Notice Board Preview */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                          <Megaphone className="w-3.5 h-3.5 text-[#2d6a4f]" />
                          <span>Notice Board</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Urgent
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-900 text-[11px] truncate">Company All-Hands Meeting</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">
                          Quarterly review &amp; roadmap discussion on Friday at 4:00 PM.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          3. REAL CORE CAPABILITIES
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Essential Tools for Daily Workplace Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              Built to simplify workflows, eliminate spreadsheet confusion, and give employees transparent access to their records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* 1. Live Attendance */}
            <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] hover:bg-emerald-50/20 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
              <div className="w-11 h-11 rounded-xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-[#2d6a4f]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#1b4332] transition-colors">
                Live Attendance &amp; Shift Console
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Clock in/out with second-by-second accuracy, record lunch and tea breaks, and review daily attendance logs seamlessly.
              </p>
            </div>

            {/* 2. Employee Directory */}
            <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] hover:bg-emerald-50/20 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
              <div className="w-11 h-11 rounded-xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-[#2d6a4f]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#1b4332] transition-colors">
                Employee Directory &amp; Profiles
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Centralized team repository with designations, departments, emergency contacts, profile photo uploads, and reporting managers.
              </p>
            </div>

            {/* 3. Leave Management */}
            <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] hover:bg-emerald-50/20 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
              <div className="w-11 h-11 rounded-xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 text-[#2d6a4f]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#1b4332] transition-colors">
                Leave Quotas &amp; Approvals
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Real-time tracking of Casual, Sick, and Annual leave balances with instant manager approvals and automatic deductions.
              </p>
            </div>

            {/* 4. Company Notice Board */}
            <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] hover:bg-emerald-50/20 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
              <div className="w-11 h-11 rounded-xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <Megaphone className="w-5 h-5 text-[#2d6a4f]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#1b4332] transition-colors">
                Company Notice Board
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Publish company-wide announcements, department updates, or direct personal notices with priority badges (Urgent, High, Normal).
              </p>
            </div>

            {/* 5. Payroll & Payslips */}
            <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] hover:bg-emerald-50/20 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
              <div className="w-11 h-11 rounded-xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5 text-[#2d6a4f]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#1b4332] transition-colors">
                Payroll &amp; Payslips
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Transparent monthly salary calculations with breakdowns of basic salary, allowances, PF deductions, and slip downloads.
              </p>
            </div>

            {/* 6. Calendar & Holidays */}
            <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] hover:bg-emerald-50/20 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
              <div className="w-11 h-11 rounded-xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-5 h-5 text-[#2d6a4f]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#1b4332] transition-colors">
                Holiday Calendar &amp; Who's On Leave
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Interactive monthly calendar featuring public holidays and animated popups showing which team members are on leave.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          4. DUAL-PORTAL ARCHITECTURE (Admin vs Employee)
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section id="portals" className="py-16 sm:py-24 bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
           
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built for Leadership and Team Members
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Select a portal below to explore its specific capabilities.
            </p>

            {/* Interactive Portal Switcher Tabs */}
            <div className="pt-2 inline-flex p-1.5 rounded-2xl bg-slate-200/80 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => setActivePortalTab('admin')}
                className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activePortalTab === 'admin'
                    ? 'bg-white text-[#1b4332] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin &amp; HR Portal
              </button>
              <button
                type="button"
                onClick={() => setActivePortalTab('employee')}
                className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activePortalTab === 'employee'
                    ? 'bg-white text-[#1b4332] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Employee Self-Service
              </button>
            </div>
          </div>

          {/* Tabbed Card Container */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 animate-in fade-in duration-300">
            {activePortalTab === 'admin' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Company Administration &amp; HR Control</h3>
                    <p className="text-xs text-slate-500">
                      Workforce oversight, approval workflows, department hierarchy, and policy configuration.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-3 hover:border-emerald-300 transition-colors">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Workforce Hierarchy &amp; Departments</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Manage departments, designations, shifts, and assign direct reporting managers.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-3 hover:border-emerald-300 transition-colors">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Leave Approvals &amp; Quotas</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Review leave applications with 1 click; set annual quotas per leave type.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-3 hover:border-emerald-300 transition-colors">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Company Notice Broadcasting</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Publish company bulletins, personal notices, and urgent priority alerts.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-3 hover:border-emerald-300 transition-colors">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Shift Configuration &amp; Policies</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Set working hours, grace periods, and monitor active punches across teams.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                  <div className="w-11 h-11 rounded-2xl bg-[#d8f3dc] text-[#1b4332] border border-[#95d5b2] flex items-center justify-center font-bold shrink-0">
                    <UserCheck className="w-5 h-5 text-[#2d6a4f]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Employee Self-Service Experience</h3>
                    <p className="text-xs text-slate-500">
                      Autonomous attendance clocking, break timers, leave requests, and personal records.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-3 hover:border-emerald-300 transition-colors">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">One-Touch Shift Console</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Clock in, take lunch/tea breaks, and track live worked hours every day.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-3 hover:border-emerald-300 transition-colors">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Leave Applications &amp; Balance</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Apply for time off and check remaining Casual, Sick, and Annual leaves.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-3 hover:border-emerald-300 transition-colors">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Payslip Downloads</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        View and download transparent monthly payslips with full salary breakdowns.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-3 hover:border-emerald-300 transition-colors">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Personal Profile &amp; Notice Board</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Upload profile photo, view company notices, and check upcoming holidays.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          5. HOW IT WORKS (3 SIMPLE STEPS)
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
           
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Up and Running in 3 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] hover:-translate-y-1 transition-all duration-200 shadow-2xs group">
              <span className="w-9 h-9 rounded-xl bg-[#d8f3dc] text-[#1b4332] font-black text-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                1
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Register Company Workspace</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Provide your company name, official email, and owner credentials to provision an isolated workspace.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] hover:-translate-y-1 transition-all duration-200 shadow-2xs group">
              <span className="w-9 h-9 rounded-xl bg-[#d8f3dc] text-[#1b4332] font-black text-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                2
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Set Shifts &amp; Departments</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Define your working shifts, departmental hierarchy, job titles, and annual leave quota policies.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] hover:-translate-y-1 transition-all duration-200 shadow-2xs group">
              <span className="w-9 h-9 rounded-xl bg-[#d8f3dc] text-[#1b4332] font-black text-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                3
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Add Staff &amp; Automate</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Invite team members, enable clock-ins, approve leaves with 1 click, and run zero-error monthly payroll.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          6. FAQ ACCORDION SECTION
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-16 sm:py-24 bg-[#f8f9fa]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 space-y-2">
          
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-slate-900 hover:text-[#2d6a4f] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#2d6a4f]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          7. BOTTOM CALL TO ACTION BANNER
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Ready to Streamline Your Workforce Operations?
          </h2>
          <p className="text-xs sm:text-sm text-[#d8f3dc] max-w-xl mx-auto leading-relaxed">
            Register your company workspace today or sign in to experience effortless attendance, leave approvals, and employee self-service.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-white hover:bg-[#d8f3dc] text-[#1b4332] font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Company Workspace</span>
              <ArrowRight className="w-4 h-4 text-[#1b4332]" />
            </Link>

            <Link
              href="/login"
              onClick={onOpenLogin}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-emerald-950/60 hover:bg-emerald-950 text-white font-bold text-xs sm:text-sm border border-emerald-400/40 shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#d8f3dc]" />
              <span>Sign In to Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          8. FOOTER
      ═══════════════════════════════════════════════════════════════════════════ */}
      <footer className="py-8 sm:py-10 bg-white border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-0.5 shadow-2xs">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <img src="/brand-name.png" alt="myown hrms" className="h-4.5 w-auto object-contain" />
            <span>&bull;</span>
            <span>Enterprise Workforce Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
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
    </div>
  );
};
