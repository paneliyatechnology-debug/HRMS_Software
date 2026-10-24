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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* ===================================================================== */}
      {/* 1. TOP STICKY NAVBAR                                                  */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform ring-4 ring-indigo-50">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight block leading-tight">
                My Own HRMS
              </span>
              <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase block">
                Enterprise Cloud Suite
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#impact" className="hover:text-indigo-600 transition-colors">Impact</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contact</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              id="btn-nav-book-demo"
              onClick={() => {
                setDemoSubmitted(false);
                setIsDemoModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 text-xs font-bold transition-all active:scale-95 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Book a Demo</span>
            </button>

            <button
              id="btn-nav-login"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/25 active:scale-95"
            >
              <span>Sign In / Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. HERO SECTION: "Build a Better Workplace"                            */}
      {/* ===================================================================== */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/70 via-white to-white">
        {/* Subtle decorative glow blobs */}
        <div className="absolute top-10 left-1/4 w-[500px] h-[350px] bg-gradient-to-tr from-indigo-200/40 via-violet-200/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 right-10 w-[400px] h-[300px] bg-gradient-to-bl from-purple-200/30 via-pink-100/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headline, Description & CTAs */}
            <div className="lg:col-span-7 text-left">
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold mb-6 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span>Next-Gen Enterprise Workforce Management System 2026</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Build a Better Workplace with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700">
                  Intelligent HR
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 mt-6 leading-relaxed max-w-xl">
                Eliminate spreadsheets and fragmented tools. Experience unified biometric attendance, 
                instant automated payroll, leave cycles, recruitment ATS, and real-time staff collaboration in 
                one beautifully crafted workspace.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  id="btn-hero-book-demo"
                  onClick={() => {
                    setDemoSubmitted(false);
                    setIsDemoModalOpen(true);
                  }}
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 text-center"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Book a Personalized Demo</span>
                </button>

                <button
                  id="btn-hero-sign-in"
                  onClick={onOpenLogin}
                  className="px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm shadow-xs transition-all hover:border-slate-300 flex items-center justify-center gap-2 text-center"
                >
                  <span>Access Your Workspace</span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Micro Trust Checklist */}
              <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Instant 15-minute deployment</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>99.9% Uptime Guarantee</span>
                </div>
              </div>

              {/* Quick Stat Pill Highlights */}
              <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl">
                <div>
                  <p className="text-2xl font-black text-indigo-600">99.9%</p>
                  <p className="text-[11px] font-semibold text-slate-500">Biometric Sync</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-violet-600">&lt; 2 Mins</p>
                  <p className="text-[11px] font-semibold text-slate-500">Payroll Execution</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">100%</p>
                  <p className="text-[11px] font-semibold text-slate-500">Tax Compliant</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">24/7</p>
                  <p className="text-[11px] font-semibold text-slate-500">Priority Support</p>
                </div>
              </div>
            </div>

            {/* Right Column: High-Impact Visual Mockup & Floating Cards */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Background Ambient Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl transform -rotate-2 scale-105" />

                {/* Main Showcase Panel */}
                <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-5 overflow-hidden">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="ml-2 text-[11px] font-mono text-slate-400">app.myownhrms.com/live</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      System Online
                    </span>
                  </div>

                  {/* Header Snapshot */}
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white">
                    <p className="text-[11px] font-medium text-indigo-300">Total Workforce Overview</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <h3 className="text-3xl font-black text-white">154 Staff Active</h3>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> +12 this month
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-indigo-800/60">
                      <div>
                        <p className="text-[10px] text-indigo-300">Today&apos;s Attendance</p>
                        <p className="text-base font-extrabold text-white mt-0.5">96.8% (149 in)</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-indigo-300">Payroll Cycle Status</p>
                        <p className="text-base font-extrabold text-emerald-400 mt-0.5">Approved &amp; Ready</p>
                      </div>
                    </div>
                  </div>

                  {/* Realtime Employee Punch Stream Preview */}
                  <div className="mt-4 space-y-2.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                      Recent Biometric Check-Ins
                    </p>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          AU
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">Admin User</p>
                          <p className="text-[10px] text-slate-500">Corporate HQ • Biometric Gate 1</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                        09:02 AM • In
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center">
                          SP
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">Sanjay Patel</p>
                          <p className="text-[10px] text-slate-500">Engineering • Geofence Mobile</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                        09:14 AM • In
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                          RK
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">Ravi Khunt</p>
                          <p className="text-[10px] text-slate-500">Design Team • Web Punch</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                        09:30 AM • In
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Badge 1: Top Right */}
                <div className="hidden sm:flex absolute -top-5 -right-5 items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-slate-200/50">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 leading-tight">Biometric Active</p>
                    <p className="text-[10px] text-slate-500">99.8% Sync Success</p>
                  </div>
                </div>

                {/* Floating Badge 2: Bottom Left */}
                <div className="hidden sm:flex absolute -bottom-6 -left-6 items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-slate-200/50">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 leading-tight">₹42,50,000</p>
                    <p className="text-[10px] text-emerald-600 font-bold">Payroll Auto-Processed</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. TRUSTED BY 500+ COMPANIES SOCIAL PROOF STRIP                       */}
      {/* ===================================================================== */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            Trusted by over 500+ forward-thinking teams across manufacturing, tech, retail &amp; corporate sectors
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center gap-2 font-black text-lg text-slate-700 tracking-tight">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">▲</div>
              <span>APEX GLOBAL</span>
            </div>
            <div className="flex items-center gap-2 font-black text-lg text-slate-700 tracking-tight">
              <div className="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs">●</div>
              <span>NOVASOFT</span>
            </div>
            <div className="flex items-center gap-2 font-black text-lg text-slate-700 tracking-tight">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">■</div>
              <span>PULSE HR</span>
            </div>
            <div className="flex items-center gap-2 font-black text-lg text-slate-700 tracking-tight">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">◆</div>
              <span>TECHCORP INC</span>
            </div>
            <div className="flex items-center gap-2 font-black text-lg text-slate-700 tracking-tight">
              <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs">★</div>
              <span>ELEVATE INFRA</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. FEATURES SECTION: "Everything You Need in One Place" (6 CARDS)      */}
      {/* ===================================================================== */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Powerful Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mt-4">
              Everything You Need in One Place
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Every department, rule, and workflow connects seamlessly. Say goodbye to manual exports, 
              disconnected biometric devices, and out-of-sync personnel files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {/* Feature Card 1 */}
            <div className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-6">Workforce Directory</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Centralized employee records, personal KYC documents, reporting hierarchy, departmental structures, 
                and role permissions with full audit history.
              </p>
              <ul className="mt-5 space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Complete employee timeline &amp; documents
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Multi-branch departmental trees
                </li>
              </ul>
            </div>

            {/* Feature Card 2 */}
            <div className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-6">Biometric &amp; Geofence Attendance</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Live biometric clock in/out sync, mobile punches with GPS verification, late coming penalties, 
                overtime tracking, and seamless attendance regularization.
              </p>
              <ul className="mt-5 space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Real-time biometric machine integration
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Overtime &amp; shift auto-calculation
                </li>
              </ul>
            </div>

            {/* Feature Card 3 */}
            <div className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <DollarSign className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-6">Automated 1-Click Payroll</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Run salary disbursements in under 2 minutes. Automatic statutory computations (PF, ESI, TDS, PT), 
                allowances, deductions, bonuses, and professional PDF payslips.
              </p>
              <ul className="mt-5 space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Instant salary register &amp; bank format
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Downloadable encrypted employee payslips
                </li>
              </ul>
            </div>

            {/* Feature Card 4 */}
            <div className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-6">Leave &amp; Shift Approvals</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Customizable leave policies (Casual, Sick, Paid, Maternity), multi-level manager approval workflows, 
                holiday calendars, and automatic balance accruals.
              </p>
              <ul className="mt-5 space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Multi-tier manager approval chains
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Real-time team availability calendar
                </li>
              </ul>
            </div>

            {/* Feature Card 5 */}
            <div className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-6">ATS Recruitment &amp; Onboarding</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Post job openings, track applicants across Kanban stages (Screening, Interview, Offer), schedule 
                interviews, and convert hired candidates into active employees with 1 click.
              </p>
              <ul className="mt-5 space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Visual candidate pipeline Kanban
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> 1-Click candidate to employee conversion
                </li>
              </ul>
            </div>

            {/* Feature Card 6 */}
            <div className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Laptop className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-6">Hardware &amp; Asset Management</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Track laptops, accessories, monitors, and company equipment assigned to team members. Monitor serial 
                numbers, repair warranties, and exit return checklists.
              </p>
              <ul className="mt-5 space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Serialized hardware allocation &amp; receipts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Automated offboarding asset returns
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. IMPACT SECTION: "Trusted by Businesses Across the Globe" (DARK)    */}
      {/* ===================================================================== */}
      <section id="impact" className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
        {/* Glow lights */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest bg-indigo-950/80 border border-indigo-800/80 px-4 py-1.5 rounded-full">
              GLOBAL REACH &amp; SCALE
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mt-5">
              Trusted by Businesses Across the Globe
            </h2>
            <p className="text-base text-slate-400 mt-4 leading-relaxed">
              We empower high-performing companies worldwide to streamline HR workflows, guarantee biometric 
              attendance accuracy, and run zero-error payroll cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 max-w-6xl mx-auto">
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center hover:border-indigo-500/50 transition-all shadow-xl">
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">50,000+</div>
              <p className="text-sm font-bold text-indigo-400 mt-2">Active Employees Managed</p>
              <p className="text-xs text-slate-400 mt-1">Across multiple branches and subsidiaries</p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center hover:border-indigo-500/50 transition-all shadow-xl">
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">99.9%</div>
              <p className="text-sm font-bold text-indigo-400 mt-2">Biometric Gateway Uptime</p>
              <p className="text-xs text-slate-400 mt-1">Instant continuous punch synchronization</p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center hover:border-indigo-500/50 transition-all shadow-xl">
              <div className="text-4xl sm:text-5xl font-black text-violet-400 tracking-tight">&lt; 2 Mins</div>
              <p className="text-sm font-bold text-indigo-400 mt-2">Payroll Execution Time</p>
              <p className="text-xs text-slate-400 mt-1">From attendance closing to bank transfer file</p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center hover:border-indigo-500/50 transition-all shadow-xl">
              <div className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight">4.9 / 5</div>
              <p className="text-sm font-bold text-indigo-400 mt-2">Enterprise Satisfaction</p>
              <p className="text-xs text-slate-400 mt-1">Based on reviews from verified HR managers</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. "GET STARTED IN 3 SIMPLE STEPS" SECTION                            */}
      {/* ===================================================================== */}
      <section id="how-it-works" className="py-24 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Effortless Setup
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mt-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Modernizing your HR operations takes less than 15 minutes. No complex hardware installs or steep learning curves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-600/30">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-6">Setup Your Organization</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Add your company details, branch offices, and departments. Import your entire employee directory with 1-click Excel/CSV upload.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-violet-600/30">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-6">Connect Biometrics &amp; Shifts</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Plug in your biometric attendance machines or enable GPS-geofenced mobile check-ins. Assign custom shift rosters and leave allowances.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-600/30">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-6">Automate Payroll &amp; Relax</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Attendance and overtime sync into payroll automatically. Generate payslips with compliant statutory deductions in under 2 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. TESTIMONIALS SECTION                                               */}
      {/* ===================================================================== */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Real Impact
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mt-4">
              Loved by HR Leaders &amp; Teams
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Discover how enterprise leaders replaced messy spreadsheets and saved hundreds of operational hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Testimonial 1 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  &ldquo;My Own HRMS completely transformed our end-of-month stress. Biometric attendance calculations 
                  that used to take 3 days of manual reconciliation are now done in under 5 minutes.&rdquo;
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3 pt-4 border-t border-slate-200">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                  RC
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Rohan Contractor</p>
                  <p className="text-xs text-slate-500">Head of People &amp; Culture, Apex Tech</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  &ldquo;The employee self-service portal and instant mobile check-ins are loved by our 200+ field 
                  engineers. Managing leave approvals and shifts is now a breeze.&rdquo;
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3 pt-4 border-t border-slate-200">
                <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 font-black text-xs flex items-center justify-center">
                  PN
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Pooja Naik</p>
                  <p className="text-xs text-slate-500">HR Operations Director, Nova Logistics</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  &ldquo;The multi-tenant governance allows us to manage three separate group entities from one 
                  central screen without mixing data. Super fast and reliable.&rdquo;
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3 pt-4 border-t border-slate-200">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                  MK
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Manish Khandelwal</p>
                  <p className="text-xs text-slate-500">Chief Operating Officer, Synthetix Corp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. PRICING PLANS SECTION                                              */}
      {/* ===================================================================== */}
      <section id="pricing" className="py-24 bg-slate-50/70 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Simple &amp; Transparent
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mt-4">
              Plans Scaled to Your Business Size
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              No hidden fees or surprise setup charges. Start small and upgrade smoothly as your organization grows.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto items-stretch">
            {/* Starter Plan */}
            <div className="p-8 rounded-3xl border border-slate-200 bg-white flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-900">Starter Plan</h3>
                <p className="text-xs text-slate-500 mt-1">Perfect for startups and boutique teams.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">₹999</span>
                  <span className="text-xs font-semibold text-slate-500">/ month</span>
                </div>

                <ul className="mt-8 space-y-3.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Up to 25 Active Employees</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Biometric &amp; Web Punch Attendance</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Standard Automated Payroll &amp; Slips</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Leave Approval Workflow</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setDemoData((prev) => ({ ...prev, teamSize: '1-20 employees' }));
                  setIsDemoModalOpen(true);
                }}
                className="w-full mt-8 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold text-xs transition-all text-center"
              >
                Choose Starter
              </button>
            </div>

            {/* Growth Plan (Popular) */}
            <div className="p-8 rounded-3xl border-2 border-indigo-600 bg-gradient-to-b from-indigo-50/40 to-white flex flex-col justify-between shadow-xl shadow-indigo-600/10 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-sm">
                Most Popular
              </span>

              <div>
                <h3 className="text-xl font-black text-slate-900">Growth Plan</h3>
                <p className="text-xs text-slate-500 mt-1">For expanding teams needing complete automation.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">₹2,499</span>
                  <span className="text-xs font-semibold text-slate-500">/ month</span>
                </div>

                <ul className="mt-8 space-y-3.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Up to 100 Active Employees</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Geofenced Mobile Clock In/Out</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Full ATS Candidate Pipeline</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Hardware Asset Tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Team Communication &amp; Broadcast</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setDemoData((prev) => ({ ...prev, teamSize: '21-50 employees' }));
                  setIsDemoModalOpen(true);
                }}
                className="w-full mt-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all text-center"
              >
                Choose Growth
              </button>
            </div>

            {/* Enterprise Suite */}
            <div className="p-8 rounded-3xl border border-slate-200 bg-white flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-900">Enterprise Suite</h3>
                <p className="text-xs text-slate-500 mt-1">Multi-company groups with custom SLAs.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">Custom</span>
                </div>

                <ul className="mt-8 space-y-3.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Employees &amp; Sub-Entities</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dedicated Multi-Tenant Super Admin</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Custom Biometric Hardware Integrations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dedicated Account Manager &amp; 99.99% SLA</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setDemoData((prev) => ({ ...prev, teamSize: '500+ employees' }));
                  setIsDemoModalOpen(true);
                }}
                className="w-full mt-8 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold text-xs transition-all text-center"
              >
                Contact Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 9. FAQ ACCORDION SECTION                                              */}
      {/* ===================================================================== */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Answers &amp; Clarity
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-12 space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-bold text-slate-900">{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        isOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-100">
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
      {/* 10. CONTACT US SECTION                                                */}
      {/* ===================================================================== */}
      <section id="contact" className="py-24 bg-slate-50/70 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Info */}
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Get In Touch
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-4">
                Have Questions? We&apos;re Here to Help
              </h2>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Connect with our implementation specialists for custom enterprise quotes, hardware compatibility questions, or partner inquiries.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Phone &amp; WhatsApp Support</p>
                    <p className="text-sm font-semibold text-indigo-600 mt-0.5">+91 98765 43210</p>
                    <p className="text-[11px] text-slate-500">Mon - Sat, 9:00 AM - 7:00 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Email Inquiries</p>
                    <p className="text-sm font-semibold text-indigo-600 mt-0.5">contact@myownhrms.com</p>
                    <p className="text-[11px] text-slate-500">Response guaranteed within 2 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
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
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-lg">
              <h3 className="text-lg font-black text-slate-900">Send Us a Direct Message</h3>
              <p className="text-xs text-slate-500 mt-1">Our executive engineering team will reply promptly.</p>

              {contactSubmitted ? (
                <div className="mt-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center animate-in fade-in">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-sm">Thank You for Reaching Out!</p>
                  <p className="text-xs text-emerald-700 mt-1">
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
                        placeholder="Keyur Sangani"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        value={contactData.email}
                        onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                        placeholder="keyur@example.com"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
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
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                      <select
                        value={contactData.subject}
                        onChange={(e) => setContactData({ ...contactData, subject: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-600"
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
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all"
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
      <section className="py-20 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Ready to Build a Better Workplace?
          </h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto mt-4 leading-relaxed">
            Join thousands of employees and administrators using My Own HRMS daily for effortless operations.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                setDemoSubmitted(false);
                setIsDemoModalOpen(true);
              }}
              className="px-8 py-4 rounded-xl bg-white text-indigo-950 font-black text-sm hover:bg-slate-100 shadow-xl transition-all"
            >
              Book a Free Live Demo
            </button>
            <button
              onClick={onOpenLogin}
              className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition-all shadow-xl shadow-indigo-600/30"
            >
              Sign In to Your Workspace →
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 12. ENTERPRISE FOOTER                                                 */}
      {/* ===================================================================== */}
      <footer className="py-14 bg-white border-t border-slate-200 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">My Own HRMS</p>
                <p className="text-[11px] text-slate-400">Next-Generation Enterprise Workforce Cloud</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-semibold">
              <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
              <a href="#impact" className="hover:text-indigo-600 transition-colors">Impact</a>
              <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Testimonials</a>
              <a href="#contact" className="hover:text-indigo-600 transition-colors">Contact</a>
              <button onClick={onOpenLogin} className="text-indigo-600 font-bold hover:underline">
                Portal Sign In
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>&copy; {new Date().getFullYear()} Paneliya Technology - My Own HRMS. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>SOC-2 &amp; GDPR Compliant Architecture</span>
              <span>256-Bit TLS Bank Encryption</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* 13. INTERACTIVE "BOOK A DEMO" MODAL                                   */}
      {/* ===================================================================== */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {demoSubmitted ? (
              <div className="py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Demo Scheduled Successfully!</h3>
                <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                  Thank you, <span className="font-bold text-slate-900">{demoData.name}</span>. 
                  Our HRMS solutions architect will reach out to you at{' '}
                  <span className="font-bold text-slate-900">{demoData.email}</span> with calendar invitations 
                  and live walkthrough credentials.
                </p>
                <button
                  onClick={() => setIsDemoModalOpen(false)}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all"
                >
                  Close &amp; Continue Browsing
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Book a Live 1-on-1 Demo</h3>
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
                        placeholder="e.g. Keyur Sangani"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
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
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
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
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
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
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Team Size</label>
                      <select
                        value={demoData.teamSize}
                        onChange={(e) => setDemoData({ ...demoData, teamSize: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-600"
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
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-600"
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
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all"
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
