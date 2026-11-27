'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
<<<<<<< HEAD
=======
  Users,
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  Clock,
  ArrowRight,
  CheckCircle2,
  Lock,
<<<<<<< HEAD
=======
  Sparkles,
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  ShieldCheck,
  Settings,
  CreditCard,
  UserPlus,
} from 'lucide-react';
import { LandingNav } from '../../components/landing/LandingNav';
import { LandingFooter } from '../../components/landing/LandingFooter';
<<<<<<< HEAD
import { Tilt3D, Reveal3D, Ambient3DScene, BottomCta3D } from '../../components/landing/Motion3D';
=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Register Company Workspace',
      subtitle: 'Instant Provisioning & Account Creation',
      icon: Building2,
      desc: 'Provide your company name, official corporate email, and owner credentials to provision an isolated workspace with strict tenant security.',
      points: [
        'Secure multi-tenant data boundary provisioning',
        'Company Owner master administrator credentials',
        'Optional GSTIN and business registration verification',
      ],
    },
    {
      number: '02',
      title: 'Configure Shifts, Hierarchy & Policies',
      subtitle: 'Tailored Organization Settings',
      icon: Settings,
      desc: 'Define your working shifts, departmental hierarchy, designations, break policies (lunch & tea), and annual leave quota allocation.',
      points: [
        'Custom shift timings & grace period setup',
        'Departmental structure & reporting hierarchy',
        'Annual leave quota allocation (Casual, Sick, Annual)',
      ],
    },
    {
      number: '03',
      title: 'Add Staff, Track Shifts & Run Payroll',
      subtitle: 'Autonomous Daily Operations',
      icon: UserPlus,
      desc: 'Add team members with their employee codes. Staff clock in/out daily with real-time break tracking, and monthly payroll is computed in one click.',
      points: [
        'Employee invitation via email, phone, or code',
        'Live second-by-second shift session counter',
        'One-click statutory payroll with PF, ESIC, and PT calculation',
      ],
    },
  ];

  return (
<<<<<<< HEAD
    <div className="min-h-screen w-full bg-[#f8f9fa] text-slate-800 selection:bg-emerald-600 selection:text-white relative overflow-x-clip font-sans">
      <Ambient3DScene />
      <LandingNav activePage="how-it-works" />

      {/* 3D Hero Header */}
      <section className="relative pt-12 sm:pt-16 pb-12 sm:pb-16 text-center">
        <Reveal3D className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Up and Running in{' '}
              <span className="text-[#2d6a4f]">3 Simple Steps.</span>
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              From company workspace registration to daily attendance and automated payroll calculations. No complex hardware, zero complicated onboarding.
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
        </Reveal3D>
      </section>

      {/* 3D Vertical Spine Timeline */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div
            aria-hidden="true"
            className="hidden md:block absolute left-14 top-10 bottom-10 w-0.5 bg-gradient-to-b from-[#2d6a4f]/40 via-[#95d5b2] to-[#2d6a4f]/40"
          />

          <div className="space-y-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <Reveal3D key={step.number} delayMs={idx * 90}>
                  <Tilt3D intensity={5} glare>
                    <div className="p-6 sm:p-9 rounded-3xl bg-[#f8f9fa] border border-slate-200/90 hover:border-[#95d5b2] shadow-[0_12px_28px_-10px_rgba(15,23,42,0.08)] hover:shadow-[0_24px_46px_-14px_rgba(27,67,50,0.18)] transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8 relative">
                      <div
                        style={{ transform: 'translateZ(28px)' }}
                        className="flex md:flex-col items-center gap-3 shrink-0"
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-[0_10px_22px_-6px_rgba(27,67,50,0.45)]">
                          {step.number}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex items-center justify-center font-bold">
                          <Icon className="w-5 h-5 text-[#2d6a4f]" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div>
                          <span className="text-[11px] font-bold text-[#2d6a4f] uppercase tracking-wider block">
                            {step.subtitle}
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            {step.title}
                          </h3>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                          {step.desc}
                        </p>

                        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-700 font-medium">
                          {step.points.map((pt, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-200/70"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0 mt-0.5" />
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Tilt3D>
                </Reveal3D>
              );
            })}
=======
    <div className="min-h-screen w-full bg-[#f8f9fa] text-slate-800 selection:bg-emerald-600 selection:text-white relative overflow-x-hidden font-sans">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[480px] bg-gradient-to-tr from-emerald-300/15 via-teal-200/10 to-emerald-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Shared Navigation */}
      <LandingNav activePage="how-it-works" />

      {/* Hero Header */}
      <section className="relative pt-12 sm:pt-16 pb-12 sm:pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Up and Running in{' '}
            <span className="text-[#2d6a4f]">3 Simple Steps.</span>
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            From company workspace registration to daily attendance and automated payroll calculations. No complex hardware, zero complicated onboarding.
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
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* 3D Trust Highlights */}
      <section className="py-14 bg-[#f8f9fa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal3D>
            <div className="text-center mb-10 space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Why Companies Trust MyOwn HRMS
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Enterprise architecture engineered for scale, statutory compliance, and simplicity.
              </p>
            </div>
          </Reveal3D>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-center">
            {[
              {
                icon: Clock,
                title: 'Zero Time Theft',
                desc: 'Live work session clocks and geofenced checks eliminate attendance fraud.',
              },
              {
                icon: CreditCard,
                title: '100% Statutory Compliant',
                desc: 'Pre-programmed with Indian statutory PF, ESIC, and Professional Tax formulas.',
              },
              {
                icon: ShieldCheck,
                title: 'Strict Data Privacy',
                desc: 'Every organization gets an isolated workspace with 256-bit SSL encryption.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Reveal3D key={item.title} delayMs={idx * 75}>
                  <Tilt3D intensity={8} glare className="h-full">
                    <div className="h-full p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_10px_24px_-10px_rgba(15,23,42,0.08)] space-y-2.5">
                      <div
                        style={{ transform: 'translateZ(24px)' }}
                        className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-700 flex items-center justify-center mx-auto font-bold"
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </Tilt3D>
                </Reveal3D>
              );
            })}
=======
      {/* 3 Step Walkthrough Cards */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-10 rounded-3xl bg-[#f8f9fa] border border-slate-200 hover:border-[#95d5b2] transition-all duration-300 shadow-2xs hover:shadow-md flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8 group"
              >
                {/* Number & Icon badge */}
                <div className="flex md:flex-col items-center gap-3 shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform">
                    {step.number}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5 text-[#2d6a4f]" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-[#2d6a4f] uppercase tracking-wider block">
                      {step.subtitle}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    {step.desc}
                  </p>

                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 font-medium">
                    {step.points.map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Highlights Row */}
      <section className="py-14 bg-[#f8f9fa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Why Companies Trust MyOwn HRMS
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Enterprise architecture engineered for scale, statutory compliance, and simplicity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-center">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto font-bold">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Zero Time Theft</h4>
              <p className="text-xs text-slate-500">Live work session clocks and geofenced checks eliminate attendance fraud.</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto font-bold">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">100% Statutory Compliant</h4>
              <p className="text-xs text-slate-500">Pre-programmed with Indian statutory PF, ESIC, and Professional Tax formulas.</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Strict Data Privacy</h4>
              <p className="text-xs text-slate-500">Every organization gets an isolated workspace with 256-bit SSL encryption.</p>
            </div>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
          </div>
        </div>
      </section>

<<<<<<< HEAD
      <BottomCta3D
        title="Ready to Setup Your Company Workspace?"
        subtitle="Register your company workspace today or sign in to experience effortless attendance, leave approvals, and employee self-service."
      />
=======
      {/* Bottom CTA Banner */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Ready to Setup Your Company Workspace?
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
