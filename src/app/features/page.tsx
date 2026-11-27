'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Users,
  Calendar,
  Megaphone,
  CreditCard,
  CalendarDays,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
<<<<<<< HEAD
=======
  Sparkles,
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  Zap,
} from 'lucide-react';
import { LandingNav } from '../../components/landing/LandingNav';
import { LandingFooter } from '../../components/landing/LandingFooter';
<<<<<<< HEAD
import { Tilt3D, Reveal3D, Ambient3DScene, BottomCta3D } from '../../components/landing/Motion3D';
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35

export default function FeaturesPage() {
  const features = [
    {
      icon: Clock,
      title: 'Live Attendance & Shift Console',
      badge: 'Real-Time Sync',
      desc: 'Clock in/out with second-by-second accuracy, record lunch and tea breaks, and review daily attendance logs seamlessly.',
      bullets: ['Live work session timers', 'Second-accurate break tracking', 'Geofenced HQ punch validation'],
<<<<<<< HEAD
      span: 'lg:col-span-7',
      featured: 'light',
    },
    {
      icon: CreditCard,
      title: 'Payroll & Payslips',
      badge: 'Statutory Ready',
      desc: 'Transparent monthly salary calculations with breakdowns of basic salary, allowances, PF/ESIC deductions, and slip downloads.',
      bullets: ['Automated Indian statutory rules', 'Downloadable PDF payslips', 'Transparent earnings breakdown'],
      span: 'lg:col-span-5',
      featured: 'dark',
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
    },
    {
      icon: Users,
      title: 'Employee Directory & Profiles',
      badge: 'Team Intelligence',
      desc: 'Centralized team repository with designations, departments, emergency contacts, profile photo uploads, and reporting managers.',
      bullets: ['Complete team records', 'Departmental hierarchy mapping', 'Role-based access permissions'],
<<<<<<< HEAD
      span: 'lg:col-span-6',
      featured: 'light',
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
    },
    {
      icon: Calendar,
      title: 'Leave Quotas & Approvals',
      badge: 'Instant Workflows',
      desc: 'Real-time tracking of Casual, Sick, and Annual leave balances with instant manager approvals and automatic deductions.',
      bullets: ['Annual quota tracking', 'One-click manager approvals', 'Zero spreadsheet calculations'],
<<<<<<< HEAD
      span: 'lg:col-span-6',
      featured: 'light',
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
    },
    {
      icon: Megaphone,
      title: 'Company Notice Board',
      badge: 'Broadcast Hub',
      desc: 'Publish company-wide announcements, department updates, or direct personal notices with priority badges.',
      bullets: ['Urgent, High & Normal badges', 'Department-targeted broadcasts', 'Live unread notice counts'],
<<<<<<< HEAD
      span: 'lg:col-span-6',
      featured: 'light',
=======
    },
    {
      icon: CreditCard,
      title: 'Payroll & Payslips',
      badge: 'Statutory Ready',
      desc: 'Transparent monthly salary calculations with breakdowns of basic salary, allowances, PF/ESIC deductions, and slip downloads.',
      bullets: ['Automated Indian statutory rules', 'Downloadable PDF payslips', 'Transparent earnings breakdown'],
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
    },
    {
      icon: CalendarDays,
      title: "Holiday Calendar & Who's On Leave",
      badge: 'Schedule Clarity',
      desc: 'Interactive monthly calendar featuring public holidays and animated popups showing which team members are on leave.',
      bullets: ['Company public holiday schedule', 'Live team out-of-office status', 'Planning & roster visibility'],
<<<<<<< HEAD
      span: 'lg:col-span-6',
      featured: 'light',
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
    },
  ];

  return (
<<<<<<< HEAD
    <div className="min-h-screen w-full bg-[#f8f9fa] text-slate-800 selection:bg-emerald-600 selection:text-white relative overflow-x-clip font-sans">
      <Ambient3DScene />
      <LandingNav activePage="features" />

      {/* 3D Hero Header */}
      <section className="relative pt-12 sm:pt-16 pb-12 sm:pb-16 text-center">
        <Reveal3D className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              All Your HR Operations in{' '}
              <span className="text-[#2d6a4f]">One High-Performance Suite.</span>
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              Everything your organization needs to run smooth attendance, leave approvals, payroll compliance, and employee operations with zero friction.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="h-11 px-5 rounded-2xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Launch Company Workspace</span>
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
        </Reveal3D>
      </section>

      {/* 3D Bento Feature Grid */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              const isDark = item.featured === 'dark';
              return (
                <Reveal3D key={item.title} className={item.span} delayMs={idx * 65}>
                  <Tilt3D intensity={7} glare className="h-full">
                    <div
                      className={`h-full p-6 sm:p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between ${
                        isDark
                          ? 'bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white shadow-[0_22px_46px_-14px_rgba(27,67,50,0.45)]'
                          : 'bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] hover:bg-emerald-50/20 shadow-[0_10px_26px_-10px_rgba(15,23,42,0.08)] hover:shadow-[0_22px_44px_-12px_rgba(27,67,50,0.18)]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-5">
                          <div
                            style={{ transform: 'translateZ(26px)' }}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-xs ${
                              isDark
                                ? 'bg-white/15 border border-white/25 text-[#d8f3dc]'
                                : 'bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332]'
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isDark
                                ? 'bg-white/15 text-white border border-white/20'
                                : 'bg-white text-[#1b4332] border border-slate-200/90 shadow-2xs'
                            }`}
                          >
                            {item.badge}
                          </span>
                        </div>

                        <h3
                          style={{ transform: 'translateZ(16px)' }}
                          className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}
                        >
                          {item.title}
                        </h3>
                        <p
                          style={{ transform: 'translateZ(10px)' }}
                          className={`text-xs sm:text-sm mt-2 leading-relaxed ${
                            isDark ? 'text-[#d8f3dc]' : 'text-slate-600'
                          }`}
                        >
                          {item.desc}
                        </p>

                        <div
                          className={`mt-5 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-2 ${
                            isDark ? 'border-white/15' : 'border-slate-200/70'
                          }`}
                        >
                          {item.bullets.map((bullet, bIdx) => (
                            <div
                              key={bIdx}
                              className={`flex items-center gap-2 text-xs font-medium ${
                                isDark ? 'text-white/90' : 'text-slate-700'
                              }`}
                            >
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#d8f3dc]' : 'text-[#2d6a4f]'}`}
                              />
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Tilt3D>
                </Reveal3D>
=======
    <div className="min-h-screen w-full bg-[#f8f9fa] text-slate-800 selection:bg-emerald-600 selection:text-white relative overflow-x-hidden font-sans">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[480px] bg-gradient-to-tr from-emerald-300/15 via-teal-200/10 to-emerald-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Shared Navigation */}
      <LandingNav activePage="features" />

      {/* Hero Header */}
      <section className="relative pt-12 sm:pt-16 pb-12 sm:pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            All Your HR Operations in{' '}
            <span className="text-[#2d6a4f]">One High-Performance Suite.</span>
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Everything your organization needs to run smooth attendance, leave approvals, payroll compliance, and employee operations with zero friction.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="h-11 px-5 rounded-2xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Company Workspace</span>
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
      </section>

      {/* Feature Grid */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 sm:p-7 rounded-3xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] hover:bg-emerald-50/20 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex items-center justify-center font-bold group-hover:scale-110 transition-transform shadow-xs">
                        <Icon className="w-6 h-6 text-[#2d6a4f]" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-[#1b4332] border border-slate-200/90 shadow-2xs">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#1b4332] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      {item.desc}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-200/70 space-y-2">
                      {item.bullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              );
            })}
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* 3D Trust & Architecture Cards */}
      <section className="py-14 bg-[#f8f9fa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: ShieldCheck,
              title: 'Tenant Isolation',
              desc: 'Every company data is strictly siloed with private boundaries.',
            },
            {
              icon: Zap,
              title: 'Real-Time Sync',
              desc: 'Live clock-in and attendance sync with sub-50ms latency.',
            },
            {
              icon: Lock,
              title: 'Role-Based Control',
              desc: 'Granular permissions across Company Owners, HRs, and Employees.',
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <Reveal3D key={card.title} delayMs={idx * 70}>
                <Tilt3D intensity={8} glare className="h-full">
                  <div className="h-full p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_10px_24px_-10px_rgba(15,23,42,0.08)] space-y-2 text-center md:text-left">
                    <div
                      style={{ transform: 'translateZ(22px)' }}
                      className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center mx-auto md:mx-0"
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{card.title}</h4>
                    <p className="text-xs text-slate-500">{card.desc}</p>
                  </div>
                </Tilt3D>
              </Reveal3D>
            );
          })}
        </div>
      </section>

      <BottomCta3D
        title="Ready to Experience MyOwn HRMS?"
        subtitle="Register your company workspace today or sign in to experience effortless attendance, leave approvals, and employee self-service."
      />
=======
      {/* Trust & Architecture Banner */}
      <section className="py-14 bg-[#f8f9fa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto md:mx-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Tenant Isolation</h4>
              <p className="text-xs text-slate-500">Every company data is strictly siloed with private boundaries.</p>
            </div>
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto md:mx-0">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Real-Time Sync</h4>
              <p className="text-xs text-slate-500">Live clock-in and attendance sync with sub-50ms latency.</p>
            </div>
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto md:mx-0">
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Role-Based Control</h4>
              <p className="text-xs text-slate-500">Granular permissions across Company Owners, HRs, and Employees.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Ready to Experience MyOwn HRMS?
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
