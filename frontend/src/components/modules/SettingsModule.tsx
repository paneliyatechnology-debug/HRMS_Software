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
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Enterprise System Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure company legal entity parameters, working hours, leave policies, and RBAC matrix
          </p>
        </div>

        {savedMessage && (
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" /> Settings Saved Successfully
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'company', label: 'Company Profile' },
          { id: 'schedule', label: 'Working Hours & Shifts' },
          { id: 'leaves', label: 'Leave Policies' },
          { id: 'rbac', label: 'Role & Permissions Matrix (RBAC)' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === t.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-xs space-y-4 max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Organization Identity</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Company Name</label>
              <input
                type="text"
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Corporate Tagline</label>
              <input
                type="text"
                value={companyData.tagline}
                onChange={(e) => setCompanyData({ ...companyData, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Federal Tax EIN</label>
                <input
                  type="text"
                  value={companyData.taxId}
                  onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Currency</label>
                <input
                  type="text"
                  value={companyData.currency}
                  onChange={(e) => setCompanyData({ ...companyData, currency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Headquarters Address</label>
              <input
                type="text"
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <button
              onClick={handleSave}
              className="mt-3 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Save Company Settings
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Working Hours */}
      {activeTab === 'schedule' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-xs space-y-4 max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Shift & Attendance Rules</h3>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Standard Daily Working Hours</label>
                <input
                  type="number"
                  value={scheduleData.workingHoursPerDay}
                  onChange={(e) => setScheduleData({ ...scheduleData, workingHoursPerDay: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Grace Period (Minutes)</label>
                <input
                  type="number"
                  value={scheduleData.gracePeriodMinutes}
                  onChange={(e) => setScheduleData({ ...scheduleData, gracePeriodMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              className="mt-3 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Save Attendance Rules
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Leave Policies */}
      {activeTab === 'leaves' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-xs space-y-4 max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Annual Leave Entitlements</h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-center">
              <span className="text-slate-400 block font-bold">Casual Leave</span>
              <span className="text-xl font-black text-blue-600">12 Days / Year</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-center">
              <span className="text-slate-400 block font-bold">Sick Leave</span>
              <span className="text-xl font-black text-emerald-600">10 Days / Year</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-center">
              <span className="text-slate-400 block font-bold">Paid / Annual</span>
              <span className="text-xl font-black text-purple-600">15 Days / Year</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: RBAC Permissions Matrix */}
      {activeTab === 'rbac' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Role-Based Access Control (RBAC) Permission Matrix
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Feature / Permission</th>
                  <th className="py-3 px-4 text-center">Super Admin</th>
                  <th className="py-3 px-4 text-center">HR Admin</th>
                  <th className="py-3 px-4 text-center">Manager</th>
                  <th className="py-3 px-4 text-center">Employee</th>
                  <th className="py-3 px-4 text-center">Recruiter</th>
                  <th className="py-3 px-4 text-center">Finance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {rbacMatrix.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition">
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {row.module}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.hrAdmin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.manager ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.employee ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.recruiter ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
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
