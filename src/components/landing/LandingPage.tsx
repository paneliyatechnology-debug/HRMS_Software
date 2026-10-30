'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <a href="#features" className="px-3 py-1.5 rounded-xl hover:text-[#059669] hover:bg-emerald-50/70 transition-all">Features</a>
            <a href="#how-it-works" className="px-3 py-1.5 rounded-xl hover:text-[#059669] hover:bg-emerald-50/70 transition-all">How It Works</a>
            <a href="#impact" className="px-3 py-1.5 rounded-xl hover:text-[#059669] hover:bg-emerald-50/70 transition-all">Impact</a>
            <a href="#pricing" className="px-3 py-1.5 rounded-xl hover:text-[#059669] hover:bg-emerald-50/70 transition-all">Pricing</a>
            <a href="#testimonials" className="px-3 py-1.5 rounded-xl hover:text-[#059669] hover:bg-emerald-50/70 transition-all">Testimonials</a>
            <a href="#faq" className="px-3 py-1.5 rounded-xl hover:text-[#059669] hover:bg-emerald-50/70 transition-all">FAQ</a>
            <a href="#contact" className="px-3 py-1.5 rounded-xl hover:text-[#059669] hover:bg-emerald-50/70 transition-all">Contact</a>
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

            <Link
              id="btn-nav-login"
              href="/login"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#035940] text-white text-xs font-bold tracking-wide shadow-md shadow-emerald-900/20 hover:shadow-lg hover:shadow-emerald-900/30 active:scale-98 transition-all cursor-pointer"
            >
              <span>Sign In / Login</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  id="btn-hero-book-demo"
                  onClick={() => {
                    setDemoSubmitted(false);
                    setIsDemoModalOpen(true);
                  }}
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#035940] text-white font-bold text-sm shadow-lg shadow-emerald-900/25 hover:shadow-xl hover:shadow-emerald-900/35 active:scale-98 transition-all flex items-center justify-center gap-2.5 text-center cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Book a Personalized Demo</span>
                </button>

                <Link
                  id="btn-hero-sign-in"
                  href="/login"
                  onClick={onOpenLogin}
                  className="px-7 py-3.5 rounded-2xl bg-white hover:bg-emerald-50/60 text-[#062d1f] font-bold text-sm border border-[#d8ebd9] hover:border-emerald-300 shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
                >
                  <span>Access Your Workspace</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2] text-[#059669]" />
                </Link>
              </div>

              {/* Micro Trust Checklist */}
              <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-[#d8ebd9] shadow-xs">
                  <Check className="w-3.5 h-3.5 text-[#059669] stroke-[3]" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-[#d8ebd9] shadow-xs">
                  <Check className="w-3.5 h-3.5 text-[#059669] stroke-[3]" />
                  <span>Instant 15-min setup</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-[#d8ebd9] shadow-xs">
                  <Check className="w-3.5 h-3.5 text-[#059669] stroke-[3]" />
                  <span>99.9% Uptime SLA</span>
                </div>
              </div>

              {/* Quick Stat Highlights */}
              <div className="mt-10 pt-8 border-t border-[#d8ebd9] grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
                <div className="p-3.5 bg-white border border-[#d8ebd9] rounded-2xl shadow-xs hover:border-emerald-200 transition-colors">
                  <p className="text-2xl font-extrabold text-[#062d1f]">99.9%</p>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Biometric Sync</p>
                </div>
                <div className="p-3.5 bg-white border border-[#d8ebd9] rounded-2xl shadow-xs hover:border-emerald-200 transition-colors">
                  <p className="text-2xl font-extrabold text-[#059669]">&lt; 2 Mins</p>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Payroll Run</p>
                </div>
                <div className="p-3.5 bg-white border border-[#d8ebd9] rounded-2xl shadow-xs hover:border-emerald-200 transition-colors">
                  <p className="text-2xl font-extrabold text-[#062d1f]">100%</p>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Compliant</p>
                </div>
                <div className="p-3.5 bg-white border border-[#d8ebd9] rounded-2xl shadow-xs hover:border-emerald-200 transition-colors">
                  <p className="text-2xl font-extrabold text-[#059669]">24/7</p>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Live Support</p>
                </div>
              </div>
            </div>

            {/* Right Column: Luxury UI Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Main Showcase Panel */}
                <div className="relative rounded-3xl bg-white border border-[#d8ebd9] shadow-2xl p-5 ring-1 ring-emerald-950/5">
                  
                  {/* Clean Window Header Bar */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#d8ebd9]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="ml-2 text-[11px] font-mono text-slate-500 bg-[#f2f9f5] px-2 py-0.5 rounded-md border border-[#d8ebd9]">
                        app.myownhrms.com/live
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                      SYSTEM ONLINE
                    </span>
                  </div>

                  {/* Header Snapshot Block */}
                  <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-[#062d1f] to-[#0b3b29] text-white shadow-lg shadow-emerald-950/20">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Total Workforce Overview</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <h3 className="text-3xl font-extrabold text-white">154 Staff Active</h3>
                      <span className="text-xs font-bold text-emerald-300 bg-white/10 px-2.5 py-1 rounded-full border border-emerald-400/20 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> +12 this month
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/15">
                      <div>
                        <p className="text-[10px] font-medium text-emerald-200/80 uppercase">Today&apos;s Attendance</p>
                        <p className="text-base font-bold text-white mt-0.5">96.8% (149 in)</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-emerald-200/80 uppercase">Payroll Cycle Status</p>
                        <p className="text-base font-bold text-emerald-300 mt-0.5">Approved &amp; Ready</p>
                      </div>
                    </div>
                  </div>

                  {/* Realtime Employee Punch Stream Preview */}
                  <div className="mt-4 space-y-2.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                      Recent Biometric Check-Ins
                    </p>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8fcfa] border border-[#d8ebd9] hover:bg-emerald-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#062d1f] font-bold text-xs flex items-center justify-center">
                          AU
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">Admin User</p>
                          <p className="text-[10px] text-slate-500">Corporate HQ • Biometric Gate 1</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        09:02 AM • IN
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8fcfa] border border-[#d8ebd9] hover:bg-emerald-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#062d1f] font-bold text-xs flex items-center justify-center">
                          SP
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">Sanjay Patel</p>
                          <p className="text-[10px] text-slate-500">Engineering • Geofence Mobile</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        09:14 AM • IN
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8fcfa] border border-[#d8ebd9] hover:bg-emerald-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#062d1f] font-bold text-xs flex items-center justify-center">
                          RK
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">Ravi Khunt</p>
                          <p className="text-[10px] text-slate-500">Design Team • Web Punch</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        09:30 AM • IN
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Badge 1: Top Right */}
                <div className="hidden sm:flex absolute -top-4 -right-4 items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-[#d8ebd9] shadow-xl">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0 border border-emerald-200/80">
                    <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">Biometric Active</p>
                    <p className="text-[10px] text-slate-500">99.8% Sync Success</p>
                  </div>
                </div>

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
      {/* 8. PRICING PLANS SECTION - SLEEK LUXURY CARDS                         */}
      {/* ===================================================================== */}
      <section id="pricing" className="py-24 bg-white border-b border-[#d8ebd9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#059669] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#062d1f] tracking-tight mt-4">
              Plans Scaled to Your Business Size
            </h2>
            <p className="text-base font-normal text-slate-600 mt-4 leading-relaxed">
              No hidden fees or surprise setup charges. Start small and upgrade smoothly as your organization grows.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto items-stretch">
            
            {/* Starter Plan */}
            <div className="p-8 rounded-3xl border border-[#d8ebd9] bg-white flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all">
              <div>
                <h3 className="text-xl font-bold text-[#062d1f]">Starter Plan</h3>
                <p className="text-xs text-slate-500 mt-1">Perfect for startups and boutique teams.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#062d1f]">₹999</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>

                <ul className="mt-8 space-y-3.5 text-xs font-medium text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>Up to 25 Active Employees</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>Biometric &amp; Web Punch Attendance</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>Standard Automated Payroll &amp; Slips</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>Leave Approval Workflow</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setDemoData((prev) => ({ ...prev, teamSize: '1-20 employees' }));
                  setIsDemoModalOpen(true);
                }}
                className="w-full mt-8 py-3.5 rounded-xl border border-[#d8ebd9] bg-emerald-50/60 hover:bg-emerald-100/70 text-[#062d1f] font-bold text-xs shadow-xs hover:border-emerald-300 active:scale-98 transition-all text-center cursor-pointer"
              >
                Choose Starter
              </button>
            </div>

            {/* Growth Plan (Popular Featured) */}
            <div className="p-8 rounded-3xl border-2 border-[#059669] bg-gradient-to-b from-[#062d1f] to-[#0b3b29] text-white flex flex-col justify-between shadow-2xl relative scale-100 lg:scale-105 z-10">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#059669] text-white font-bold text-xs uppercase tracking-wider shadow-md">
                ★ MOST POPULAR ★
              </span>

              <div>
                <h3 className="text-xl font-bold text-white">Growth Plan</h3>
                <p className="text-xs text-emerald-200/80 mt-1">For expanding teams needing complete automation.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">₹2,499</span>
                  <span className="text-xs text-emerald-200/70">/ month</span>
                </div>

                <ul className="mt-8 space-y-3.5 text-xs font-medium text-emerald-100/90">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Up to 100 Active Employees</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Geofenced Mobile Clock In/Out</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Full ATS Candidate Pipeline</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Hardware Asset Tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Team Communication &amp; Broadcast</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setDemoData((prev) => ({ ...prev, teamSize: '21-50 employees' }));
                  setIsDemoModalOpen(true);
                }}
                className="w-full mt-8 py-3.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#035940] text-white font-bold text-xs shadow-lg shadow-emerald-950/40 active:scale-98 transition-all text-center cursor-pointer"
              >
                Choose Growth
              </button>
            </div>

            {/* Enterprise Suite */}
            <div className="p-8 rounded-3xl border border-[#d8ebd9] bg-[#f8fcfa] flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all">
              <div>
                <h3 className="text-xl font-bold text-[#062d1f]">Enterprise Suite</h3>
                <p className="text-xs text-slate-500 mt-1">Multi-company groups with custom SLAs.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#062d1f]">Custom</span>
                </div>

                <ul className="mt-8 space-y-3.5 text-xs font-medium text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>Unlimited Employees &amp; Sub-Entities</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>Dedicated Multi-Tenant Super Admin</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>Custom Biometric Hardware Integrations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>Dedicated Account Manager &amp; 99.99% SLA</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setDemoData((prev) => ({ ...prev, teamSize: '500+ employees' }));
                  setIsDemoModalOpen(true);
                }}
                className="w-full mt-8 py-3.5 rounded-xl border border-[#d8ebd9] bg-white hover:bg-emerald-50 text-[#062d1f] font-bold text-xs shadow-xs hover:border-emerald-300 active:scale-98 transition-all text-center cursor-pointer"
              >
                Contact Enterprise
              </button>
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
                    className={`w-full p-5 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                      isOpen ? 'bg-emerald-50/80 text-[#062d1f]' : 'bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="text-sm font-bold">{item.q}</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#062d1f] flex items-center justify-center shrink-0">
                      <ChevronDown
                        className={`w-4 h-4 stroke-[2.5] transition-transform ${
                          isOpen ? 'rotate-180 text-[#059669]' : 'text-slate-600'
                        }`}
                      />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-3 text-xs font-normal text-slate-600 leading-relaxed bg-[#f8fcfa] border-t border-[#d8ebd9]">
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
      {/* 10. CONTACT US SECTION - LUXURY FORM & DETAILS                        */}
      {/* ===================================================================== */}
      <section id="contact" className="py-24 bg-white border-b border-[#d8ebd9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#035940] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-900/20 hover:shadow-lg active:scale-98 transition-all cursor-pointer"
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
      <section className="py-20 bg-gradient-to-br from-[#062d1f] via-[#093524] to-[#041d14] text-white border-b border-emerald-900/60 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

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
            <Link
              href="/login"
              onClick={onOpenLogin}
              className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-emerald-400/30 backdrop-blur-md font-bold text-sm active:scale-98 transition-all cursor-pointer flex items-center justify-center text-center"
            >
              Sign In to Your Workspace →
            </Link>
          </div>
        </div>
      </section>

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
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#impact" className="hover:text-white transition-colors">Impact</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
              <Link href="/login" onClick={onOpenLogin} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg font-bold shadow-xs transition-colors cursor-pointer">
                Portal Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* 13. INTERACTIVE "BOOK A DEMO" MODAL - LUXURY EMERALD                  */}
      {/* ===================================================================== */}
      {isDemoModalOpen && (
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
      )}
    </div>
  );
};
