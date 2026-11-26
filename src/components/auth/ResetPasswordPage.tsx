'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/api';

export const ResetPasswordPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('Reset token is missing or invalid. Please check your reset link.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({
        token,
        password,
        confirmPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-emerald-50/50 via-slate-50 to-teal-50/30 overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Architectural Grid Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none z-0" />

      {/* Top Bar Header */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between z-10 py-2">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur hover:bg-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Sign In</span>
        </button>
      </header>

      {/* Main Center Form Area */}
      <main className="w-full flex-1 flex flex-col justify-center items-center py-6 z-10 animate-module-fade-in">
        <div className="w-full max-w-md transition-all duration-300">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex items-center justify-center mx-auto mb-3.5 shadow-xl shadow-emerald-900/15 border border-emerald-400/30 ring-4 ring-emerald-500/10">
              <Building2 className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Own HRMS
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Unified Workspace • Account Security
            </p>
          </div>

          {/* Luxury Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(5,150,105,0.08),0_1px_3px_rgba(0,0,0,0.05)] p-6 sm:p-9">
            {isSuccess ? (
              <div className="py-2 text-center animate-in fade-in zoom-in-95 duration-200 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Password Reset Complete
                  </h2>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Your account password has been successfully updated. You can now sign in with your new password.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Choose a new password
                </h2>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  Enter the password you want to use for this account.
                </p>

                {errorMessage && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                  {/* New Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="new-password-input" className="text-xs font-bold text-slate-700">
                        New password
                      </label>
                    </div>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="new-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-12 pl-11 pr-11 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="w-10 h-10 rounded-lg flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Must be at least 6 characters.</p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="confirm-password-input" className="text-xs font-bold text-slate-700">
                        Confirm password
                      </label>
                    </div>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="confirm-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-12 pl-11 pr-11 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="w-10 h-10 rounded-lg flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Passwords do not match.</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 group whitespace-nowrap shrink-0"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Save password</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="pt-4 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="text-xs text-slate-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Workspace Login</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit SSL Encrypted • Workspace Security</span>
          </div>
        </div>
      </main>
    </div>
  );
};
export default ResetPasswordPage;
