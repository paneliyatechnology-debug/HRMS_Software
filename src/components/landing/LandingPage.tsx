'use client';

import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ChevronDown,
  X,
  MessageSquare,
  Briefcase,
  DollarSign,
  Layers,
  CheckCircle,
  TrendingUp,
  Star,
  Award,
  Zap,
  BarChart3,
  Shield,
  Laptop,
  Check,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  // Modal states
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoData, setDemoData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    teamSize: '21-50 employees',
    date: '',
    timeSlot: '11:00 AM - 12:00 PM',
    notes: '',
  });

  // Contact section state
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitted(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
    }, 4000);
  };

  const faqItems = [
    {
      q: 'What is My Own HRMS and how does it help businesses?',
      a: 'My Own HRMS is a complete enterprise cloud workforce platform that brings biometric attendance, automated payroll, employee self-service, leave workflows, ATS hiring pipelines, and asset management into one single, real-time dashboard.',
    },
    {
      q: 'Does My Own HRMS support physical biometric devices and mobile punches?',
      a: 'Yes! My Own HRMS seamlessly integrates with biometric fingerprint/facial recognition hardware gateways as well as GPS-geofenced mobile app punches with real-time sync.',
    },
    {
      q: 'How fast can our company onboard and migrate our existing data?',
      a: 'You can be fully operational in less than 15 minutes! Import your employee directory via Excel/CSV, define departments and designations, configure shifts, and invite employees.',
    },
    {
      q: 'Is payroll calculation automatic and compliant with statutory taxes?',
      a: 'Yes, payroll is generated in one click with automated Provident Fund (PF), ESI, Professional Tax, leave encashment, bonuses, and downloadable tax-compliant PDF payslips.',
    },
    {
      q: 'Does My Own HRMS support multi-company or branch entity management?',
      a: 'Absolutely. With native Multi-Tenant architecture and Super Admin governance, you can govern multiple legal entities, branch offices, and regional locations with individual access controls.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-black font-sans selection:bg-[#FFE600] selection:text-black">
      {/* ===================================================================== */}
      {/* 1. TOP STICKY NAVBAR - NEO-BRUTALIST STYLE                             */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 bg-[#FFFDF7] border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-12 h-12 rounded-xl bg-[#FFE600] border-2 border-black text-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[5px_5px_0px_0px_#000] transition-all">
              <Building2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black text-black tracking-tight block leading-tight">
                My Own HRMS
              </span>
              <span className="text-[10px] font-black text-black bg-[#00F0B5] px-1.5 py-0.2 rounded border border-black uppercase tracking-wider inline-block">
                Neo Cloud Suite
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-black uppercase tracking-wider text-black">
            <a href="#features" className="px-2.5 py-1 rounded-lg border border-transparent hover:border-black hover:bg-[#FFE600] hover:shadow-[2px_2px_0px_0px_#000] transition-all">Features</a>
            <a href="#how-it-works" className="px-2.5 py-1 rounded-lg border border-transparent hover:border-black hover:bg-[#FFE600] hover:shadow-[2px_2px_0px_0px_#000] transition-all">How It Works</a>
            <a href="#impact" className="px-2.5 py-1 rounded-lg border border-transparent hover:border-black hover:bg-[#FFE600] hover:shadow-[2px_2px_0px_0px_#000] transition-all">Impact</a>
            <a href="#pricing" className="px-2.5 py-1 rounded-lg border border-transparent hover:border-black hover:bg-[#FFE600] hover:shadow-[2px_2px_0px_0px_#000] transition-all">Pricing</a>
            <a href="#testimonials" className="px-2.5 py-1 rounded-lg border border-transparent hover:border-black hover:bg-[#FFE600] hover:shadow-[2px_2px_0px_0px_#000] transition-all">Testimonials</a>
            <a href="#faq" className="px-2.5 py-1 rounded-lg border border-transparent hover:border-black hover:bg-[#FFE600] hover:shadow-[2px_2px_0px_0px_#000] transition-all">FAQ</a>
            <a href="#contact" className="px-2.5 py-1 rounded-lg border border-transparent hover:border-black hover:bg-[#FFE600] hover:shadow-[2px_2px_0px_0px_#000] transition-all">Contact</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              id="btn-nav-book-demo"
              onClick={() => {
                setDemoSubmitted(false);
                setIsDemoModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black bg-[#00F0B5] hover:bg-[#00e0a5] text-black text-xs font-black tracking-wide shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Book a Demo</span>
            </button>

            <button
              id="btn-nav-login"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-black bg-[#FFE600] hover:bg-[#ffd700] text-black text-xs font-black tracking-wide shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <span>Sign In / Login</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. HERO SECTION - NEO-BRUTALIST VIBRANT LAYOUT                         */}
      {/* ===================================================================== */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-[#FFFDF7] border-b-[3px] border-black">
        {/* Playful background decorative shapes */}
        <div className="absolute top-12 left-10 w-24 h-24 rounded-full border-2 border-black bg-[#FFDE59]/40 -z-10 pointer-events-none" />
        <div className="absolute bottom-16 right-16 w-32 h-32 border-2 border-black bg-[#00F0B5]/30 rotate-12 -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headline, Description & CTAs */}
            <div className="lg:col-span-7 text-left">
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black tracking-tight leading-[1.12]">
                Build a Better Workplace with{' '}
                <span className="inline-block bg-[#00F0B5] text-black border-2 border-black px-3 py-1 shadow-[4px_4px_0px_0px_#000] rotate-1 mt-1 sm:mt-0">
                  Intelligent HR
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-black font-semibold mt-6 leading-relaxed max-w-xl">
                Eliminate spreadsheets and fragmented tools. Experience unified biometric attendance, 
                instant automated payroll, leave cycles, recruitment ATS, and real-time staff collaboration in 
                one high-powered, tactile workspace.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  id="btn-hero-book-demo"
                  onClick={() => {
                    setDemoSubmitted(false);
                    setIsDemoModalOpen(true);
                  }}
                  className="px-7 py-3.5 rounded-2xl bg-[#FFE600] hover:bg-[#ffd700] text-black font-black text-sm border-[3px] border-black shadow-[5px_5px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2.5 text-center cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>Book a Personalized Demo</span>
                </button>

                <button
                  id="btn-hero-sign-in"
                  onClick={onOpenLogin}
                  className="px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-black font-black text-sm border-[3px] border-black shadow-[5px_5px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
                >
                  <span>Access Your Workspace</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Micro Trust Checklist */}
              <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-black text-black">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Instant 15-min setup</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>99.9% Uptime SLA</span>
                </div>
              </div>

              {/* Quick Stat Pill Highlights */}
              <div className="mt-10 pt-8 border-t-2 border-black grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl">
                <div className="p-3 bg-[#FFE600] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000]">
                  <p className="text-2xl font-black text-black">99.9%</p>
                  <p className="text-[11px] font-black uppercase text-black">Biometric Sync</p>
                </div>
                <div className="p-3 bg-[#A388EE] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000]">
                  <p className="text-2xl font-black text-black">&lt; 2 Mins</p>
                  <p className="text-[11px] font-black uppercase text-black">Payroll Run</p>
                </div>
                <div className="p-3 bg-[#00F0B5] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000]">
                  <p className="text-2xl font-black text-black">100%</p>
                  <p className="text-[11px] font-black uppercase text-black">Compliant</p>
                </div>
                <div className="p-3 bg-[#38BDF8] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000]">
                  <p className="text-2xl font-black text-black">24/7</p>
                  <p className="text-[11px] font-black uppercase text-black">Live Support</p>
                </div>
              </div>
            </div>

            {/* Right Column: High-Impact Neo-Brutalist Visual Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Main Showcase Panel */}
                <div className="relative rounded-3xl bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_#000] p-5 overflow-hidden">
                  
                  {/* Brutalist Window Header Bar */}
                  <div className="flex items-center justify-between pb-3.5 border-b-2 border-black">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#FF6B4A] border-2 border-black" />
                      <div className="w-3.5 h-3.5 rounded-full bg-[#FFE600] border-2 border-black" />
                      <div className="w-3.5 h-3.5 rounded-full bg-[#00F0B5] border-2 border-black" />
                      <span className="ml-2 text-[11px] font-mono font-bold text-black bg-[#FAF8F5] px-2 py-0.5 rounded border border-black">
                        app.myownhrms.com/live
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-black bg-[#00F0B5] px-2.5 py-1 rounded-md border-2 border-black">
                      <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                      SYSTEM ONLINE
                    </span>
                  </div>

                  {/* Header Snapshot Block */}
                  <div className="mt-4 p-4 rounded-2xl bg-[#18181B] border-2 border-black text-white shadow-[3px_3px_0px_0px_#000]">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#FFE600]">Total Workforce Overview</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <h3 className="text-3xl font-black text-white">154 Staff Active</h3>
                      <span className="text-xs font-black text-[#00F0B5] bg-black px-2 py-1 rounded border border-[#00F0B5] flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> +12 this month
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t-2 border-white/20">
                      <div>
                        <p className="text-[10px] font-bold text-slate-300 uppercase">Today&apos;s Attendance</p>
                        <p className="text-base font-black text-white mt-0.5">96.8% (149 in)</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-300 uppercase">Payroll Cycle Status</p>
                        <p className="text-base font-black text-[#00F0B5] mt-0.5">Approved &amp; Ready</p>
                      </div>
                    </div>
                  </div>

                  {/* Realtime Employee Punch Stream Preview */}
                  <div className="mt-4 space-y-2.5">
                    <p className="text-[11px] font-black text-black uppercase tracking-wider px-1">
                      Recent Biometric Check-Ins
                    </p>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFFDF0] border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FFE600] border-2 border-black text-black font-black text-xs flex items-center justify-center">
                          AU
                        </div>
                        <div>
                          <p className="text-xs font-black text-black leading-tight">Admin User</p>
                          <p className="text-[10px] font-bold text-slate-700">Corporate HQ • Biometric Gate 1</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[#00F0B5] text-black text-[10px] font-black border-2 border-black">
                        09:02 AM • IN
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0FFF9] border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#A388EE] border-2 border-black text-black font-black text-xs flex items-center justify-center">
                          SP
                        </div>
                        <div>
                          <p className="text-xs font-black text-black leading-tight">Sanjay Patel</p>
                          <p className="text-[10px] font-bold text-slate-700">Engineering • Geofence Mobile</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[#00F0B5] text-black text-[10px] font-black border-2 border-black">
                        09:14 AM • IN
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F9FF] border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FFDE59] border-2 border-black text-black font-black text-xs flex items-center justify-center">
                          RK
                        </div>
                        <div>
                          <p className="text-xs font-black text-black leading-tight">Ravi Khunt</p>
                          <p className="text-[10px] font-bold text-slate-700">Design Team • Web Punch</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[#38BDF8] text-black text-[10px] font-black border-2 border-black">
                        09:30 AM • IN
                      </span>
                    </div>
                  </div>
                </div>

                {/* Neo-Brutalist Floating Sticker 1: Top Right */}
                <div className="hidden sm:flex absolute -top-5 -right-5 items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#FFE600] border-2 border-black shadow-[4px_4px_0px_0px_#000] rotate-3">
                  <div className="w-8 h-8 rounded-lg bg-black text-[#FFE600] flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-black leading-tight">Biometric Active</p>
                    <p className="text-[10px] font-bold text-black">99.8% Sync Success</p>
                  </div>
                </div>

                {/* Neo-Brutalist Floating Sticker 2: Bottom Left */}
                <div className="hidden sm:flex absolute -bottom-6 -left-6 items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#00F0B5] border-2 border-black shadow-[4px_4px_0px_0px_#000] -rotate-3">
                  <div className="w-8 h-8 rounded-lg bg-black text-[#00F0B5] flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-black leading-tight">₹42,50,000</p>
                    <p className="text-[10px] font-black text-black uppercase">Auto-Processed</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. NEO-BRUTALIST TICKER BANNER                                        */}
      {/* ===================================================================== */}
      <section className="py-4 bg-[#FFE600] border-b-[3px] border-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 font-black text-xs sm:text-sm uppercase tracking-widest text-black">
          <span className="flex items-center gap-2">
            <span className="text-base">★</span> TRUSTED BY 500+ ENTERPRISES
          </span>
          <span className="hidden md:inline text-black">|</span>
          <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            APEX GLOBAL
          </span>
          <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            NOVASOFT
          </span>
          <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            PULSE HR
          </span>
          <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            TECHCORP INC
          </span>
          <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            ELEVATE INFRA
          </span>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. FEATURES SECTION - COLOR BLOCKED NEO-BRUTALIST CARDS (6 CARDS)     */}
      {/* ===================================================================== */}
      <section id="features" className="py-24 bg-[#FAF8F5] border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight">
              Everything You Need in One Place
            </h2>
            <p className="text-base font-medium text-slate-700 mt-4 leading-relaxed">
              Every department, rule, and workflow connects seamlessly. Say goodbye to manual exports, 
              disconnected biometric devices, and out-of-sync personnel files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            
            {/* Feature Card 1: Directory */}
            <div className="rounded-3xl bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[10px_10px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFE600] border-2 border-black text-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                    <Users className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black text-[#FFE600] px-2.5 py-1 rounded-md">
                    ALL-IN-ONE
                  </span>
                </div>
                <h3 className="text-xl font-black text-black mt-6">Workforce Directory</h3>
                <p className="text-sm font-medium text-slate-700 mt-2 leading-relaxed">
                  Centralized employee records, personal KYC documents, reporting hierarchy, departmental structures, 
                  and role permissions with full audit history.
                </p>
              </div>
              <ul className="mt-6 pt-5 border-t-2 border-black space-y-2.5 text-xs font-bold text-black">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#00F0B5] border border-black flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  </div>
                  <span>Complete employee timeline &amp; documents</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#00F0B5] border border-black flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  </div>
                  <span>Multi-branch departmental hierarchy</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 2: Attendance */}
            <div className="rounded-3xl bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[10px_10px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[#00F0B5] border-2 border-black text-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                    <Clock className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black text-[#00F0B5] px-2.5 py-1 rounded-md">
                    LIVE SYNC
                  </span>
                </div>
                <h3 className="text-xl font-black text-black mt-6">Biometric &amp; Geofence Attendance</h3>
                <p className="text-sm font-medium text-slate-700 mt-2 leading-relaxed">
                  Live biometric clock in/out sync, mobile punches with GPS verification, late coming penalties, 
                  overtime tracking, and seamless attendance regularization.
                </p>
              </div>
              <ul className="mt-6 pt-5 border-t-2 border-black space-y-2.5 text-xs font-bold text-black">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#FFE600] border border-black flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  </div>
                  <span>Real-time biometric machine integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#FFE600] border border-black flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  </div>
                  <span>Overtime &amp; shift auto-calculation</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 3: Payroll */}
            <div className="rounded-3xl bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[10px_10px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[#FF6B4A] border-2 border-black text-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                    <DollarSign className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black text-[#FF6B4A] px-2.5 py-1 rounded-md">
                    2-MIN RUN
                  </span>
                </div>
                <h3 className="text-xl font-black text-black mt-6">Automated 1-Click Payroll</h3>
                <p className="text-sm font-medium text-slate-700 mt-2 leading-relaxed">
                  Run salary disbursements in under 2 minutes. Automatic statutory computations (PF, ESI, TDS, PT), 
                  allowances, deductions, bonuses, and professional PDF payslips.
                </p>
              </div>
              <ul className="mt-6 pt-5 border-t-2 border-black space-y-2.5 text-xs font-bold text-black">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#00F0B5] border border-black flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  </div>
                  <span>Instant salary register &amp; bank format</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#00F0B5] border border-black flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  </div>
                  <span>Downloadable encrypted employee payslips</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 4: Leave & Shifts */}
            <div className="rounded-3xl bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[10px_10px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[#A388EE] border-2 border-black text-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                    <Calendar className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black text-[#A388EE] px-2.5 py-1 rounded-md">
                    WORKFLOW
                  </span>
                </div>
                <h3 className="text-xl font-black text-black mt-6">Leave &amp; Shift Approvals</h3>
                <p className="text-sm font-medium text-slate-700 mt-2 leading-relaxed">
                  Customizable leave policies (Casual, Sick, Paid, Maternity), multi-level manager approval workflows, 
                  holiday calendars, and automatic balance accruals.
                </p>
              </div>
              <ul className="mt-6 pt-5 border-t-2 border-black space-y-2.5 text-xs font-bold text-black">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#FFDE59] border border-black flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  </div>
                  <span>Multi-tier manager approval chains</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#FFDE59] border border-black flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  </div>
                  <span>Real-time team availability calendar</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 5: ATS Recruitment */}
            <div className="rounded-3xl bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[10px_10px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[#38BDF8] border-2 border-black text-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                    <Briefcase className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black text-[#38BDF8] px-2.5 py-1 rounded-md">
                    KANBAN
                  </span>
                </div>
                <h3 className="text-xl font-black text-black mt-6">ATS Recruitment &amp; Onboarding</h3>
                <p className="text-sm font-medium text-slate-700 mt-2 leading-relaxed">
                  Post job openings, track applicants across Kanban stages (Screening, Interview, Offer), schedule 
                  interviews, and convert hired candidates into active employees with 1 click.
                </p>
              </div>
              <ul className="mt-6 pt-5 border-t-2 border-black space-y-2.5 text-xs font-bold text-black">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#00F0B5] border border-black flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  </div>
                  <span>Visual candidate pipeline Kanban</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#00F0B5] border border-black flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  </div>
                  <span>1-Click candidate to employee conversion</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 6: Assets */}
            <div className="rounded-3xl bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[10px_10px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[#FF5E97] border-2 border-black text-white flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                    <Laptop className="w-7 h-7 stroke-[2.5] text-black" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black text-[#FF5E97] px-2.5 py-1 rounded-md">
                    ZERO LOSS
                  </span>
                </div>
                <h3 className="text-xl font-black text-black mt-6">Hardware &amp; Asset Management</h3>
                <p className="text-sm font-medium text-slate-700 mt-2 leading-relaxed">
                  Track laptops, accessories, monitors, and company equipment assigned to team members. Monitor serial 
                  numbers, repair warranties, and exit return checklists.
                </p>
              </div>
              <ul className="mt-6 pt-5 border-t-2 border-black space-y-2.5 text-xs font-bold text-black">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#FFE600] border border-black flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  </div>
                  <span>Serialized hardware allocation receipts</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#FFE600] border border-black flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  </div>
                  <span>Automated offboarding asset returns</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. IMPACT & GLOBAL SCALE SECTION - HIGH CONTRAST NEO-BRUTALIST       */}
      {/* ===================================================================== */}
      <section id="impact" className="py-24 bg-[#18181B] text-white border-b-[3px] border-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Proven Impact by the Numbers
            </h2>
            <p className="text-base font-medium text-slate-300 mt-4 leading-relaxed">
              We empower high-performing companies worldwide to streamline HR workflows, guarantee biometric 
              attendance accuracy, and run zero-error payroll cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 max-w-6xl mx-auto">
            <div className="p-8 rounded-3xl bg-[#FFE600] text-black border-[3px] border-black shadow-[6px_6px_0px_0px_#FFF] text-center hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">50,000+</div>
              <p className="text-sm font-black uppercase mt-2">Active Employees</p>
              <p className="text-xs font-bold text-slate-800 mt-1">Across 12+ industry sectors</p>
            </div>

            <div className="p-8 rounded-3xl bg-[#00F0B5] text-black border-[3px] border-black shadow-[6px_6px_0px_0px_#FFF] text-center hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">99.9%</div>
              <p className="text-sm font-black uppercase mt-2">Biometric Uptime</p>
              <p className="text-xs font-bold text-slate-800 mt-1">Instant continuous punch sync</p>
            </div>

            <div className="p-8 rounded-3xl bg-[#38BDF8] text-black border-[3px] border-black shadow-[6px_6px_0px_0px_#FFF] text-center hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">&lt; 2 Mins</div>
              <p className="text-sm font-black uppercase mt-2">Payroll Run Time</p>
              <p className="text-xs font-bold text-slate-800 mt-1">Attendance to bank payout file</p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FF5E97] text-black border-[3px] border-black shadow-[6px_6px_0px_0px_#FFF] text-center hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">4.9 / 5</div>
              <p className="text-sm font-black uppercase mt-2">HR Rating</p>
              <p className="text-xs font-bold text-slate-800 mt-1">Reviewed by 500+ managers</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. "GET STARTED IN 3 SIMPLE STEPS" SECTION                            */}
      {/* ===================================================================== */}
      <section id="how-it-works" className="py-24 bg-[#FFFDF7] border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-base font-medium text-slate-700 mt-4 leading-relaxed">
              Modernizing your HR operations takes less than 15 minutes. No complex hardware installs or steep learning curves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[10px_10px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-[#FFE600] border-2 border-black text-black font-black text-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                01
              </div>
              <h3 className="text-xl font-black text-black mt-6">Setup Your Organization</h3>
              <p className="text-sm font-medium text-slate-700 mt-2 leading-relaxed">
                Add your company details, branch offices, and departments. Import your entire employee directory with 1-click Excel/CSV upload.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[10px_10px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-[#A388EE] border-2 border-black text-black font-black text-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                02
              </div>
              <h3 className="text-xl font-black text-black mt-6">Connect Biometrics &amp; Shifts</h3>
              <p className="text-sm font-medium text-slate-700 mt-2 leading-relaxed">
                Plug in your biometric attendance machines or enable GPS-geofenced mobile check-ins. Assign custom shift rosters and leave allowances.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[10px_10px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-[#00F0B5] border-2 border-black text-black font-black text-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                03
              </div>
              <h3 className="text-xl font-black text-black mt-6">Automate Payroll &amp; Relax</h3>
              <p className="text-sm font-medium text-slate-700 mt-2 leading-relaxed">
                Attendance and overtime sync into payroll automatically. Generate payslips with compliant statutory deductions in under 2 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. TESTIMONIALS SECTION - BRUTALIST WALL OF LOVE                      */}
      {/* ===================================================================== */}
      <section id="testimonials" className="py-24 bg-[#FAF8F5] border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight">
              Loved by HR Leaders Everywhere
            </h2>
            <p className="text-base font-medium text-slate-700 mt-4 leading-relaxed">
              Discover how enterprise leaders replaced messy spreadsheets and saved hundreds of operational hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Testimonial 1 */}
            <div className="p-8 rounded-3xl bg-[#FFFDF0] border-[3px] border-black shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div>
                <div className="flex items-center gap-1.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded bg-[#FFE600] border border-black flex items-center justify-center text-[10px] font-black">
                      ★
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold text-black leading-relaxed">
                  &ldquo;My Own HRMS completely transformed our end-of-month stress. Biometric attendance calculations 
                  that used to take 3 days of manual reconciliation are now done in under 5 minutes.&rdquo;
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3 pt-5 border-t-2 border-black">
                <div className="w-11 h-11 rounded-xl bg-[#FFE600] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                  RC
                </div>
                <div>
                  <p className="text-sm font-black text-black">Rohan Contractor</p>
                  <p className="text-xs font-bold text-slate-600">Head of People &amp; Culture, Apex Tech</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-8 rounded-3xl bg-[#F0FFF9] border-[3px] border-black shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div>
                <div className="flex items-center gap-1.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded bg-[#00F0B5] border border-black flex items-center justify-center text-[10px] font-black">
                      ★
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold text-black leading-relaxed">
                  &ldquo;The employee self-service portal and instant mobile check-ins are loved by our 200+ field 
                  engineers. Managing leave approvals and shifts is now a breeze.&rdquo;
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3 pt-5 border-t-2 border-black">
                <div className="w-11 h-11 rounded-xl bg-[#00F0B5] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                  PN
                </div>
                <div>
                  <p className="text-sm font-black text-black">Pooja Naik</p>
                  <p className="text-xs font-bold text-slate-600">HR Operations Director, Nova Logistics</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-8 rounded-3xl bg-[#F5F3FF] border-[3px] border-black shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div>
                <div className="flex items-center gap-1.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded bg-[#A388EE] border border-black flex items-center justify-center text-[10px] font-black">
                      ★
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold text-black leading-relaxed">
                  &ldquo;The multi-tenant governance allows us to manage three separate group entities from one 
                  central screen without mixing data. Super fast and reliable.&rdquo;
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3 pt-5 border-t-2 border-black">
                <div className="w-11 h-11 rounded-xl bg-[#A388EE] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                  MK
                </div>
                <div>
                  <p className="text-sm font-black text-black">Manish Khandelwal</p>
                  <p className="text-xs font-bold text-slate-600">Chief Operating Officer, Synthetix Corp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. PRICING PLANS SECTION - TACTILE NEO-BRUTALIST CARDS               */}
      {/* ===================================================================== */}
      <section id="pricing" className="py-24 bg-[#FFFDF7] border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight">
              Plans Scaled to Your Business Size
            </h2>
            <p className="text-base font-medium text-slate-700 mt-4 leading-relaxed">
              No hidden fees or surprise setup charges. Start small and upgrade smoothly as your organization grows.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto items-stretch">
            
            {/* Starter Plan */}
            <div className="p-8 rounded-3xl border-[3px] border-black bg-white flex flex-col justify-between shadow-[6px_6px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000] transition-all">
              <div>
                <h3 className="text-xl font-black text-black">Starter Plan</h3>
                <p className="text-xs font-bold text-slate-600 mt-1">Perfect for startups and boutique teams.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-black">₹999</span>
                  <span className="text-xs font-black text-black">/ month</span>
                </div>

                <ul className="mt-8 space-y-3.5 text-xs font-bold text-black">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
                    <span>Up to 25 Active Employees</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
                    <span>Biometric &amp; Web Punch Attendance</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
                    <span>Standard Automated Payroll &amp; Slips</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
                    <span>Leave Approval Workflow</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setDemoData((prev) => ({ ...prev, teamSize: '1-20 employees' }));
                  setIsDemoModalOpen(true);
                }}
                className="w-full mt-8 py-3.5 rounded-xl border-2 border-black bg-white hover:bg-[#FAF8F5] text-black font-black text-xs shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-center cursor-pointer"
              >
                Choose Starter
              </button>
            </div>

            {/* Growth Plan (Popular Featured) */}
            <div className="p-8 rounded-3xl border-[3px] border-black bg-[#FFE600] flex flex-col justify-between shadow-[8px_8px_0px_0px_#000] relative scale-100 lg:scale-105 z-10 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000] transition-all">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-lg bg-black text-[#FFE600] font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_#FFF] -rotate-1">
                ★ MOST POPULAR ★
              </span>

              <div>
                <h3 className="text-xl font-black text-black">Growth Plan</h3>
                <p className="text-xs font-bold text-slate-800 mt-1">For expanding teams needing complete automation.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-black">₹2,499</span>
                  <span className="text-xs font-black text-black">/ month</span>
                </div>

                <ul className="mt-8 space-y-3.5 text-xs font-bold text-black">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-black stroke-[3] shrink-0" />
                    <span>Up to 100 Active Employees</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-black stroke-[3] shrink-0" />
                    <span>Geofenced Mobile Clock In/Out</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-black stroke-[3] shrink-0" />
                    <span>Full ATS Candidate Pipeline</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-black stroke-[3] shrink-0" />
                    <span>Hardware Asset Tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-black stroke-[3] shrink-0" />
                    <span>Team Communication &amp; Broadcast</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setDemoData((prev) => ({ ...prev, teamSize: '21-50 employees' }));
                  setIsDemoModalOpen(true);
                }}
                className="w-full mt-8 py-3.5 rounded-xl bg-black hover:bg-slate-900 text-[#FFE600] font-black text-xs border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-center cursor-pointer"
              >
                Choose Growth
              </button>
            </div>

            {/* Enterprise Suite */}
            <div className="p-8 rounded-3xl border-[3px] border-black bg-[#00F0B5] flex flex-col justify-between shadow-[6px_6px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000] transition-all">
              <div>
                <h3 className="text-xl font-black text-black">Enterprise Suite</h3>
                <p className="text-xs font-bold text-slate-800 mt-1">Multi-company groups with custom SLAs.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-black">Custom</span>
                </div>

                <ul className="mt-8 space-y-3.5 text-xs font-bold text-black">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-black stroke-[3] shrink-0" />
                    <span>Unlimited Employees &amp; Sub-Entities</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-black stroke-[3] shrink-0" />
                    <span>Dedicated Multi-Tenant Super Admin</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-black stroke-[3] shrink-0" />
                    <span>Custom Biometric Hardware Integrations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-black stroke-[3] shrink-0" />
                    <span>Dedicated Account Manager &amp; 99.99% SLA</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setDemoData((prev) => ({ ...prev, teamSize: '500+ employees' }));
                  setIsDemoModalOpen(true);
                }}
                className="w-full mt-8 py-3.5 rounded-xl border-2 border-black bg-white hover:bg-slate-50 text-black font-black text-xs shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-center cursor-pointer"
              >
                Contact Enterprise
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 9. FAQ ACCORDION SECTION - NEO-BRUTALIST ACCORDION                   */}
      {/* ===================================================================== */}
      <section id="faq" className="py-24 bg-[#FAF8F5] border-b-[3px] border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border-[3px] border-black overflow-hidden shadow-[4px_4px_0px_0px_#000] bg-white transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className={`w-full p-5 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                      isOpen ? 'bg-[#FFE600]' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm font-black text-black">{item.q}</span>
                    <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
                      <ChevronDown
                        className={`w-4 h-4 stroke-[3] transition-transform ${
                          isOpen ? 'rotate-180 text-[#FFE600]' : 'text-white'
                        }`}
                      />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-3 text-xs font-medium text-slate-800 leading-relaxed bg-[#FFFDF7] border-t-2 border-black">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 10. CONTACT US SECTION - NEO-BRUTALIST FORM & DETAILS                  */}
      {/* ===================================================================== */}
      <section id="contact" className="py-24 bg-[#FFFDF7] border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Left Info Column */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
                Have Questions? We&apos;re Here to Help
              </h2>
              <p className="text-sm font-medium text-slate-700 mt-3 leading-relaxed">
                Connect with our implementation specialists for custom enterprise quotes, hardware compatibility questions, or partner inquiries.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000]">
                  <div className="w-12 h-12 rounded-xl bg-[#FFE600] border-2 border-black text-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
                    <Phone className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-black">Phone &amp; WhatsApp Support</p>
                    <p className="text-sm font-black text-black mt-0.5">+91 98765 43210</p>
                    <p className="text-[11px] font-bold text-slate-600">Mon - Sat, 9:00 AM - 7:00 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000]">
                  <div className="w-12 h-12 rounded-xl bg-[#00F0B5] border-2 border-black text-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
                    <Mail className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-black">Email Inquiries</p>
                    <p className="text-sm font-black text-black mt-0.5">contact@myownhrms.com</p>
                    <p className="text-[11px] font-bold text-slate-600">Response guaranteed within 2 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000]">
                  <div className="w-12 h-12 rounded-xl bg-[#A388EE] border-2 border-black text-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
                    <MapPin className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-black">Corporate Headquarters</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5 leading-relaxed">
                      Paneliya Technology Tech Park, Ring Road, Surat, Gujarat - 395002, India
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Message Form */}
            <div className="bg-white p-8 rounded-3xl border-[3px] border-black shadow-[8px_8px_0px_0px_#000]">
              <h3 className="text-xl font-black text-black">Send Us a Direct Message</h3>
              <p className="text-xs font-bold text-slate-600 mt-1">Our executive engineering team will reply promptly.</p>

              {contactSubmitted ? (
                <div className="mt-6 p-6 rounded-2xl bg-[#00F0B5] border-2 border-black text-black text-center shadow-[4px_4px_0px_0px_#000]">
                  <CheckCircle2 className="w-12 h-12 text-black mx-auto mb-2 stroke-[2.5]" />
                  <p className="font-black text-base">Thank You for Reaching Out!</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    Your inquiry has been received. Our solutions manager will connect with you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactData.name}
                        onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                        placeholder="Keyur Sangani"
                        className="w-full h-11 px-3.5 rounded-xl border-2 border-black text-xs font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-all bg-[#FAF8F5]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        value={contactData.email}
                        onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                        placeholder="keyur@example.com"
                        className="w-full h-11 px-3.5 rounded-xl border-2 border-black text-xs font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-all bg-[#FAF8F5]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={contactData.phone}
                        onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                        placeholder="+91 98765 00000"
                        className="w-full h-11 px-3.5 rounded-xl border-2 border-black text-xs font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-all bg-[#FAF8F5]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Subject</label>
                      <select
                        value={contactData.subject}
                        onChange={(e) => setContactData({ ...contactData, subject: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border-2 border-black text-xs font-bold bg-[#FAF8F5] focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-all"
                      >
                        <option>General Inquiry</option>
                        <option>Enterprise Licensing</option>
                        <option>Biometric Hardware Setup</option>
                        <option>Custom ERP Integrations</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black mb-1">Message</label>
                    <textarea
                      rows={3}
                      required
                      value={contactData.message}
                      onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                      placeholder="Tell us about your organization size, current biometric machines, or custom needs..."
                      className="w-full p-3.5 rounded-xl border-2 border-black text-xs font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-all bg-[#FAF8F5]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-[#00F0B5] hover:bg-[#00e0a5] text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    Submit Message
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 11. PRE-FOOTER CALL TO ACTION BANNER                                  */}
      {/* ===================================================================== */}
      <section className="py-20 bg-[#FFE600] text-black border-b-[3px] border-black relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Ready to Build a Better Workplace?
          </h2>
          <p className="text-black font-bold text-base max-w-xl mx-auto mt-4 leading-relaxed">
            Join thousands of employees and administrators using My Own HRMS daily for effortless operations.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                setDemoSubmitted(false);
                setIsDemoModalOpen(true);
              }}
              className="px-8 py-4 rounded-xl bg-white text-black font-black text-sm border-[3px] border-black shadow-[5px_5px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            >
              Book a Free Live Demo
            </button>
            <button
              onClick={onOpenLogin}
              className="px-8 py-4 rounded-xl bg-black text-[#FFE600] font-black text-sm border-[3px] border-black shadow-[5px_5px_0px_0px_#FFF] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#FFF] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            >
              Sign In to Your Workspace →
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 12. ENTERPRISE FOOTER                                                 */}
      {/* ===================================================================== */}
      <footer className="py-14 bg-white text-black text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#FFE600] border-2 border-black text-black flex items-center justify-center font-black text-xs shadow-[3px_3px_0px_0px_#000]">
                <Building2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <p className="font-black text-black text-sm">My Own HRMS</p>
                <p className="text-[11px] font-bold text-slate-600">Next-Gen Enterprise Workforce Operating Cloud</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-black uppercase tracking-wider text-xs">
              <a href="#features" className="hover:bg-[#FFE600] px-2 py-1 rounded transition-colors">Features</a>
              <a href="#how-it-works" className="hover:bg-[#FFE600] px-2 py-1 rounded transition-colors">How It Works</a>
              <a href="#impact" className="hover:bg-[#FFE600] px-2 py-1 rounded transition-colors">Impact</a>
              <a href="#pricing" className="hover:bg-[#FFE600] px-2 py-1 rounded transition-colors">Pricing</a>
              <a href="#testimonials" className="hover:bg-[#FFE600] px-2 py-1 rounded transition-colors">Testimonials</a>
              <a href="#contact" className="hover:bg-[#FFE600] px-2 py-1 rounded transition-colors">Contact</a>
              <button onClick={onOpenLogin} className="bg-[#00F0B5] text-black px-3 py-1 rounded border border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer">
                Portal Sign In
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* 13. INTERACTIVE "BOOK A DEMO" MODAL - NEO-BRUTALIST                   */}
      {/* ===================================================================== */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFDF7] rounded-3xl max-w-lg w-full p-6 sm:p-8 border-[3px] border-black shadow-[12px_12px_0px_0px_#000] relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#FF5E97] border-2 border-black text-black hover:bg-[#ff4687] shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {demoSubmitted ? (
              <div className="py-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#00F0B5] border-2 border-black text-black flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_#000]">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black text-black">Demo Scheduled Successfully!</h3>
                <p className="text-xs font-semibold text-slate-800 mt-2 max-w-sm mx-auto leading-relaxed">
                  Thank you, <span className="font-black text-black">{demoData.name}</span>. 
                  Our HRMS solutions architect will reach out to you at{' '}
                  <span className="font-black text-black">{demoData.email}</span> with calendar invitations 
                  and live walkthrough credentials.
                </p>
                <button
                  onClick={() => setIsDemoModalOpen(false)}
                  className="mt-6 px-6 py-3 rounded-xl bg-black text-[#FFE600] font-black text-xs border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  Close &amp; Continue Browsing
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#FFE600] border-2 border-black text-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <h3 className="text-xl font-black text-black">Book a Live 1-on-1 Demo</h3>
                </div>
                <p className="text-xs font-bold text-slate-700 mb-6">
                  See how My Own HRMS automates your exact company attendance rules and payroll structure.
                </p>

                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={demoData.name}
                        onChange={(e) => setDemoData({ ...demoData, name: e.target.value })}
                        placeholder="e.g. Keyur Sangani"
                        className="w-full h-11 px-3.5 rounded-xl border-2 border-black text-xs font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Work Email *</label>
                      <input
                        type="email"
                        required
                        value={demoData.email}
                        onChange={(e) => setDemoData({ ...demoData, email: e.target.value })}
                        placeholder="name@company.com"
                        className="w-full h-11 px-3.5 rounded-xl border-2 border-black text-xs font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={demoData.company}
                        onChange={(e) => setDemoData({ ...demoData, company: e.target.value })}
                        placeholder="e.g. Paneliya Tech Inc."
                        className="w-full h-11 px-3.5 rounded-xl border-2 border-black text-xs font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={demoData.phone}
                        onChange={(e) => setDemoData({ ...demoData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full h-11 px-3.5 rounded-xl border-2 border-black text-xs font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Team Size</label>
                      <select
                        value={demoData.teamSize}
                        onChange={(e) => setDemoData({ ...demoData, teamSize: e.target.value })}
                        className="w-full h-11 px-3 rounded-xl border-2 border-black text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_0px_#000]"
                      >
                        <option>1-20 employees</option>
                        <option>21-50 employees</option>
                        <option>51-200 employees</option>
                        <option>201-500 employees</option>
                        <option>500+ employees</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Preferred Time Slot</label>
                      <select
                        value={demoData.timeSlot}
                        onChange={(e) => setDemoData({ ...demoData, timeSlot: e.target.value })}
                        className="w-full h-11 px-3 rounded-xl border-2 border-black text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_0px_#000]"
                      >
                        <option>11:00 AM - 12:00 PM</option>
                        <option>02:00 PM - 03:00 PM</option>
                        <option>04:00 PM - 05:00 PM</option>
                        <option>06:00 PM - 07:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black mb-1">Specific Requirements or Modules of Interest</label>
                    <textarea
                      rows={2}
                      value={demoData.notes}
                      onChange={(e) => setDemoData({ ...demoData, notes: e.target.value })}
                      placeholder="e.g. Biometric device integration, shift rosters, custom payslip taxes..."
                      className="w-full p-3 rounded-xl border-2 border-black text-xs font-medium focus:outline-none focus:shadow-[3px_3px_0px_0px_#000] bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 mt-2 rounded-xl bg-[#FFE600] hover:bg-[#ffd700] text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    Confirm &amp; Schedule Demo
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
