'use client';

import React, { useState } from 'react';
import Link from 'next/link';
<<<<<<< HEAD
import { ChevronDown, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { LandingNav } from '../../components/landing/LandingNav';
import { LandingFooter } from '../../components/landing/LandingFooter';
<<<<<<< HEAD
import { Tilt3D, Reveal3D, Ambient3DScene, BottomCta3D } from '../../components/landing/Motion3D';
=======
import {
  ChevronDown,
  ArrowRight,
  Lock,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Clock,
  CreditCard,
  Users,
} from 'lucide-react';
import { LandingNav } from '../../components/landing/LandingNav';
import { LandingFooter } from '../../components/landing/LandingFooter';
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
=======
import { Reveal3D, Ambient3DScene, BottomCta3D, LaunchWorkspaceButton } from '../../components/landing/Motion3D';
>>>>>>> 0d10fa3b585569ce8a42ed27dde970aafc01b11f

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'security' | 'attendance' | 'payroll' | 'setup'>('all');

  const faqs = [
    {
      category: 'security',
      q: 'Is multi-company data securely separated in MyOwn HRMS?',
      a: 'Absolutely. MyOwn HRMS implements strict tenant isolation. Every organization operates within its own private boundary with dedicated role-based access control (RBAC) across Admins, HRs, and Employees. Employees of Company A cannot access or discover any data belonging to Company B.',
    },
    {
      category: 'attendance',
      q: 'How does live shift attendance and break tracking work?',
      a: 'Employees clock in with second-by-second accuracy using the web portal or mobile interface. They can pause their work session for lunch or tea breaks. Work hours and overtime are calculated automatically, eliminating spreadsheet discrepancies.',
    },
    {
      category: 'payroll',
      q: 'Does MyOwn HRMS compute Indian statutory payroll (PF, ESIC, PT & TDS)?',
      a: 'Yes. The system automatically computes monthly salary structures, including basic pay, HRA, special allowances, Employee Provident Fund (PF), ESIC contributions, and Professional Tax (PT). Monthly payslips with transparent breakdowns are generated and downloadable as PDF.',
    },
    {
      category: 'attendance',
      q: 'How do leave quotas, balances, and manager approvals work?',
      a: 'Companies define annual quota allocations for Casual, Sick, and Paid/Annual leaves. When an employee applies for leave, their reporting manager receives an instant notification to approve or reject with comments with automatic quota deductions.',
    },
    {
      category: 'setup',
      q: 'What hardware or technical setup is required to get started?',
      a: 'Zero specialized hardware is required. MyOwn HRMS is a 100% cloud-based software operating platform accessible from any desktop or mobile browser. Simply register your company workspace, add staff, and begin tracking operations immediately.',
    },
    {
      category: 'setup',
      q: 'How long does it take to onboard a new organization?',
      a: 'A new company workspace can be registered and configured within 5 to 10 minutes. Once registered, company owners can set up working shifts, invite employees, and start clock-ins right away.',
    },
    {
      category: 'payroll',
      q: 'Can employees view and download their monthly payslips independently?',
      a: 'Yes. Every employee has access to their own self-service portal where they can view historical monthly pay slips, salary breakdowns, and download official PDF payslips without needing to request HR manually.',
    },
    {
      category: 'security',
      q: 'How is data encrypted and protected against unauthorized access?',
      a: 'All data in transit is encrypted using 256-bit SSL encryption. Authentication uses secure HTTP-only session tokens with anti-autofill and rate-limiting protections against brute-force attacks.',
    },
  ];

  const filteredFaqs =
    selectedCategory === 'all'
      ? faqs
      : faqs.filter((item) => item.category === selectedCategory);

  return (
<<<<<<< HEAD
    <div className="min-h-screen w-full bg-[#f8f9fa] text-slate-800 selection:bg-emerald-600 selection:text-white relative overflow-x-clip font-sans">
      <Ambient3DScene />
      <LandingNav activePage="faq" />

      {/* 3D Hero Header */}
      <section className="relative pt-12 sm:pt-16 pb-10 sm:pb-14 text-center">
        <Reveal3D className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Frequently Asked{' '}
              <span className="text-[#2d6a4f]">Questions.</span>
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              Everything you need to know about MyOwn HRMS multi-tenant security, attendance, statutory payroll, and company onboarding.
            </p>
          </div>
        </Reveal3D>
      </section>

      {/* New 2-Column 3D FAQ Layout */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sticky Category Sidebar + Quick Launch Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5 relative z-10">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#f3faf5] to-white border border-[#95d5b2]/80 shadow-[0_12px_28px_-10px_rgba(27,67,50,0.12)] space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#2d6a4f] px-2 mb-2">
                Filter Topics
              </p>
              {[
                { id: 'all', label: 'All Questions' },
                { id: 'security', label: 'Security & Privacy' },
                { id: 'attendance', label: 'Attendance & Leaves' },
                { id: 'payroll', label: 'Payroll & Compliance' },
                { id: 'setup', label: 'Setup & Onboarding' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id as any);
                    setOpenFaq(0);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white shadow-sm'
                      : 'bg-white hover:bg-emerald-50/60 text-slate-700 border border-slate-200/80 hover:border-[#95d5b2]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-[0_18px_38px_-12px_rgba(27,67,50,0.4)] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#d8f3dc]" />
                </div>
                <h3 className="text-base font-bold">Ready to Explore MyOwn HRMS?</h3>
                <p className="text-xs text-[#d8f3dc] leading-relaxed">
                  Get your company workspace set up today. Enjoy seamless shift tracking, instant leave approvals, and automated payroll calculations.
                </p>
                <div className="pt-1 flex flex-col gap-2">
                  <LaunchWorkspaceButton
                    label="Register Company Workspace"
                    className="h-10 px-4 rounded-xl bg-white hover:bg-[#d8f3dc] text-[#1b4332] font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                    iconClassName="w-3.5 h-3.5 text-[#1b4332]"
                  />
                  <Link
                    href="/login"
                    className="h-10 px-4 rounded-xl bg-emerald-950/50 hover:bg-emerald-950 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-1.5 transition"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#d8f3dc]" />
                    <span>Sign In to Portal</span>
                  </Link>
                </div>
              </div>
            </div>

          {/* Right 3D Accordion Cards */}
          <div className="lg:col-span-8 space-y-3.5">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={`${selectedCategory}-${faq.q}`}
                  className={`rounded-2xl border overflow-hidden transition-all duration-300 animate-in fade-in ${
                    isOpen
                      ? 'bg-gradient-to-br from-[#eef7f1] via-white to-[#d8f3dc]/40 border-[#52b788] shadow-[0_16px_34px_-12px_rgba(27,67,50,0.18)]'
                      : 'bg-white border-slate-200/90 hover:border-[#95d5b2] hover:bg-emerald-50/20 shadow-[0_6px_18px_-8px_rgba(15,23,42,0.07)]'
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
                        isOpen ? 'bg-[#1b4332] text-white rotate-180' : 'bg-slate-100 text-slate-500'
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
<<<<<<< HEAD
                    )}
                  </div>
                </Reveal3D>
=======
    <div className="min-h-screen w-full bg-[#f8f9fa] text-slate-800 selection:bg-emerald-600 selection:text-white relative overflow-x-hidden font-sans">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[480px] bg-gradient-to-tr from-emerald-300/15 via-teal-200/10 to-emerald-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Shared Navigation */}
      <LandingNav activePage="faq" />

      {/* Hero Header */}
      <section className="relative pt-12 sm:pt-16 pb-12 sm:pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
         

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Frequently Asked{' '}
            <span className="text-[#2d6a4f]">Questions.</span>
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about MyOwn HRMS multi-tenant security, attendance, statutory payroll, and company onboarding.
          </p>

          {/* Category Filter Pills */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Questions' },
              { id: 'security', label: 'Security & Privacy' },
              { id: 'attendance', label: 'Attendance & Leaves' },
              { id: 'payroll', label: 'Payroll & Compliance' },
              { id: 'setup', label: 'Setup & Onboarding' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id as any);
                  setOpenFaq(0);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#1b4332] text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Accordion Section */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-3.5">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#f8f9fa] border border-slate-200/90 overflow-hidden shadow-2xs transition-all hover:border-[#95d5b2]"
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
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
=======
                    </div>
                  )}
                </div>
>>>>>>> 0d10fa3b585569ce8a42ed27dde970aafc01b11f
              );
            })}
          </div>
        </div>
      </section>

<<<<<<< HEAD
      <BottomCta3D
        title="Ready to Automate Your Workforce?"
        subtitle="Register your company workspace today or sign in to experience effortless attendance, leave approvals, and employee self-service."
      />
=======
      {/* Support / Still Have Questions Card */}
      <section className="py-14 bg-[#f8f9fa]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center font-bold mx-auto">
              <Sparkles className="w-6 h-6 text-[#2d6a4f]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Ready to Explore MyOwn HRMS?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              Get your company workspace set up today. Enjoy seamless shift tracking, instant leave approvals, and automated payroll calculations.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="h-11 px-5 rounded-2xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Register Company Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="h-11 px-5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#2d6a4f]" />
                <span>Sign In to Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Ready to Automate Your Workforce?
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
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-emerald-950/60 hover:bg-emerald-950 text-white font-bold text-xs sm:text-sm border border-emerald-400/40 shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#d8f3dc]" />
              <span>Sign In to Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Shared Footer */}
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
      <LandingFooter />
    </div>
  );
}
