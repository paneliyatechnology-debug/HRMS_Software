'use client';

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  AlertCircle,
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { loginAsAdmin, loginAsEmployee } = useAuth();
  const [activeTab, setActiveTab] = useState<'admin' | 'employee'>('admin');

  // Form states
  const [adminIdentifier, setAdminIdentifier] = useState('keyur.sangani1234@gmail.com');
  const [adminPassword, setAdminPassword] = useState('123456789');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [empIdentifier, setEmpIdentifier] = useState('EMP-2');
  const [empPassword, setEmpPassword] = useState('123456');
  const [showEmpPassword, setShowEmpPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await loginAsAdmin(adminIdentifier, adminPassword);
      if (!res.success) {
        setErrorMessage(res.message || 'Invalid administrator credentials');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await loginAsEmployee(empIdentifier, empPassword);
      if (!res.success) {
        setErrorMessage(res.message || 'Employee record not found');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Paneliya HRMS</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your workplace account</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-7">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMessage(null);
              }}
              className={`flex-1 pb-3 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('employee');
                setErrorMessage(null);
              }}
              className={`flex-1 pb-3 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'employee'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Employee Login</span>
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'admin' ? (
            /* ========================================================== */
            /* ADMIN LOGIN                                                */
            /* ========================================================== */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700">Password</label>
                  <span className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer">
                    Forgot?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-9 pr-10 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In as Administrator'}
              </button>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Demo Admin: Keyur Sangani</span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminIdentifier('keyur.sangani1234@gmail.com');
                    setAdminPassword('123456789');
                  }}
                  className="font-medium text-slate-900 hover:underline"
                >
                  Autofill
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================== */
            /* EMPLOYEE LOGIN                                             */
            /* ========================================================== */
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Employee ID or Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={empIdentifier}
                    onChange={(e) => setEmpIdentifier(e.target.value)}
                    placeholder="e.g. EMP-2 or name@company.com"
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700">Password / PIN</label>
                  <span className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer">
                    Need help?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showEmpPassword ? 'text' : 'password'}
                    required
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-9 pr-10 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmpPassword(!showEmpPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEmpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In as Employee'}
              </button>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Demo Employee: Rahul (EMP-2)</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmpIdentifier('EMP-2');
                    setEmpPassword('123456');
                  }}
                  className="font-medium text-slate-900 hover:underline"
                >
                  Autofill
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Paneliya Technology HR Management System
        </p>
      </div>
    </div>
  );
};
