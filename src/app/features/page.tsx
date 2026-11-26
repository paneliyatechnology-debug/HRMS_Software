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
  Zap,
} from 'lucide-react';
import { LandingNav } from '../../components/landing/LandingNav';
import { LandingFooter } from '../../components/landing/LandingFooter';
import { Tilt3D, Reveal3D, Ambient3DScene, BottomCta3D } from '../../components/landing/Motion3D';

export default function FeaturesPage() {
  const features = [
    {
      icon: Clock,
      title: 'Live Attendance & Shift Console',
      badge: 'Real-Time Sync',
      desc: 'Clock in/out with second-by-second accuracy, record lunch and tea breaks, and review daily attendance logs seamlessly.',
      bullets: ['Live work session timers', 'Second-accurate break tracking', 'Geofenced HQ punch validation'],
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
    },
    {
      icon: Users,
      title: 'Employee Directory & Profiles',
      badge: 'Team Intelligence',
      desc: 'Centralized team repository with designations, departments, emergency contacts, profile photo uploads, and reporting managers.',
      bullets: ['Complete team records', 'Departmental hierarchy mapping', 'Role-based access permissions'],
      span: 'lg:col-span-6',
      featured: 'light',
    },
    {
      icon: Calendar,
      title: 'Leave Quotas & Approvals',
      badge: 'Instant Workflows',
      desc: 'Real-time tracking of Casual, Sick, and Annual leave balances with instant manager approvals and automatic deductions.',
      bullets: ['Annual quota tracking', 'One-click manager approvals', 'Zero spreadsheet calculations'],
      span: 'lg:col-span-6',
      featured: 'light',
    },
    {
      icon: Megaphone,
      title: 'Company Notice Board',
      badge: 'Broadcast Hub',
      desc: 'Publish company-wide announcements, department updates, or direct personal notices with priority badges.',
      bullets: ['Urgent, High & Normal badges', 'Department-targeted broadcasts', 'Live unread notice counts'],
      span: 'lg:col-span-6',
      featured: 'light',
    },
    {
      icon: CalendarDays,
      title: "Holiday Calendar & Who's On Leave",
      badge: 'Schedule Clarity',
      desc: 'Interactive monthly calendar featuring public holidays and animated popups showing which team members are on leave.',
      bullets: ['Company public holiday schedule', 'Live team out-of-office status', 'Planning & roster visibility'],
      span: 'lg:col-span-6',
      featured: 'light',
    },
  ];

  return (
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
              );
            })}
          </div>
        </div>
      </section>

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
      <LandingFooter />
    </div>
  );
}
