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
<<<<<<< HEAD
=======
  Sparkles,
  Briefcase,
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  Shield,
  Lock,
  ChevronDown,
  Megaphone,
  CreditCard,
  Coffee,
  Check,
  UserCheck,
  CalendarDays,
<<<<<<< HEAD
  Play,
  Pause,
  Fingerprint,
  FileDown,
  CalendarCheck2,
  UserCog,
} from 'lucide-react';
import { LandingNav } from './LandingNav';
<<<<<<< HEAD
import { Tilt3D, Reveal3D, BottomCta3D } from './Motion3D';
=======
  Menu,
  X,
  Play,
  Pause,
  HelpCircle,
} from 'lucide-react';
import { LandingNav } from './LandingNav';
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
=======
import { Tilt3D, Reveal3D, BottomCta3D, LaunchWorkspaceButton } from './Motion3D';
>>>>>>> 0d10fa3b585569ce8a42ed27dde970aafc01b11f

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

<<<<<<< HEAD
=======
  // Ticking effect
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  useEffect(() => {
    if (!simulatedClockedIn || simulatedOnBreak) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [simulatedClockedIn, simulatedOnBreak]);

<<<<<<< HEAD
=======
  // Format seconds into HH:MM:SS
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);
<<<<<<< HEAD
  const [sitePlans, setSitePlans] = useState<Array<{ id: string; name: string; price: number; durationMonths: number; description?: string | null }>>([]);

  useEffect(() => {
    let active = true;
    fetch('/hrms-api/plans/public')
      .then((response) => response.json())
      .then((body) => {
        if (!active) return;
        const list = Array.isArray(body?.data) ? body.data : [];
        setSitePlans(list);
      })
      .catch(() => {
        if (active) setSitePlans([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const choosePlan = (planId: string) => {
    window.sessionStorage.setItem('hrms_pending_plan', planId);
    window.location.assign('/login');
  };
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35

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

  const portalCapabilities =
    activePortalTab === 'admin'
      ? [
          {
            icon: Users,
            title: 'Workforce Hierarchy & Departments',
            desc: 'Manage departments, designations, shifts, and assign direct reporting managers.',
          },
          {
            icon: CalendarCheck2,
            title: 'Leave Approvals & Quotas',
            desc: 'Review leave applications with 1 click; set annual quotas per leave type.',
          },
          {
            icon: Megaphone,
            title: 'Company Notice Broadcasting',
            desc: 'Publish company bulletins, personal notices, and urgent priority alerts.',
          },
          {
            icon: Clock,
            title: 'Shift Configuration & Policies',
            desc: 'Set working hours, grace periods, and monitor active punches across teams.',
          },
        ]
      : [
          {
            icon: Fingerprint,
            title: 'One-Touch Shift Console',
            desc: 'Clock in, take lunch/tea breaks, and track live worked hours every day.',
          },
          {
            icon: CalendarCheck2,
            title: 'Leave Applications & Balance',
            desc: 'Apply for time off and check remaining Casual, Sick, and Annual leaves.',
          },
          {
            icon: FileDown,
            title: 'Payslip Downloads',
            desc: 'View and download transparent monthly payslips with full salary breakdowns.',
          },
          {
            icon: UserCog,
            title: 'Personal Profile & Notice Board',
            desc: 'Upload profile photo, view company notices, and check upcoming holidays.',
          },
        ];

  return (
<<<<<<< HEAD
<<<<<<< HEAD
    <div className="min-h-screen w-full bg-white text-slate-800 selection:bg-emerald-600 selection:text-white relative overflow-x-clip font-sans">
=======
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f2f9f5] via-[#f8faf9] to-[#eef6f1] text-slate-800 selection:bg-emerald-600 selection:text-white relative overflow-x-clip font-sans">
>>>>>>> 0d10fa3b585569ce8a42ed27dde970aafc01b11f
      {/* 1. NAVIGATION */}
      <LandingNav activePage="home" onOpenLogin={onOpenLogin} />

      {/* 2. HERO SECTION WITH 3D LAYERED INTERACTIVE STAGE */}
      <section className="relative pt-8 sm:pt-14 pb-16 sm:pb-24 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_rgba(149,213,178,0.22),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(216,243,220,0.28),_transparent_55%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Headline & 3D CTAs */}
            <div className="lg:col-span-6 text-left space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]">
=======
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
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
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
<<<<<<< HEAD
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
<<<<<<< HEAD
=======
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                <Link
                  href="/register"
                  className="h-12 px-6 rounded-2xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Building2 className="w-4 h-4 text-[#d8f3dc] group-hover:scale-110 transition-transform" />
                  <span>Launch Company Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
=======
                <LaunchWorkspaceButton
                  label="Launch Company Workspace"
                  className="h-12 px-6 rounded-2xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  iconClassName="w-4 h-4 text-[#d8f3dc]"
                  trailClassName="bg-gradient-to-r from-transparent to-[#d8f3dc]"
                  leadingIcon={<Building2 className="w-4 h-4 text-[#d8f3dc] group-hover:scale-110 transition-transform" />}
                />
>>>>>>> 0d10fa3b585569ce8a42ed27dde970aafc01b11f

                <Link
                  href="/login"
                  onClick={onOpenLogin}
                  className="h-12 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-[#2d6a4f]" />
                  <span>Sign In to Portal</span>
                </Link>
              </div>

<<<<<<< HEAD
              {/* 3D Floating Highlight Pills */}
              <div className="pt-5 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-bold text-slate-700 [perspective:900px]">
                {[
                  { icon: Clock, label: 'Live Shifts' },
                  { icon: Calendar, label: 'Leave Quota' },
                  { icon: CreditCard, label: 'Payroll Slips' },
                  { icon: ShieldCheck, label: 'Role Access' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_22px_-6px_rgba(27,67,50,0.2)] hover:border-[#95d5b2] hover:-translate-y-1 transition-all duration-200 cursor-default"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Interactive 3D Workspace Stage */}
            <div className="lg:col-span-6 relative">
              <Tilt3D intensity={8} glare>
                {/* Floating 3D Z-Pop Badge 1 */}
                <div
                  style={{ transform: 'translateZ(48px)' }}
                  className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/95 border border-emerald-300 shadow-[0_16px_32px_-8px_rgba(27,67,50,0.28)] absolute -top-4 -right-2 z-20 text-[11px] font-bold text-[#1b4332] animate-float-subtle backdrop-blur-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Clock-In Verified &bull; 09:00 AM</span>
                </div>

                {/* Floating 3D Z-Pop Badge 2 */}
                <div
                  style={{ transform: 'translateZ(48px)', animationDelay: '0.8s' }}
                  className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/95 border border-[#95d5b2] shadow-[0_16px_32px_-8px_rgba(27,67,50,0.24)] absolute -bottom-4 -left-2 z-20 text-[11px] font-bold text-[#1b4332] animate-float-subtle backdrop-blur-xs"
                >
                  <Calendar className="w-4 h-4 text-[#2d6a4f]" />
                  <span>Leave Approved &bull; 2 Days Casual</span>
                </div>

                {/* Main 3D Showcase Card */}
                <div className="rounded-3xl bg-white border border-slate-200/90 shadow-[0_32px_64px_-16px_rgba(27,67,50,0.24),0_12px_28px_-8px_rgba(15,23,42,0.1)] overflow-hidden">
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
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
                      Interactive Live Demo
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-3.5 bg-white text-xs" style={{ transformStyle: 'preserve-3d' }}>
                    {/* Layered Shift Console Tile */}
                    <div
                      style={{ transform: 'translateZ(20px)' }}
                      className="p-4 rounded-2xl bg-[#f8f9fa] border border-slate-200/90 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.1)] space-y-3"
                    >
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
                          </div>
                          <p className="font-mono text-xl font-black text-slate-900 mt-0.5 tracking-tight">
                            {simulatedClockedIn ? formatTimer(timerSeconds) : '00h 00m 00s'}
                          </p>
                        </div>

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
=======
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
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                        </div>
                      </div>
                    </div>

<<<<<<< HEAD
                    {/* Layered Dual Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ transform: 'translateZ(14px)' }}>
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
                          <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100">
                            <span className="text-[9px] font-bold uppercase text-slate-500 block">Casual</span>
                            <span className="text-xs font-black text-blue-700">10 Left</span>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                            <span className="text-[9px] font-bold uppercase text-slate-500 block">Sick</span>
                            <span className="text-xs font-black text-emerald-700">7 Left</span>
                          </div>
                          <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100">
                            <span className="text-[9px] font-bold uppercase text-slate-500 block">Paid</span>
                            <span className="text-xs font-black text-purple-700">12 Left</span>
                          </div>
                        </div>
                      </div>

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
=======
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
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                      </div>
                    </div>
                  </div>
                </div>
<<<<<<< HEAD
              </Tilt3D>
=======
              </div>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
            </div>
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* 3. NEW 3D BENTO GRID CAPABILITIES */}
      <section id="features" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal3D>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 sm:mb-14">
              <div className="max-w-2xl space-y-2.5">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Essential Tools for Daily Workplace Management
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg">
                  Built to simplify workflows, eliminate spreadsheet confusion, and give employees transparent access to their records.
                </p>
              </div>
              <Link
                href="/features"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b4332] hover:text-[#2d6a4f] transition-colors shrink-0"
              >
                <span>Explore all features</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal3D>

          {/* Asymmetric 3D Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
            {/* Featured Wide 3D Card */}
            <Reveal3D className="md:col-span-7" delayMs={0}>
              <Tilt3D intensity={7} glare className="h-full">
                <div className="h-full p-7 rounded-3xl bg-gradient-to-br from-[#eef7f1] via-white to-[#d8f3dc]/45 border border-[#95d5b2]/80 hover:border-[#52b788] shadow-[0_14px_34px_-10px_rgba(27,67,50,0.12)] hover:shadow-[0_24px_48px_-14px_rgba(27,67,50,0.22)] transition-all duration-300 flex flex-col justify-between gap-6 group">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div
                        style={{ transform: 'translateZ(26px)' }}
                        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white flex items-center justify-center shadow-md shadow-emerald-900/15 group-hover:scale-105 transition-transform duration-200"
                      >
                        <Clock className="w-6 h-6 text-[#d8f3dc]" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100/90 text-[#1b4332] border border-[#95d5b2]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Real-Time Sync
                      </span>
                    </div>
                    <h3 style={{ transform: 'translateZ(16px)' }} className="text-base sm:text-lg font-bold text-slate-900">
                      Live Attendance &amp; Shift Console
                    </h3>
                    <p style={{ transform: 'translateZ(10px)' }} className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-xl">
                      Clock in/out with second-by-second accuracy, record lunch and tea breaks, and review daily attendance logs seamlessly.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-[#95d5b2]/50 text-center">
                    <div className="p-2.5 rounded-xl bg-white/85 border border-[#95d5b2]/60 shadow-2xs">
                      <span className="text-[10px] font-bold text-[#2d6a4f] uppercase block">Precision</span>
                      <span className="text-xs font-black text-[#1b4332]">1-Sec Timer</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/85 border border-[#95d5b2]/60 shadow-2xs">
                      <span className="text-[10px] font-bold text-[#2d6a4f] uppercase block">Breaks</span>
                      <span className="text-xs font-black text-[#1b4332]">Lunch &amp; Tea</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/85 border border-[#95d5b2]/60 shadow-2xs">
                      <span className="text-[10px] font-bold text-[#2d6a4f] uppercase block">Logs</span>
                      <span className="text-xs font-black text-[#1b4332]">Daily Audit</span>
                    </div>
                  </div>
                </div>
              </Tilt3D>
            </Reveal3D>

            {/* Dark Emerald Accent 3D Card */}
            <Reveal3D className="md:col-span-5" delayMs={80}>
              <Tilt3D intensity={8} glare className="h-full">
                <div className="h-full p-7 rounded-3xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white shadow-[0_20px_44px_-12px_rgba(27,67,50,0.45)] flex flex-col justify-between gap-6">
                  <div>
                    <div
                      style={{ transform: 'translateZ(26px)' }}
                      className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mb-5 backdrop-blur-xs"
                    >
                      <CreditCard className="w-6 h-6 text-[#d8f3dc]" />
                    </div>
                    <h3 style={{ transform: 'translateZ(16px)' }} className="text-base sm:text-lg font-bold">
                      Payroll &amp; Payslips
                    </h3>
                    <p style={{ transform: 'translateZ(10px)' }} className="text-xs sm:text-sm text-[#d8f3dc] mt-2 leading-relaxed">
                      Transparent monthly salary calculations with breakdowns of basic salary, allowances, PF deductions, and slip downloads.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/15 text-[11px] font-semibold text-[#d8f3dc]">
                    <span>PF, ESIC &amp; Statutory Ready</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/15 text-white font-bold">PDF Slips</span>
                  </div>
                </div>
              </Tilt3D>
            </Reveal3D>

            {/* Remaining 4 Capabilities in 3D Row */}
            {[
              {
                icon: Users,
                title: 'Employee Directory & Profiles',
                badge: 'Team Hub',
                desc: 'Centralized team repository with designations, departments, emergency contacts, profile photo uploads, and reporting managers.',
              },
              {
                icon: Calendar,
                title: 'Leave Quotas & Approvals',
                badge: '1-Click',
                desc: 'Real-time tracking of Casual, Sick, and Annual leave balances with instant manager approvals and automatic deductions.',
              },
              {
                icon: Megaphone,
                title: 'Company Notice Board',
                badge: 'Broadcast',
                desc: 'Publish company-wide announcements, department updates, or direct personal notices with priority badges (Urgent, High, Normal).',
              },
              {
                icon: CalendarDays,
                title: "Holiday Calendar & Who's On Leave",
                badge: 'Live Roster',
                desc: 'Interactive monthly calendar featuring public holidays and animated popups showing which team members are on leave.',
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Reveal3D key={feat.title} className="md:col-span-6 lg:col-span-3" delayMs={120 + idx * 60}>
                  <Tilt3D intensity={9} glare className="h-full">
                    <div className="h-full p-6 rounded-3xl bg-gradient-to-br from-emerald-50/90 via-white to-[#d8f3dc]/45 border border-emerald-200/80 hover:border-emerald-400 shadow-[0_10px_26px_-10px_rgba(27,67,50,0.12)] hover:shadow-[0_22px_42px_-12px_rgba(27,67,50,0.22)] transition-all duration-300 ease-out hover:-translate-y-1.5 group">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div
                          style={{ transform: 'translateZ(26px)' }}
                          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white flex items-center justify-center shadow-md shadow-emerald-900/15 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3"
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-100/80 text-emerald-800 border-emerald-200">
                          {feat.badge}
                        </span>
                      </div>
                      <h3 style={{ transform: 'translateZ(16px)' }} className="text-sm font-bold text-slate-900">
                        {feat.title}
                      </h3>
                      <p style={{ transform: 'translateZ(10px)' }} className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </Tilt3D>
                </Reveal3D>
=======
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
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              );
            })}
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* 4. NEW 3D DUAL-PORTAL SPLIT STAGE */}
      <section id="portals" className="py-16 sm:py-24 bg-gradient-to-b from-white via-[#f5faf7] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Portal Selector & Overview */}
            <Reveal3D className="lg:col-span-5">
              <div className="space-y-5">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Built for Leadership and Team Members
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Select a portal below to explore its specific capabilities.
                </p>

                <div className="inline-flex p-1.5 rounded-2xl bg-[#eaf5ee] border border-[#95d5b2]/80 text-xs font-bold shadow-inner gap-1">
                  <button
                    type="button"
                    onClick={() => setActivePortalTab('admin')}
                    className={`px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      activePortalTab === 'admin'
                        ? 'bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white shadow-md shadow-emerald-900/20'
                        : 'text-[#1b4332]/80 hover:text-[#1b4332] hover:bg-white/70'
                    }`}
                  >
                    Admin &amp; HR Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePortalTab('employee')}
                    className={`px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      activePortalTab === 'employee'
                        ? 'bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white shadow-md shadow-emerald-900/20'
                        : 'text-[#1b4332]/80 hover:text-[#1b4332] hover:bg-white/70'
                    }`}
                  >
                    Employee Self-Service
                  </button>
                </div>

                <Tilt3D intensity={6} glare>
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-[#eef7f1] via-white to-[#d8f3dc]/40 border border-[#95d5b2]/80 shadow-[0_16px_36px_-12px_rgba(27,67,50,0.16)] flex items-center gap-4">
                    <div
                      style={{ transform: 'translateZ(24px)' }}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-900/15"
                    >
                      {activePortalTab === 'admin' ? (
                        <Shield className="w-5 h-5 text-[#d8f3dc]" />
                      ) : (
                        <UserCheck className="w-5 h-5 text-[#d8f3dc]" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {activePortalTab === 'admin'
                          ? 'Company Administration & HR Control'
                          : 'Employee Self-Service Experience'}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {activePortalTab === 'admin'
                          ? 'Workforce oversight, approval workflows, department hierarchy, and policy configuration.'
                          : 'Autonomous attendance clocking, break timers, leave requests, and personal records.'}
                      </p>
                    </div>
                  </div>
                </Tilt3D>
              </div>
            </Reveal3D>

            {/* Right 2x2 3D Capability Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {portalCapabilities.map((cap, idx) => {
                const CapIcon = cap.icon;
                return (
                  <Reveal3D key={`${activePortalTab}-${cap.title}`} delayMs={idx * 60}>
                    <Tilt3D intensity={8} glare className="h-full">
                      <div className="group h-full p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-[#d8f3dc]/35 border border-emerald-200/80 hover:border-emerald-400 shadow-[0_8px_22px_-8px_rgba(27,67,50,0.1)] hover:shadow-[0_20px_38px_-12px_rgba(27,67,50,0.2)] flex items-start gap-3.5 transition-all duration-300 hover:-translate-y-1">
                        <div
                          style={{ transform: 'translateZ(20px)' }}
                          className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:scale-110 transition-transform duration-200"
                        >
                          <CapIcon className="w-4 h-4 text-[#d8f3dc]" />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-slate-900">{cap.title}</p>
                          <p className="text-slate-600 text-xs mt-1 leading-relaxed">{cap.desc}</p>
                        </div>
                      </div>
                    </Tilt3D>
                  </Reveal3D>
                );
              })}
            </div>
=======
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
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* 5. NEW 3D CONNECTED STEP TIMELINE */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal3D>
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Up and Running in 3 Simple Steps
              </h2>
            </div>
          </Reveal3D>

          <div className="relative max-w-5xl mx-auto">
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-11 left-16 right-16 h-0.5 bg-gradient-to-r from-[#d8f3dc] via-[#2d6a4f]/40 to-[#d8f3dc]"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  num: '01',
                  title: 'Register Company Workspace',
                  desc: 'Provide your company name, official email, and owner credentials to provision an isolated workspace.',
                },
                {
                  num: '02',
                  title: 'Set Shifts & Departments',
                  desc: 'Define your working shifts, departmental hierarchy, job titles, and annual leave quota policies.',
                },
                {
                  num: '03',
                  title: 'Add Staff & Automate',
                  desc: 'Invite team members, enable clock-ins, approve leaves with 1 click, and run zero-error monthly payroll.',
                },
              ].map((step, idx) => (
                <Reveal3D key={step.num} delayMs={idx * 90}>
                  <Tilt3D intensity={8} glare className="h-full">
                    <div className="h-full p-6 rounded-3xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] shadow-[0_10px_24px_-10px_rgba(15,23,42,0.08)] hover:shadow-[0_22px_42px_-12px_rgba(27,67,50,0.2)] transition-all duration-300 relative">
                      <span
                        style={{ transform: 'translateZ(30px)' }}
                        className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] text-white font-black text-sm flex items-center justify-center mb-5 shadow-[0_10px_20px_-6px_rgba(27,67,50,0.45)]"
                      >
                        {step.num}
                      </span>
                      <h3 style={{ transform: 'translateZ(16px)' }} className="text-sm sm:text-base font-bold text-slate-900">
                        {step.title}
                      </h3>
                      <p style={{ transform: 'translateZ(10px)' }} className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </Tilt3D>
                </Reveal3D>
              ))}
            </div>
=======
      {/* ═══════════════════════════════════════════════════════════════════════════
          8. FOOTER
      ═══════════════════════════════════════════════════════════════════════════ */}
      <footer className="py-8 sm:py-10 bg-white border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1b4332] text-white flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4 text-[#d8f3dc]" />
            </div>
            <span className="font-extrabold text-slate-900">MyOwn HRMS</span>
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
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
          </div>
        </div>
      </section>

      <section id="plans" className="py-16 sm:py-24 bg-gradient-to-b from-[#f3faf5] via-[#eef6f1] to-[#f7fbf8] border-y border-[#95d5b2]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal3D>
            <div className="text-center mb-12 space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#d8f3dc] text-[#1b4332] border border-[#95d5b2]">
                <CreditCard className="w-3.5 h-3.5 text-[#2d6a4f]" />
                <span>Flexible Workspace Pricing</span>
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Choose a Plan
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                Login first. Payment opens only after your company admin account is signed in.
              </p>
            </div>
          </Reveal3D>
          {sitePlans.length === 0 ? (
            <div className="max-w-md mx-auto p-8 rounded-3xl bg-white/90 border border-[#95d5b2]/70 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-600">Plans will show here after a super admin adds them.</p>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                sitePlans.length === 1
                  ? 'grid-cols-1 max-w-md mx-auto'
                  : sitePlans.length === 2
                    ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
                    : 'grid-cols-1 md:grid-cols-3'
              }`}
            >
              {sitePlans.map((plan, idx) => {
                const months = Number(plan.durationMonths) || 1;
                const price = Number(plan.price) || 0;
                const isHighlighted = idx === 1 || (sitePlans.length === 1 && idx === 0);
                return (
                  <Reveal3D key={plan.id} delayMs={idx * 80} className="h-full">
                    <Tilt3D intensity={8} glare className="h-full">
                      <div
                        className={`group h-full flex flex-col justify-between rounded-3xl p-6 sm:p-7 transition-all duration-300 ease-out hover:-translate-y-1.5 ${
                          isHighlighted
                            ? 'bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white border border-[#40916c]/50 shadow-[0_24px_48px_-14px_rgba(27,67,50,0.45)] hover:shadow-[0_30px_58px_-12px_rgba(27,67,50,0.6)]'
                            : 'bg-gradient-to-br from-white via-[#f9fcfa] to-[#eef7f1] text-slate-900 border border-[#95d5b2]/80 hover:border-[#2d6a4f] shadow-[0_14px_32px_-12px_rgba(27,67,50,0.14)] hover:shadow-[0_24px_48px_-12px_rgba(27,67,50,0.24)]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <h3
                              style={{ transform: 'translateZ(18px)' }}
                              className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                                isHighlighted ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {plan.name}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                                isHighlighted
                                  ? 'bg-white/15 text-[#d8f3dc] border-white/25'
                                  : 'bg-[#d8f3dc]/80 text-[#1b4332] border-[#95d5b2]'
                              }`}
                            >
                              {months} Month{months === 1 ? '' : 's'}
                            </span>
                          </div>

                          <div style={{ transform: 'translateZ(24px)' }} className="flex items-baseline gap-1.5 mt-2">
                            <span
                              className={`text-3xl sm:text-4xl font-black tracking-tight ${
                                isHighlighted ? 'text-white' : 'text-[#1b4332]'
                              }`}
                            >
                              ₹{price.toLocaleString('en-IN')}
                            </span>
                            <span className={`text-xs font-semibold ${isHighlighted ? 'text-[#d8f3dc]/80' : 'text-slate-500'}`}>
                              / {months} mo
                            </span>
                          </div>

                          <div
                            className={`mt-5 pt-4 border-t ${
                              isHighlighted ? 'border-white/15' : 'border-[#95d5b2]/50'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                  isHighlighted ? 'bg-white/15 text-[#d8f3dc]' : 'bg-[#d8f3dc] text-[#1b4332]'
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <p
                                className={`text-xs sm:text-sm leading-relaxed ${
                                  isHighlighted ? 'text-[#d8f3dc]' : 'text-slate-600'
                                }`}
                              >
                                {plan.description || 'Full workspace access for your organization'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => choosePlan(plan.id)}
                          className={`mt-7 w-full rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                            isHighlighted
                              ? 'bg-white hover:bg-[#d8f3dc] text-[#1b4332] shadow-lg'
                              : 'bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-[#2d6a4f] hover:to-[#1b4332] text-white shadow-md hover:shadow-lg'
                          }`}
                        >
                          <span>Login to purchase</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                        </button>
                      </div>
                    </Tilt3D>
                  </Reveal3D>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section id="faq" className="py-16 sm:py-24 bg-gradient-to-b from-white via-[#f5faf7] to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal3D>
            <div className="text-center mb-10 sm:mb-12 space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#d8f3dc] text-[#1b4332] border border-[#95d5b2]">
                <span>Quick Answers</span>
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Everything you need to know about setting up and using MyOwn HRMS.
              </p>
            </div>
          </Reveal3D>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <Reveal3D key={idx} delayMs={idx * 50}>
                  <div
                    className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                      isOpen
                        ? 'bg-gradient-to-br from-[#eef7f1] via-white to-[#d8f3dc]/40 border-[#52b788] shadow-[0_16px_34px_-12px_rgba(27,67,50,0.18)]'
                        : 'bg-white/95 border-slate-200/90 hover:border-[#95d5b2] hover:bg-emerald-50/20 shadow-[0_6px_18px_-8px_rgba(15,23,42,0.07)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-xl text-[11px] font-black flex items-center justify-center shrink-0 transition-colors duration-200 ${
                            isOpen
                              ? 'bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-xs'
                              : 'bg-[#d8f3dc]/80 text-[#1b4332]'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={`font-bold text-xs sm:text-sm transition-colors ${
                            isOpen ? 'text-[#1b4332]' : 'text-slate-900'
                          }`}
                        >
                          {faq.q}
                        </span>
                      </div>
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                          isOpen
                            ? 'bg-[#1b4332] text-white rotate-180'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 animate-in fade-in duration-200">
                        <div className="ml-10 pl-3.5 border-l-2 border-[#2d6a4f]/60 text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {faq.a}
                        </div>
                      </div>
                    )}
                  </div>
                </Reveal3D>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. 3D BOTTOM CTA */}
      <BottomCta3D
        title="Ready to Streamline Your Workforce Operations?"
        subtitle="Register your company workspace today or sign in to experience effortless attendance, leave approvals, and employee self-service."
        onOpenLogin={onOpenLogin}
      />

      {/* 8. FOOTER */}
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
    </div>
  );
};
