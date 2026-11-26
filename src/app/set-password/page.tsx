'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { validatePassword, validatePasswordMatch } from '../../lib/validation';
import { useAuth } from '../../context/AuthContext';

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const queryToken = searchParams?.get('token') || '';
  const queryEmail = searchParams?.get('email') || '';
  const queryUserId = searchParams?.get('id') || searchParams?.get('userId') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Compute password strength score (0 to 4)
  const computeStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = computeStrength(newPassword);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-600'];

  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const errors: Record<string, string> = {};

    const passCheck = validatePassword(newPassword, 6);
    if (!passCheck.isValid) {
      errors.newPassword = passCheck.error || 'Password must be at least 6 characters.';
    }

    const matchCheck = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchCheck.isValid) {
      errors.confirmPassword = matchCheck.error || 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await api.resetPassword({
        password: newPassword,
        confirmPassword,
        token: queryToken || undefined,
        email: queryEmail || user?.email || undefined,
        userId: queryUserId || user?.id || undefined,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to set password. Please try again or contact your administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] flex flex-col justify-between items-center px-4 sm:px-6 py-6 sm:py-10 relative selection:bg-emerald-600 selection:text-white">
      {/* Background Accent Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[340px] bg-gradient-to-tr from-emerald-300/15 via-teal-200/10 to-emerald-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between z-20 mb-4 sm:mb-6">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-emerald-300 px-3.5 py-2 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-600" />
          <span>Back to Sign In</span>
        </button>

        <span className="text-[11px] font-bold text-emerald-800 bg-[#d8f3dc] px-2.5 py-1 rounded-full border border-[#95d5b2] inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1b4332]" />
          <span>Secure Password Reset</span>
        </span>
      </header>

      {/* Main Center Card */}
      <main className="w-full flex-1 flex flex-col justify-center items-center z-10 max-w-md">
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-8">
          {/* Card Brand Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <KeyRound className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {isSuccess ? 'Password Reset Successful' : 'Set New Password'}
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
              {isSuccess
                ? 'Your password has been securely updated. You can now log in with your new credentials.'
                : 'Create and confirm a new password for your Paneliya HRMS account.'}
            </p>
          </div>

          {/* Success View */}
          {isSuccess ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Password Updated Successfully!</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Your account has been secured with your new password. Click below to proceed to the login page.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full h-11 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Reset Form View */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (fieldErrors.newPassword) {
                        setFieldErrors((prev) => {
                          const cp = { ...prev };
                          delete cp.newPassword;
                          return cp;
                        });
                      }
                    }}
                    placeholder="Enter at least 6 characters"
                    className={`w-full h-10.5 pl-9 pr-10 text-xs font-medium rounded-xl border bg-slate-50 text-slate-900 focus:bg-white focus:outline-none transition-all ${
                      fieldErrors.newPassword
                        ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                        : 'border-slate-200 focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 absolute right-1.5 top-1.5 cursor-pointer"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">Strength:</span>
                      <span
                        className={`font-bold ${
                          strengthScore <= 1
                            ? 'text-rose-600'
                            : strengthScore === 2
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                        }`}
                      >
                        {strengthLabels[strengthScore - 1] || 'Too Short'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full transition-all duration-300 ${
                            strengthScore >= step
                              ? strengthColors[strengthScore - 1] || 'bg-slate-200'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {fieldErrors.newPassword && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.newPassword}</span>
                  </p>
                )}
              </div>

              {/* Re-enter Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Re-enter Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => {
                          const cp = { ...prev };
                          delete cp.confirmPassword;
                          return cp;
                        });
                      }
                    }}
                    placeholder="Re-enter your new password"
                    className={`w-full h-10.5 pl-9 pr-10 text-xs font-medium rounded-xl border bg-slate-50 text-slate-900 focus:bg-white focus:outline-none transition-all ${
                      fieldErrors.confirmPassword || passwordsMismatch
                        ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                        : passwordsMatch
                          ? 'border-emerald-500 focus:border-emerald-600 ring-1 ring-emerald-200'
                          : 'border-slate-200 focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 absolute right-1.5 top-1.5 cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Match indicator */}
                {passwordsMatch && (
                  <p className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Passwords match</span>
                  </p>
                )}
                {passwordsMismatch && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Passwords do not match</span>
                  </p>
                )}
                {fieldErrors.confirmPassword && !passwordsMismatch && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword || passwordsMismatch}
                className="w-full h-11 mt-2 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-md text-center z-10 mt-4 text-[11px] text-slate-400">
        <p>Paneliya HRMS &bull; Enterprise Workforce Security</p>
      </footer>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-[#f8f9fa] flex items-center justify-center">
          <div className="w-8 h-8 border-[3px] border-emerald-200 border-t-[#2d6a4f] rounded-full animate-spin" />
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
