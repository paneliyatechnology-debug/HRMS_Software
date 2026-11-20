'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Users,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Shield,
  Lock,
  Sparkles,
  Play,
  Pause,
  UserCheck,
  Building2,
  FileText,
  CreditCard,
  Megaphone,
} from 'lucide-react';
import { LandingNav } from '../../components/landing/LandingNav';
import { LandingFooter } from '../../components/landing/LandingFooter';

export default function PortalsPage() {
  const [activePortalTab, setActivePortalTab] = useState<'employee' | 'admin'>('employee');

  // Real-time ticking shift timer
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
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] text-slate-800 selection:bg-emerald-600 selection:text-white relative overflow-x-hidden font-sans">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[480px] bg-gradient-to-tr from-emerald-300/15 via-teal-200/10 to-emerald-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Shared Navigation */}
      <LandingNav activePage="portals" />

      {/* Hero Header */}
      <section className="relative pt-12 sm:pt-16 pb-12 sm:pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
       

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Tailored Experiences for{' '}
            <span className="text-[#2d6a4f]">Admins &amp; Employees.</span>
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            A single multi-tenant platform with distinct, dedicated workspaces. Company owners manage staff and statutory payroll, while employees enjoy seamless self-service.
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

      {/* Interactive Dual-Portal Showcase */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Switcher Tab Pills */}
          <div className="flex justify-center mb-8 sm:mb-12">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => setActivePortalTab('employee')}
                className={`px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activePortalTab === 'employee'
                    ? 'bg-white text-[#1b4332] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 text-[#2d6a4f]" />
                <span>Employee Self-Service Portal</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePortalTab('admin')}
                className={`px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activePortalTab === 'admin'
                    ? 'bg-white text-[#1b4332] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 text-[#2d6a4f]" />
                <span>Company Owner &amp; HR Admin Console</span>
              </button>
            </div>
          </div>

          {/* Portal Content View */}
          <div className="bg-[#f8f9fa] rounded-3xl border border-slate-200 p-6 sm:p-10 lg:p-12 shadow-xs">
            {activePortalTab === 'employee' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#d8f3dc] text-[#1b4332]">
                    <Clock className="w-3.5 h-3.5 text-[#2d6a4f]" />
                    <span>Employee Autonomy &amp; Speed</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    Instant Clock-in, Break Tracking &amp; Leave Requests.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    Employees can independently clock in/out with live work session timers, pause work for lunch or tea breaks, check remaining leave quotas, and download salary payslips directly without HR dependency.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Personal Live Attendance Hub</h4>
                        <p className="text-[11px] text-slate-500">Live work session counter with real-time break recording.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Leave Quota Visibility &amp; Apply</h4>
                        <p className="text-[11px] text-slate-500">Real-time balance breakdown across Casual, Sick, and Annual leaves.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Payslip Archive &amp; PDF Download</h4>
                        <p className="text-[11px] text-slate-500">View and download transparent monthly payslips anytime.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Interactive Preview Card */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center font-bold">
                        <Clock className="w-5 h-5 text-[#2d6a4f]" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">Live Shift Console</span>
                        <span className="text-[11px] text-slate-500 block">General Shift • 09:00 AM - 06:00 PM</span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        !simulatedClockedIn
                          ? 'bg-slate-100 text-slate-600'
                          : simulatedOnBreak
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {!simulatedClockedIn ? 'CLOCKED OUT' : simulatedOnBreak ? 'ON BREAK' : 'CLOCKED IN'}
                    </span>
                  </div>

                  {/* Interactive Timer Display */}
                  <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Elapsed Work Time</p>
                    <p className="font-mono text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {formatTimer(timerSeconds)}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSimulatedClockedIn(!simulatedClockedIn)}
                      className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        simulatedClockedIn
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-[#1b4332] hover:bg-[#2d6a4f] text-white shadow-xs'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>{simulatedClockedIn ? 'Clock Out' : 'Clock In'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={!simulatedClockedIn}
                      onClick={() => setSimulatedOnBreak(!simulatedOnBreak)}
                      className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        !simulatedClockedIn
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                          : simulatedOnBreak
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {simulatedOnBreak ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      <span>{simulatedOnBreak ? 'Resume Work' : 'Take Break'}</span>
                    </button>
                  </div>

                  {/* Leave Quota Snapshot */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                      Your Leave Quotas
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Annual</span>
                        <span className="text-sm font-black text-slate-900">14/18</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Casual</span>
                        <span className="text-sm font-black text-slate-900">06/08</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Sick</span>
                        <span className="text-sm font-black text-slate-900">07/07</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#d8f3dc] text-[#1b4332]">
                    <Shield className="w-3.5 h-3.5 text-[#2d6a4f]" />
                    <span>Company Control &amp; Authority</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    Complete Organization Oversight &amp; Statutory Governance.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    Company Owners and HR Managers gain full administrative command. Approve employee leaves, monitor live attendance punches across departments, compute monthly salaries with PF/ESIC deductions, and broadcast company notices.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Employee Management &amp; Onboarding</h4>
                        <p className="text-[11px] text-slate-500">Create employee accounts, assign designations, and configure shifts.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Statutory Payroll Calculations</h4>
                        <p className="text-[11px] text-slate-500">One-click monthly payroll generation with statutory deductions.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Megaphone className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Broadcast Notice Engine</h4>
                        <p className="text-[11px] text-slate-500">Publish urgent company notices, department memos, and policy updates.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Admin Preview Mockup */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1b4332] text-white flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5 text-[#d8f3dc]" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">Admin Command Console</span>
                        <span className="text-[11px] text-slate-500 block">Workspace Management &amp; Approvals</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ADMIN PRIVILEGES
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Leave Approvals Queue</p>
                          <p className="text-[11px] text-slate-500">Instant approve or reject with comments</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700">1-Click</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                          <Clock className="w-4 h-4 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Live Team Attendance Roster</p>
                          <p className="text-[11px] text-slate-500">Track on-duty, on-break &amp; absent staff</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-700">Live Sync</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                          <FileText className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Monthly Statutory Payroll</p>
                          <p className="text-[11px] text-slate-500">Automatic PF, ESIC &amp; PT deductions</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-700">Automated</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Ready to Onboard Your Organization?
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
      <LandingFooter />
    </div>
  );
}
