'use client';

import React, { useState } from 'react';
import { Settings, Shield, Clock, Calendar, DollarSign, Check, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SettingsModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'company' | 'schedule' | 'leaves' | 'rbac'>('company');

  const [companyData, setCompanyData] = useState({
    name: 'Paneliya Technology Inc.',
    tagline: 'Enterprise Cloud & Next-Gen Software Engineering',
    taxId: 'US-EIN-984102941',
    supportEmail: 'support@paneliya.com',
    phone: '+1 (415) 555-0199',
    currency: 'USD ($)',
    address: '100 Silicon Vista Blvd, Suite 800, San Francisco, CA 94105',
  });

  const [scheduleData, setScheduleData] = useState({
    defaultShift: '09:00 AM - 06:00 PM',
    gracePeriodMinutes: 15,
    halfDayHours: 4,
    workingHoursPerDay: 8,
  });

  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const rbacMatrix = [
    { module: 'Employee Directory', superAdmin: true, hrAdmin: true, manager: true, employee: false, recruiter: false, finance: false },
    { module: 'Employee Edit / Delete', superAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: false, finance: false },
    { module: 'Attendance Regularization', superAdmin: true, hrAdmin: true, manager: true, employee: false, recruiter: false, finance: false },
    { module: 'Leave Approvals', superAdmin: true, hrAdmin: true, manager: true, employee: false, recruiter: false, finance: false },
    { module: 'Monthly Payroll Runs', superAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: false, finance: true },
    { module: 'Job & Candidate Pipeline', superAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: true, finance: false },
    { module: 'Hardware Assets', superAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: false, finance: false },
    { module: 'System Audit Logs', superAdmin: true, hrAdmin: true, manager: false, employee: false, recruiter: false, finance: false },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Settings & Permissions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure company legal entity parameters, working hours, and RBAC matrix
          </p>
        </div>

        {savedMessage && (
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-xs flex items-center gap-1.5 border border-emerald-100">
            <Check className="w-3.5 h-3.5" /> Changes Saved Successfully
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'company', label: 'Company Profile' },
          { id: 'schedule', label: 'Working Hours & Shifts' },
          { id: 'leaves', label: 'Leave Policies' },
          { id: 'rbac', label: 'Role Permissions (RBAC)' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-1.5 rounded-full transition ${
              activeTab === t.id
                ? 'bg-blue-50 text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900">Organization Identity</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium mb-1 text-slate-700">Company Name</label>
              <input
                type="text"
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700">Corporate Tagline</label>
              <input
                type="text"
                value={companyData.tagline}
                onChange={(e) => setCompanyData({ ...companyData, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700">Federal Tax EIN</label>
                <input
                  type="text"
                  value={companyData.taxId}
                  onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700">Currency</label>
                <input
                  type="text"
                  value={companyData.currency}
                  onChange={(e) => setCompanyData({ ...companyData, currency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700">Headquarters Address</label>
              <input
                type="text"
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              onClick={handleSave}
              className="mt-3 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition active:scale-95"
            >
              Save Company Settings
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Working Hours */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900">Shift & Attendance Rules</h3>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1 text-slate-700">Standard Daily Working Hours</label>
                <input
                  type="number"
                  value={scheduleData.workingHoursPerDay}
                  onChange={(e) => setScheduleData({ ...scheduleData, workingHoursPerDay: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-700">Grace Period (Minutes)</label>
                <input
                  type="number"
                  value={scheduleData.gracePeriodMinutes}
                  onChange={(e) => setScheduleData({ ...scheduleData, gracePeriodMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              className="mt-3 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition active:scale-95"
            >
              Save Attendance Rules
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Leave Policies */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900">Annual Leave Entitlements</h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-slate-400 block font-semibold">Casual Leave</span>
              <span className="text-lg font-bold text-blue-600 mt-1 block">12 Days / Year</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-slate-400 block font-semibold">Sick Leave</span>
              <span className="text-lg font-bold text-emerald-600 mt-1 block">10 Days / Year</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-slate-400 block font-semibold">Paid / Annual</span>
              <span className="text-lg font-bold text-purple-600 mt-1 block">15 Days / Year</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: RBAC Permissions Matrix */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            Role-Based Access Control (RBAC) Permission Matrix
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Feature / Permission</th>
                  <th className="py-2.5 px-3 text-center">Super Admin</th>
                  <th className="py-2.5 px-3 text-center">HR Admin</th>
                  <th className="py-2.5 px-3 text-center">Manager</th>
                  <th className="py-2.5 px-3 text-center">Employee</th>
                  <th className="py-2.5 px-3 text-center">Recruiter</th>
                  <th className="py-2.5 px-3 text-center">Finance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rbacMatrix.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {row.module}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.hrAdmin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.manager ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.employee ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.recruiter ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.finance ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
