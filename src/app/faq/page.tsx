'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { LandingNav } from '../../components/landing/LandingNav';
import { LandingFooter } from '../../components/landing/LandingFooter';
import { Tilt3D, Reveal3D, Ambient3DScene, BottomCta3D } from '../../components/landing/Motion3D';

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
          {/* Left Sticky 3D Category Sidebar + Quick Launch Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            <Tilt3D intensity={6} glare>
              <div className="p-5 rounded-3xl bg-[#f8f9fa] border border-slate-200/90 shadow-[0_12px_28px_-10px_rgba(15,23,42,0.08)] space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
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
                        ? 'bg-[#1b4332] text-white shadow-sm'
                        : 'bg-white hover:bg-emerald-50/40 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </Tilt3D>

            <Tilt3D intensity={7} glare>
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-[0_18px_38px_-12px_rgba(27,67,50,0.4)] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#d8f3dc]" />
                </div>
                <h3 className="text-base font-bold">Ready to Explore MyOwn HRMS?</h3>
                <p className="text-xs text-[#d8f3dc] leading-relaxed">
                  Get your company workspace set up today. Enjoy seamless shift tracking, instant leave approvals, and automated payroll calculations.
                </p>
                <div className="pt-1 flex flex-col gap-2">
                  <Link
                    href="/register"
                    className="h-10 px-4 rounded-xl bg-white hover:bg-[#d8f3dc] text-[#1b4332] font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Register Company Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/login"
                    className="h-10 px-4 rounded-xl bg-emerald-950/50 hover:bg-emerald-950 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-1.5 transition"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#d8f3dc]" />
                    <span>Sign In to Portal</span>
                  </Link>
                </div>
              </div>
            </Tilt3D>
          </div>

          {/* Right 3D Accordion Cards */}
          <div className="lg:col-span-8 space-y-3.5">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <Reveal3D key={`${selectedCategory}-${idx}`} delayMs={idx * 45}>
                  <div className="rounded-2xl bg-[#f8f9fa] border border-slate-200/90 overflow-hidden shadow-[0_6px_18px_-8px_rgba(15,23,42,0.08)] transition-all hover:border-[#95d5b2]">
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
                </Reveal3D>
              );
            })}
          </div>
        </div>
      </section>

      <BottomCta3D
        title="Ready to Automate Your Workforce?"
        subtitle="Register your company workspace today or sign in to experience effortless attendance, leave approvals, and employee self-service."
      />
      <LandingFooter />
    </div>
  );
}
