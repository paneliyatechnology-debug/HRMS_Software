'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { loginAsSuperAdmin, isAuthenticated, user } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated as SUPER_ADMIN, redirect to /superadmin
  useEffect(() => {
    if (isAuthenticated && user?.role === 'SUPER_ADMIN') {
      router.push('/superadmin');
    }
  }, [isAuthenticated, user?.role, router]);

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await loginAsSuperAdmin(identifier, password);
      if (!res.success) {
        setErrorMessage(res.message || 'Invalid Super Admin credentials. Master access denied.');
      } else {
        setSuccessMessage('Super Admin authenticated successfully! Entering console...');
        setTimeout(() => {
          router.push('/superadmin');
        }, 300);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative select-none">
      <div className="w-full max-w-md transition-all duration-300 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-700 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-50">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Own HRMS
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Super Administrator Master Console
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/90 p-6 sm:p-7">
          {/* Role Header Pill matching standard login tab aesthetic */}
          <div className="bg-slate-100 p-1 rounded-2xl mb-5 text-xs font-semibold">
            <div className="py-2.5 px-3 rounded-xl text-center bg-white text-indigo-950 font-bold shadow-xs flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Super Administrator</span>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form
            onSubmit={handleLoginSubmit}
            className="space-y-4"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          >
            {/* Master Identifier Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Super Admin Email / Master ID
                </label>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-superadmin-identifier"
                  name="paneliya_superadmin_user"
                  type="text"
                  required
                  autoComplete="one-time-code"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="keyursangani1210@gmail.com"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Master Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Master Password
                </label>
                <span className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer">
                  Security Recovery
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-superadmin-password"
                  name="paneliya_superadmin_key"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all bg-slate-50/50 focus:bg-white"
                />
                <button
                  id="btn-toggle-superadmin-password"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-superadmin-login"
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Master Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Super Admin Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switcher Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Not a platform super administrator?{' '}
              <button
                id="link-switch-to-workspace"
                type="button"
                onClick={() => router.push('/')}
                className="font-bold text-indigo-600 hover:underline"
              >
                Go to Company Login
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">
          My Own HRMS Enterprise • Real-Time Cloud HRMS
        </p>
      </div>
    </div>
  );
}
