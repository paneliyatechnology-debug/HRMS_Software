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
  Shield,
  Lock,
  ChevronDown,
  Megaphone,
  CreditCard,
  Coffee,
  Check,
  UserCheck,
  CalendarDays,
  Play,
  Pause,
} from 'lucide-react';
import { LandingNav } from './LandingNav';
import { Tilt3D, Reveal3D, BottomCta3D } from './Motion3D';

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

  useEffect(() => {
    if (!simulatedClockedIn || simulatedOnBreak) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [simulatedClockedIn, simulatedOnBreak]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [sitePlans, setSitePlans] = useState<Array<{ id: string; name: string; price: number; durationMonths: number; description?: string | null }>>([]);

<<<<<<< HEAD
  // Active section state for navbar
  const [activeSection, setActiveSection] = useState<string>('features');

  const navItems = [
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'impact', label: 'Impact' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact' },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
        // Remove any #hash from the URL so it stays completely clean
        if (window.location.hash) {
          const hashId = window.location.hash.replace('#', '');
          if (navItems.some((n) => n.id === hashId)) {
            setActiveSection(hashId);
          }
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        const handleScroll = () => {
          const scrollPos = window.scrollY + 140;
          for (const item of navItems) {
            const el = document.getElementById(item.id);
            if (el) {
              const top = el.offsetTop;
              const height = el.offsetHeight;
              if (scrollPos >= top && scrollPos < top + height) {
                setActiveSection(item.id);
                break;
              }
            }
          }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
      }
    }, []);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      // Keep URL clean without #hash
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitted(true);
=======
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
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4
  };

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
            title: 'Workforce Hierarchy & Departments',
            desc: 'Manage departments, designations, shifts, and assign direct reporting managers.',
          },
          {
            title: 'Leave Approvals & Quotas',
            desc: 'Review leave applications with 1 click; set annual quotas per leave type.',
          },
          {
            title: 'Company Notice Broadcasting',
            desc: 'Publish company bulletins, personal notices, and urgent priority alerts.',
          },
          {
            title: 'Shift Configuration & Policies',
            desc: 'Set working hours, grace periods, and monitor active punches across teams.',
          },
        ]
      : [
          {
            title: 'One-Touch Shift Console',
            desc: 'Clock in, take lunch/tea breaks, and track live worked hours every day.',
          },
          {
            title: 'Leave Applications & Balance',
            desc: 'Apply for time off and check remaining Casual, Sick, and Annual leaves.',
          },
          {
            title: 'Payslip Downloads',
            desc: 'View and download transparent monthly payslips with full salary breakdowns.',
          },
          {
            title: 'Personal Profile & Notice Board',
            desc: 'Upload profile photo, view company notices, and check upcoming holidays.',
          },
        ];

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-[#f2f9f5] text-slate-800 font-sans selection:bg-[#059669] selection:text-white">
      {/* ===================================================================== */}
      {/* 1. TOP STICKY NAVBAR - LUXURY GREEN STYLE                              */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#d8ebd9] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#062d1f] to-[#059669] text-white flex items-center justify-center shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-all">
              <Building2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-[#062d1f] tracking-tight block leading-tight">
                My Own HRMS
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 uppercase tracking-wider inline-block">
                Enterprise Cloud Suite
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold uppercase tracking-wider">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${isActive
                    ? 'text-[#059669] bg-emerald-100/90 font-bold border border-emerald-300 shadow-xs'
                    : 'text-slate-600 hover:text-[#059669] hover:bg-emerald-50/70 border border-transparent'
                    }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              id="btn-nav-book-demo"
              onClick={() => {
                setDemoSubmitted(false);
                setIsDemoModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d8ebd9] bg-white hover:bg-emerald-50/80 text-[#062d1f] text-xs font-bold tracking-wide shadow-xs hover:border-emerald-300 hover:shadow-sm active:scale-98 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
              <span>Book a Demo</span>
            </button>

            <button
              id="btn-nav-login"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#035940] text-white text-xs font-bold tracking-wide shadow-md shadow-emerald-900/20 hover:shadow-lg hover:shadow-emerald-900/30 active:scale-98 transition-all cursor-pointer"
            >
              <span>Sign In / Login</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. HERO SECTION - LUXURY EMERALD HERO                                 */}
      {/* ===================================================================== */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-[#f2f9f5] to-white border-b border-[#d8ebd9]">
        {/* Soft background ambient gradient glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl pointer-events-none -z-10" />
=======
    <div className="min-h-screen w-full bg-white text-slate-800 selection:bg-emerald-600 selection:text-white relative overflow-x-clip font-sans">
      {/* 1. NAVIGATION */}
      <LandingNav activePage="home" onOpenLogin={onOpenLogin} />
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4

      {/* 2. HERO SECTION WITH 3D LAYERED INTERACTIVE STAGE */}
      <section className="relative pt-8 sm:pt-14 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<<<<<<< HEAD
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Column: Headline, Description & CTAs */}
            <div className="lg:col-span-7 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold mb-6 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                <span>Next-Gen Workforce Operating System</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#062d1f] tracking-tight leading-[1.14]">
                Build a Better Workplace with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#059669] to-[#0b3b29]">
                  Intelligent HR
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#4e6a5d] font-normal mt-6 leading-relaxed max-w-xl">
                Eliminate spreadsheets and fragmented tools. Experience unified biometric attendance,
                instant automated payroll, leave cycles, recruitment ATS, and real-time staff collaboration in
                one high-powered, intuitive workspace.
=======
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Headline & 3D CTAs */}
            <div className="lg:col-span-6 text-left space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]">
                All Your HR Operations in{' '}
                <span className="text-[#2d6a4f] inline-block hover:scale-[1.01] transition-transform">
                  One Unified Platform.
                </span>
              </h1>

              <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium leading-relaxed max-w-xl">
                Track live attendance and break sessions, manage leave quotas and approvals, generate monthly payroll
                slips, and broadcast company notices — all within a fast, high-performance workspace.
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4
              </p>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Link
                  href="/register"
                  className="h-12 px-6 rounded-2xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Building2 className="w-4 h-4 text-[#d8f3dc] group-hover:scale-110 transition-transform" />
                  <span>Launch Company Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

<<<<<<< HEAD
                <button
                  id="btn-hero-sign-in"
=======
                <Link
                  href="/login"
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4
                  onClick={onOpenLogin}
                  className="h-12 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
<<<<<<< HEAD
                  <span>Access Your Workspace</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2] text-[#059669]" />
                </button>
=======
                  <Lock className="w-4 h-4 text-[#2d6a4f]" />
                  <span>Sign In to Portal</span>
                </Link>
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4
              </div>

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

<<<<<<< HEAD
            {/* Right Column: Luxury UI Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">

                {/* Main Showcase Panel */}
                <div className="relative rounded-3xl bg-white border border-[#d8ebd9] shadow-2xl p-5 ring-1 ring-emerald-950/5">

                  {/* Clean Window Header Bar */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#d8ebd9]">
=======
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
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4
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
                        </div>
                      </div>
                    </div>

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
                      </div>
                    </div>
                  </div>
                </div>
              </Tilt3D>
            </div>
          </div>
        </div>
      </section>

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
                <div className="h-full p-7 rounded-3xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] shadow-[0_12px_30px_-10px_rgba(15,23,42,0.08)] hover:shadow-[0_24px_48px_-14px_rgba(27,67,50,0.2)] transition-all duration-300 flex flex-col justify-between gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div
                        style={{ transform: 'translateZ(26px)' }}
                        className="w-12 h-12 rounded-2xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex items-center justify-center shadow-sm"
                      >
                        <Clock className="w-6 h-6 text-[#2d6a4f]" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white text-[#1b4332] border border-slate-200">
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
                  <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-200/80 text-center">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Precision</span>
                      <span className="text-xs font-black text-[#1b4332]">1-Sec Timer</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Breaks</span>
                      <span className="text-xs font-black text-[#1b4332]">Lunch &amp; Tea</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Logs</span>
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

<<<<<<< HEAD
                {/* Floating Badge 2: Bottom Left */}
                <div className="hidden sm:flex absolute -bottom-5 -left-5 items-center gap-3 px-4 py-3 rounded-2xl bg-[#062d1f] text-white border border-emerald-800 shadow-xl">
                  <div className="w-8 h-8 rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-white leading-tight">₹42,50,000</p>
                    <p className="text-[10px] font-medium text-emerald-300 uppercase">Auto-Processed</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. TICKER BANNER - LUXURY ENTERPRISE PARTNERS                         */}
      {/* ===================================================================== */}
      <section className="py-5 bg-white border-b border-[#d8ebd9] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 font-bold text-xs uppercase tracking-widest text-slate-600">
          <span className="flex items-center gap-2 text-[#062d1f]">
            <Star className="w-4 h-4 text-[#059669] fill-emerald-500" /> TRUSTED BY 500+ ENTERPRISES
          </span>
          <span className="hidden md:inline text-slate-300">|</span>
          <span className="bg-[#f8fcfa] px-3.5 py-1.5 rounded-full border border-[#d8ebd9] text-slate-700">
            APEX GLOBAL
          </span>
          <span className="bg-[#f8fcfa] px-3.5 py-1.5 rounded-full border border-[#d8ebd9] text-slate-700">
            NOVASOFT
          </span>
          <span className="bg-[#f8fcfa] px-3.5 py-1.5 rounded-full border border-[#d8ebd9] text-slate-700">
            PULSE HR
          </span>
          <span className="bg-[#f8fcfa] px-3.5 py-1.5 rounded-full border border-[#d8ebd9] text-slate-700">
            TECHCORP INC
          </span>
          <span className="bg-[#f8fcfa] px-3.5 py-1.5 rounded-full border border-[#d8ebd9] text-slate-700">
            ELEVATE INFRA
          </span>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. FEATURES SECTION - LUXURY GREEN CARDS (6 CARDS)                    */}
      {/* ===================================================================== */}
      <section id="features" className="py-24 bg-[#f8fcfa] border-b border-[#d8ebd9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#059669] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#062d1f] tracking-tight mt-4">
              Everything You Need in One Place
            </h2>
            <p className="text-base font-normal text-[#4e6a5d] mt-4 leading-relaxed">
              Every department, rule, and workflow connects seamlessly. Say goodbye to manual exports,
              disconnected biometric devices, and out-of-sync personnel files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">

            {/* Feature Card 1: Directory */}
            <div className="rounded-3xl bg-white border border-[#d8ebd9] shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 p-8 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center group-hover:bg-[#059669] group-hover:text-white transition-all shadow-xs">
                    <Users className="w-7 h-7 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
                    ALL-IN-ONE
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#062d1f] mt-6">Workforce Directory</h3>
                <p className="text-sm font-normal text-slate-600 mt-2 leading-relaxed">
                  Centralized employee records, personal KYC documents, reporting hierarchy, departmental structures,
                  and role permissions with full audit history.
                </p>
              </div>
              <ul className="mt-6 pt-5 border-t border-[#d8ebd9] space-y-2.5 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Complete employee timeline &amp; documents</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Multi-branch departmental hierarchy</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 2: Attendance */}
            <div className="rounded-3xl bg-white border border-[#d8ebd9] shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 p-8 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center group-hover:bg-[#059669] group-hover:text-white transition-all shadow-xs">
                    <Clock className="w-7 h-7 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
                    LIVE SYNC
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#062d1f] mt-6">Biometric &amp; Geofence Attendance</h3>
                <p className="text-sm font-normal text-slate-600 mt-2 leading-relaxed">
                  Live biometric clock in/out sync, mobile punches with GPS verification, late coming penalties,
                  overtime tracking, and seamless attendance regularization.
                </p>
              </div>
              <ul className="mt-6 pt-5 border-t border-[#d8ebd9] space-y-2.5 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Real-time biometric machine integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Overtime &amp; shift auto-calculation</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 3: Payroll */}
            <div className="rounded-3xl bg-white border border-[#d8ebd9] shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 p-8 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center group-hover:bg-[#059669] group-hover:text-white transition-all shadow-xs">
                    <DollarSign className="w-7 h-7 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
                    2-MIN RUN
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#062d1f] mt-6">Automated 1-Click Payroll</h3>
                <p className="text-sm font-normal text-slate-600 mt-2 leading-relaxed">
                  Run salary disbursements in under 2 minutes. Automatic statutory computations (PF, ESI, TDS, PT),
                  allowances, deductions, bonuses, and professional PDF payslips.
                </p>
              </div>
              <ul className="mt-6 pt-5 border-t border-[#d8ebd9] space-y-2.5 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Instant salary register &amp; bank format</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Downloadable encrypted employee payslips</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 4: Leave & Shifts */}
            <div className="rounded-3xl bg-white border border-[#d8ebd9] shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 p-8 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center group-hover:bg-[#059669] group-hover:text-white transition-all shadow-xs">
                    <Calendar className="w-7 h-7 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
                    WORKFLOW
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#062d1f] mt-6">Leave &amp; Shift Approvals</h3>
                <p className="text-sm font-normal text-slate-600 mt-2 leading-relaxed">
                  Customizable leave policies (Casual, Sick, Paid, Maternity), multi-level manager approval workflows,
                  holiday calendars, and automatic balance accruals.
                </p>
              </div>
              <ul className="mt-6 pt-5 border-t border-[#d8ebd9] space-y-2.5 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Multi-tier manager approval chains</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Real-time team availability calendar</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 5: ATS Recruitment */}
            <div className="rounded-3xl bg-white border border-[#d8ebd9] shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 p-8 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center group-hover:bg-[#059669] group-hover:text-white transition-all shadow-xs">
                    <Briefcase className="w-7 h-7 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
                    KANBAN
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#062d1f] mt-6">ATS Recruitment &amp; Onboarding</h3>
                <p className="text-sm font-normal text-slate-600 mt-2 leading-relaxed">
                  Post job openings, track applicants across Kanban stages (Screening, Interview, Offer), schedule
                  interviews, and convert hired candidates into active employees with 1 click.
                </p>
              </div>
              <ul className="mt-6 pt-5 border-t border-[#d8ebd9] space-y-2.5 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Visual candidate pipeline Kanban</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>1-Click candidate to employee conversion</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 6: Assets */}
            <div className="rounded-3xl bg-white border border-[#d8ebd9] shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 p-8 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center group-hover:bg-[#059669] group-hover:text-white transition-all shadow-xs">
                    <Laptop className="w-7 h-7 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
                    ZERO LOSS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#062d1f] mt-6">Hardware &amp; Asset Management</h3>
                <p className="text-sm font-normal text-slate-600 mt-2 leading-relaxed">
                  Track laptops, accessories, monitors, and company equipment assigned to team members. Monitor serial
                  numbers, repair warranties, and exit return checklists.
                </p>
              </div>
              <ul className="mt-6 pt-5 border-t border-[#d8ebd9] space-y-2.5 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Serialized hardware allocation receipts</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Automated offboarding asset returns</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. IMPACT & GLOBAL SCALE SECTION - LUXURY DARK FOREST EMERALD         */}
      {/* ===================================================================== */}
      <section id="impact" className="py-24 bg-gradient-to-br from-[#062d1f] via-[#093524] to-[#041d14] text-white border-b border-emerald-900/60 relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-white/10 px-3 py-1 rounded-full border border-emerald-400/20">
              Verified Metrics
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mt-4">
              Proven Impact by the Numbers
            </h2>
            <p className="text-base font-normal text-emerald-100/80 mt-4 leading-relaxed">
              We empower high-performing companies worldwide to streamline HR workflows, guarantee biometric
              attendance accuracy, and run zero-error payroll cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-6xl mx-auto">
            <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-emerald-500/20 text-center hover:bg-white/10 hover:border-emerald-400/40 transition-all">
              <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">50,000+</div>
              <p className="text-sm font-bold uppercase mt-2 text-emerald-300">Active Employees</p>
              <p className="text-xs text-emerald-200/70 mt-1">Across 12+ industry sectors</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-emerald-500/20 text-center hover:bg-white/10 hover:border-emerald-400/40 transition-all">
              <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">99.9%</div>
              <p className="text-sm font-bold uppercase mt-2 text-emerald-300">Biometric Uptime</p>
              <p className="text-xs text-emerald-200/70 mt-1">Instant continuous punch sync</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-emerald-500/20 text-center hover:bg-white/10 hover:border-emerald-400/40 transition-all">
              <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">&lt; 2 Mins</div>
              <p className="text-sm font-bold uppercase mt-2 text-emerald-300">Payroll Run Time</p>
              <p className="text-xs text-emerald-200/70 mt-1">Attendance to bank payout file</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-emerald-500/20 text-center hover:bg-white/10 hover:border-emerald-400/40 transition-all">
              <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">4.9 / 5</div>
              <p className="text-sm font-bold uppercase mt-2 text-emerald-300">HR Rating</p>
              <p className="text-xs text-emerald-200/70 mt-1">Reviewed by 500+ managers</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. "GET STARTED IN 3 SIMPLE STEPS" SECTION                            */}
      {/* ===================================================================== */}
      <section id="how-it-works" className="py-24 bg-white border-b border-[#d8ebd9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#059669] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Effortless Onboarding
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#062d1f] tracking-tight mt-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-base font-normal text-slate-600 mt-4 leading-relaxed">
              Modernizing your HR operations takes less than 15 minutes. No complex hardware installs or steep learning curves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-[#f8fcfa] border border-[#d8ebd9] shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#062d1f] to-[#059669] text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-emerald-950/20">
                01
              </div>
              <h3 className="text-xl font-bold text-[#062d1f] mt-6">Setup Your Organization</h3>
              <p className="text-sm font-normal text-slate-600 mt-2 leading-relaxed">
                Add your company details, branch offices, and departments. Import your entire employee directory with 1-click Excel/CSV upload.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-[#f8fcfa] border border-[#d8ebd9] shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#062d1f] to-[#059669] text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-emerald-950/20">
                02
              </div>
              <h3 className="text-xl font-bold text-[#062d1f] mt-6">Connect Biometrics &amp; Shifts</h3>
              <p className="text-sm font-normal text-slate-600 mt-2 leading-relaxed">
                Plug in your biometric attendance machines or enable GPS-geofenced mobile check-ins. Assign custom shift rosters and leave allowances.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-[#f8fcfa] border border-[#d8ebd9] shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#062d1f] to-[#059669] text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-emerald-950/20">
                03
              </div>
              <h3 className="text-xl font-bold text-[#062d1f] mt-6">Automate Payroll &amp; Relax</h3>
              <p className="text-sm font-normal text-slate-600 mt-2 leading-relaxed">
                Attendance and overtime sync into payroll automatically. Generate payslips with compliant statutory deductions in under 2 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. TESTIMONIALS SECTION - REFINED LUXURY REVIEWS                      */}
      {/* ===================================================================== */}
      <section id="testimonials" className="py-24 bg-[#f2f9f5] border-b border-[#d8ebd9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#059669] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Client Feedback
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#062d1f] tracking-tight mt-4">
              Loved by HR Leaders Everywhere
            </h2>
            <p className="text-base font-normal text-slate-600 mt-4 leading-relaxed">
              Discover how enterprise leaders replaced messy spreadsheets and saved hundreds of operational hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Testimonial 1 */}
            <div className="p-8 rounded-3xl bg-white border border-[#d8ebd9] shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                  &ldquo;My Own HRMS completely transformed our end-of-month stress. Biometric attendance calculations
                  that used to take 3 days of manual reconciliation are now done in under 5 minutes.&rdquo;
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3 pt-5 border-t border-[#d8ebd9]">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-[#062d1f] font-bold text-xs flex items-center justify-center border border-emerald-200/80">
                  RC
                </div>
                <div>
                  <p className="text-sm font-bold text-[#062d1f]">Rohan Contractor</p>
                  <p className="text-xs text-slate-500">Head of People &amp; Culture, Apex Tech</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-8 rounded-3xl bg-white border border-[#d8ebd9] shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                  &ldquo;The employee self-service portal and instant mobile check-ins are loved by our 200+ field
                  engineers. Managing leave approvals and shifts is now a breeze.&rdquo;
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3 pt-5 border-t border-[#d8ebd9]">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-[#062d1f] font-bold text-xs flex items-center justify-center border border-emerald-200/80">
                  PN
                </div>
                <div>
                  <p className="text-sm font-bold text-[#062d1f]">Pooja Naik</p>
                  <p className="text-xs text-slate-500">HR Operations Director, Nova Logistics</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-8 rounded-3xl bg-white border border-[#d8ebd9] shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                  &ldquo;The multi-tenant governance allows us to manage three separate group entities from one
                  central screen without mixing data. Super fast and reliable.&rdquo;
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3 pt-5 border-t border-[#d8ebd9]">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-[#062d1f] font-bold text-xs flex items-center justify-center border border-emerald-200/80">
                  MK
                </div>
                <div>
                  <p className="text-sm font-bold text-[#062d1f]">Manish Khandelwal</p>
                  <p className="text-xs text-slate-500">Chief Operating Officer, Synthetix Corp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ===================================================================== */}
      {/* 9. FAQ ACCORDION SECTION - CLEAN MODERN ACCORDION                     */}
      {/* ===================================================================== */}
      <section id="faq" className="py-24 bg-[#f2f9f5] border-b border-[#d8ebd9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#059669] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Clear Answers
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#062d1f] tracking-tight mt-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-[#d8ebd9] overflow-hidden shadow-xs bg-white transition-all hover:border-emerald-300"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className={`w-full p-5 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${isOpen ? 'bg-emerald-50/80 text-[#062d1f]' : 'bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                  >
                    <span className="text-sm font-bold">{item.q}</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#062d1f] flex items-center justify-center shrink-0">
                      <ChevronDown
                        className={`w-4 h-4 stroke-[2.5] transition-transform ${isOpen ? 'rotate-180 text-[#059669]' : 'text-slate-600'
                          }`}
                      />
=======
            {/* Remaining 4 Capabilities in 3D Row */}
            {[
              {
                icon: Users,
                title: 'Employee Directory & Profiles',
                desc: 'Centralized team repository with designations, departments, emergency contacts, profile photo uploads, and reporting managers.',
              },
              {
                icon: Calendar,
                title: 'Leave Quotas & Approvals',
                desc: 'Real-time tracking of Casual, Sick, and Annual leave balances with instant manager approvals and automatic deductions.',
              },
              {
                icon: Megaphone,
                title: 'Company Notice Board',
                desc: 'Publish company-wide announcements, department updates, or direct personal notices with priority badges (Urgent, High, Normal).',
              },
              {
                icon: CalendarDays,
                title: "Holiday Calendar & Who's On Leave",
                desc: 'Interactive monthly calendar featuring public holidays and animated popups showing which team members are on leave.',
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Reveal3D key={feat.title} className="md:col-span-6 lg:col-span-3" delayMs={120 + idx * 60}>
                  <Tilt3D intensity={9} glare className="h-full">
                    <div className="h-full p-6 rounded-3xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] hover:bg-emerald-50/25 shadow-[0_8px_22px_-8px_rgba(15,23,42,0.07)] hover:shadow-[0_20px_38px_-12px_rgba(27,67,50,0.18)] transition-all duration-300 group">
                      <div
                        style={{ transform: 'translateZ(26px)' }}
                        className="w-11 h-11 rounded-xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex items-center justify-center mb-4 shadow-xs group-hover:scale-110 transition-transform"
                      >
                        <Icon className="w-5 h-5 text-[#2d6a4f]" />
                      </div>
                      <h3 style={{ transform: 'translateZ(16px)' }} className="text-sm font-bold text-slate-900">
                        {feat.title}
                      </h3>
                      <p style={{ transform: 'translateZ(10px)' }} className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {feat.desc}
                      </p>
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4
                    </div>
                  </Tilt3D>
                </Reveal3D>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. NEW 3D DUAL-PORTAL SPLIT STAGE */}
      <section id="portals" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<<<<<<< HEAD
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Left Info Column */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#059669] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Get In Touch
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#062d1f] tracking-tight mt-4">
                Have Questions? We&apos;re Here to Help
              </h2>
              <p className="text-sm font-normal text-slate-600 mt-3 leading-relaxed">
                Connect with our implementation specialists for custom enterprise quotes, hardware compatibility questions, or partner inquiries.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#f8fcfa] border border-[#d8ebd9] shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0 border border-emerald-200/70">
                    <Phone className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Phone &amp; WhatsApp Support</p>
                    <p className="text-sm font-extrabold text-[#062d1f] mt-0.5">+91 98765 43210</p>
                    <p className="text-[11px] text-slate-500">Mon - Sat, 9:00 AM - 7:00 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#f8fcfa] border border-[#d8ebd9] shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0 border border-emerald-200/70">
                    <Mail className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Email Inquiries</p>
                    <p className="text-sm font-extrabold text-[#062d1f] mt-0.5">contact@myownhrms.com</p>
                    <p className="text-[11px] text-slate-500">Response guaranteed within 2 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#f8fcfa] border border-[#d8ebd9] shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0 border border-emerald-200/70">
                    <MapPin className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Corporate Headquarters</p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Paneliya Technology Tech Park, Ring Road, Surat, Gujarat - 395002, India
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Message Form */}
            <div className="bg-white p-8 rounded-3xl border border-[#d8ebd9] shadow-xl">
              <h3 className="text-xl font-bold text-[#062d1f]">Send Us a Direct Message</h3>
              <p className="text-xs text-slate-500 mt-1">Our executive engineering team will reply promptly.</p>

              {contactSubmitted ? (
                <div className="mt-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#062d1f] text-center shadow-xs">
                  <CheckCircle2 className="w-12 h-12 text-[#059669] mx-auto mb-2 stroke-[2]" />
                  <p className="font-bold text-base">Thank You for Reaching Out!</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Your inquiry has been received. Our solutions manager will connect with you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactData.name}
                        onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                        placeholder="e.g. Rajesh Kumar"
                        className="w-full h-11 px-3.5 rounded-xl border border-[#d8ebd9] text-xs font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        value={contactData.email}
                        onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                        placeholder="rajesh@example.com"
                        className="w-full h-11 px-3.5 rounded-xl border border-[#d8ebd9] text-xs font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={contactData.phone}
                        onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                        placeholder="+91 98765 00000"
                        className="w-full h-11 px-3.5 rounded-xl border border-[#d8ebd9] text-xs font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                      <select
                        value={contactData.subject}
                        onChange={(e) => setContactData({ ...contactData, subject: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#d8ebd9] text-xs font-semibold bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-700"
                      >
                        <option>General Inquiry</option>
                        <option>Enterprise Licensing</option>
                        <option>Biometric Hardware Setup</option>
                        <option>Custom ERP Integrations</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
                    <textarea
                      rows={3}
                      required
                      value={contactData.message}
                      onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                      placeholder="Tell us about your organization size, current biometric machines, or custom needs..."
                      className="w-full p-3.5 rounded-xl border border-[#d8ebd9] text-xs font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 focus:bg-white transition-all"
                    />
                  </div>
=======
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
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4

                <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 text-xs font-bold shadow-inner">
                  <button
                    type="button"
                    onClick={() => setActivePortalTab('admin')}
                    className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      activePortalTab === 'admin'
                        ? 'bg-white text-[#1b4332] shadow-sm'
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
                        ? 'bg-white text-[#1b4332] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Employee Self-Service
                  </button>
                </div>

                <Tilt3D intensity={6} glare>
                  <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_16px_36px_-12px_rgba(27,67,50,0.14)] flex items-center gap-4">
                    <div
                      style={{ transform: 'translateZ(24px)' }}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        activePortalTab === 'admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-[#d8f3dc] text-[#1b4332] border-[#95d5b2]'
                      }`}
                    >
                      {activePortalTab === 'admin' ? (
                        <Shield className="w-5 h-5" />
                      ) : (
                        <UserCheck className="w-5 h-5 text-[#2d6a4f]" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {activePortalTab === 'admin'
                          ? 'Company Administration & HR Control'
                          : 'Employee Self-Service Experience'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
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
              {portalCapabilities.map((cap, idx) => (
                <Reveal3D key={`${activePortalTab}-${cap.title}`} delayMs={idx * 60}>
                  <Tilt3D intensity={8} glare className="h-full">
                    <div className="h-full p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-[#95d5b2] shadow-[0_8px_20px_-8px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_36px_-12px_rgba(27,67,50,0.18)] flex items-start gap-3 transition-all">
                      <div
                        style={{ transform: 'translateZ(20px)' }}
                        className="w-7 h-7 rounded-lg bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center shrink-0 mt-0.5"
                      >
                        <Check className="w-4 h-4 text-[#2d6a4f]" />
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-slate-900">{cap.title}</p>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">{cap.desc}</p>
                      </div>
                    </div>
                  </Tilt3D>
                </Reveal3D>
              ))}
            </div>
          </div>
        </div>
      </section>

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

<<<<<<< HEAD
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Ready to Build a Better Workplace?
          </h2>
          <p className="text-emerald-100/80 font-normal text-base max-w-xl mx-auto mt-4 leading-relaxed">
            Join thousands of employees and administrators using My Own HRMS daily for effortless operations.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                setDemoSubmitted(false);
                setIsDemoModalOpen(true);
              }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#035940] text-white font-bold text-sm shadow-xl shadow-emerald-950/40 active:scale-98 transition-all cursor-pointer"
            >
              Book a Free Live Demo
            </button>
            <button
              onClick={onOpenLogin}
              className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-emerald-400/30 backdrop-blur-md font-bold text-sm active:scale-98 transition-all cursor-pointer"
            >
              Sign In to Your Workspace →
            </button>
=======
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
          </div>
        </div>
      </section>

      <section id="plans" className="py-16 sm:py-24 bg-[#f8f9fa]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Choose a plan</h2>
            <p className="text-sm text-slate-500">Login first. Payment opens only after your company admin account is signed in.</p>
          </div>
          {sitePlans.length === 0 ? (
            <p className="text-center text-sm text-slate-500">Plans will show here after a super admin adds them.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sitePlans.map((plan) => {
                const months = Number(plan.durationMonths) || 1;
                const price = Number(plan.price) || 0;
                return (
                  <div key={plan.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <p className="mt-3 text-3xl font-bold text-slate-900">₹{price.toLocaleString('en-IN')}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{months} month{months === 1 ? '' : 's'}</p>
                    <p className="mt-3 flex-1 text-sm text-slate-600">{plan.description || 'Company plan'}</p>
                    <button
                      type="button"
                      onClick={() => choosePlan(plan.id)}
                      className="mt-6 w-full rounded-xl bg-[#1b4332] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2d6a4f]"
                    >
                      Login to purchase
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section id="faq" className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal3D>
            <div className="text-center mb-10 sm:mb-12 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>
          </Reveal3D>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <Reveal3D key={idx} delayMs={idx * 50}>
                  <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-[0_6px_18px_-8px_rgba(15,23,42,0.08)] hover:border-[#95d5b2] transition-all">
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
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4
          </div>

<<<<<<< HEAD
      {/* ===================================================================== */}
      {/* 12. ENTERPRISE FOOTER                                                 */}
      {/* ===================================================================== */}
      <footer className="py-14 bg-[#062d1f] text-white text-xs border-t border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#059669] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-950/30">
                <Building2 className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <p className="font-extrabold text-white text-sm">My Own HRMS</p>
                <p className="text-[11px] text-emerald-200/70">Next-Gen Enterprise Workforce Operating Cloud</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-semibold uppercase tracking-wider text-xs text-emerald-200/80">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={'#' + item.id}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {item.label}
                </a>
              ))}
              <Link href="/login" onClick={onOpenLogin} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg font-bold shadow-xs transition-colors cursor-pointer">
                Portal Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer >

      {/* ===================================================================== */}
      {/* 13. INTERACTIVE "BOOK A DEMO" MODAL - LUXURY EMERALD                  */}
      {/* ===================================================================== */}
      {
        isDemoModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#d8ebd9] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              {/* Close Button */}
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>

              {demoSubmitted ? (
                <div className="py-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle2 className="w-8 h-8 stroke-[2]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#062d1f]">Demo Scheduled Successfully!</h3>
                  <p className="text-xs font-normal text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                    Thank you, <span className="font-bold text-[#062d1f]">{demoData.name}</span>.
                    Our HRMS solutions architect will reach out to you at{' '}
                    <span className="font-bold text-[#062d1f]">{demoData.email}</span> with calendar invitations
                    and live walkthrough credentials.
                  </p>
                  <button
                    onClick={() => setIsDemoModalOpen(false)}
                    className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#035940] text-white font-bold text-xs shadow-md shadow-emerald-900/20 active:scale-98 transition-all cursor-pointer"
                  >
                    Close &amp; Continue Browsing
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 stroke-[2]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#062d1f]">Book a Live 1-on-1 Demo</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-6">
                    See how My Own HRMS automates your exact company attendance rules and payroll structure.
                  </p>

                  <form onSubmit={handleDemoSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={demoData.name}
                          onChange={(e) => setDemoData({ ...demoData, name: e.target.value })}
                          placeholder="e.g. Rajesh Kumar"
                          className="w-full h-11 px-3.5 rounded-xl border border-[#d8ebd9] text-xs font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Work Email *</label>
                        <input
                          type="email"
                          required
                          value={demoData.email}
                          onChange={(e) => setDemoData({ ...demoData, email: e.target.value })}
                          placeholder="name@company.com"
                          className="w-full h-11 px-3.5 rounded-xl border border-[#d8ebd9] text-xs font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                        <input
                          type="text"
                          required
                          value={demoData.company}
                          onChange={(e) => setDemoData({ ...demoData, company: e.target.value })}
                          placeholder="e.g. Paneliya Tech Inc."
                          className="w-full h-11 px-3.5 rounded-xl border border-[#d8ebd9] text-xs font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={demoData.phone}
                          onChange={(e) => setDemoData({ ...demoData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full h-11 px-3.5 rounded-xl border border-[#d8ebd9] text-xs font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Team Size</label>
                        <select
                          value={demoData.teamSize}
                          onChange={(e) => setDemoData({ ...demoData, teamSize: e.target.value })}
                          className="w-full h-11 px-3 rounded-xl border border-[#d8ebd9] text-xs font-semibold bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-700"
                        >
                          <option>1-20 employees</option>
                          <option>21-50 employees</option>
                          <option>51-200 employees</option>
                          <option>201-500 employees</option>
                          <option>500+ employees</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time Slot</label>
                        <select
                          value={demoData.timeSlot}
                          onChange={(e) => setDemoData({ ...demoData, timeSlot: e.target.value })}
                          className="w-full h-11 px-3 rounded-xl border border-[#d8ebd9] text-xs font-semibold bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-700"
                        >
                          <option>11:00 AM - 12:00 PM</option>
                          <option>02:00 PM - 03:00 PM</option>
                          <option>04:00 PM - 05:00 PM</option>
                          <option>06:00 PM - 07:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Specific Requirements or Modules of Interest</label>
                      <textarea
                        rows={2}
                        value={demoData.notes}
                        onChange={(e) => setDemoData({ ...demoData, notes: e.target.value })}
                        placeholder="e.g. Biometric device integration, shift rosters, custom payslip taxes..."
                        className="w-full p-3 rounded-xl border border-[#d8ebd9] text-xs font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 focus:bg-white transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#035940] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-900/20 hover:shadow-lg active:scale-98 transition-all cursor-pointer"
                    >
                      Confirm &amp; Schedule Demo
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )
      }
    </div >
=======
          <div>
            <p>&copy; {new Date().getFullYear()} Paneliya Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4
  );
};
