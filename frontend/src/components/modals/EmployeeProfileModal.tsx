'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  CalendarCheck,
  CalendarOff,
  CreditCard,
  FileText,
  TrendingUp,
  GraduationCap,
  HardDrive,
  History,
  Phone,
  Mail,
  MapPin,
  Building,
  Shield,
  Download,
} from 'lucide-react';
import { Employee } from '../../types/hrms';

interface EmployeeProfileModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !employee) return null;

  const tabs = [
    { id: 'overview', label: '1. Overview', icon: User },
    { id: 'personal', label: '2. Personal Info', icon: User },
    { id: 'employment', label: '3. Employment', icon: Briefcase },
    { id: 'attendance', label: '4. Attendance', icon: CalendarCheck },
    { id: 'leave', label: '5. Leave', icon: CalendarOff },
    { id: 'payroll', label: '6. Payroll', icon: CreditCard },
    { id: 'documents', label: '7. Documents', icon: FileText },
    { id: 'performance', label: '8. Performance', icon: TrendingUp },
    { id: 'training', label: '9. Training', icon: GraduationCap },
    { id: 'assets', label: '10. Assets', icon: HardDrive },
    { id: 'activity', label: '11. Activity History', icon: History },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full h-[90vh] shadow-2xl flex flex-col border border-slate-100 dark:border-slate-800 overflow-hidden cursor-default">
        {/* Header Profile Hero */}
        <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-5">
            <img
              src={employee.avatarUrl}
              alt={employee.firstName}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black">
                  {employee.firstName} {employee.lastName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
                  {employee.employeeCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-xs font-bold">
                  {employee.status}
                </span>
              </div>
              <p className="text-blue-100 text-sm font-medium mt-1">
                {employee.designationTitle} • {employee.departmentName}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-blue-200 mt-2">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {employee.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {employee.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {employee.workLocationName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-850 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 dark:text-slate-300">
          {/* 1. Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Employment Type</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1">{employee.employmentType}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-slate-800 border border-emerald-100 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Joining Date</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1">{employee.joiningDate}</p>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-slate-800 border border-purple-100 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Net Monthly Salary</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1">${employee.salary.net.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">Core Skills & Competencies</h4>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. Personal Information */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase text-slate-400">Date of Birth</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{employee.dateOfBirth}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase text-slate-400">Gender</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{employee.gender}</p>
              </div>
              <div className="col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase text-slate-400">Address</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{employee.address}</p>
              </div>
              <div className="col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase text-slate-400">Emergency Contact</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {employee.emergencyContact.name} ({employee.emergencyContact.relationship}) — {employee.emergencyContact.phone}
                </p>
              </div>
            </div>
          )}

          {/* 3. Employment */}
          {activeTab === 'employment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Reporting Manager</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{employee.reportingManagerName || 'Executive Leadership'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Shift</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{employee.shift}</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Attendance */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Recent attendance punch entries for current cycle:</p>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Oct 19, 2026</span>
                  <span className="text-slate-400 ml-2">08:55 AM — 06:05 PM</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold">Present (8.5 hrs)</span>
              </div>
            </div>
          )}

          {/* 5. Leave */}
          {activeTab === 'leave' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Casual Leave</span>
                  <p className="text-lg font-black text-blue-600 mt-1">10 Left</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Sick Leave</span>
                  <p className="text-lg font-black text-emerald-600 mt-1">9 Left</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Paid / Annual</span>
                  <p className="text-lg font-black text-purple-600 mt-1">12 Left</p>
                </div>
              </div>
            </div>
          )}

          {/* 6. Payroll */}
          {activeTab === 'payroll' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Salary Structure Breakdown</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-slate-500">Basic Salary:</span>
                  <span className="font-bold">${employee.salary.basic.toLocaleString()}</span>
                  <span className="text-slate-500">HRA Allowance:</span>
                  <span className="font-bold">${employee.salary.hra.toLocaleString()}</span>
                  <span className="text-slate-500">Special Allowances:</span>
                  <span className="font-bold">${employee.salary.allowances.toLocaleString()}</span>
                  <span className="text-slate-500">PF Deduction (12%):</span>
                  <span className="font-bold text-rose-500">-${employee.salary.pf.toLocaleString()}</span>
                  <span className="text-slate-500">Net Take-Home:</span>
                  <span className="font-extrabold text-emerald-600 text-sm">${employee.salary.net.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* 7. Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h5 className="font-bold">Passport & Identity Document.pdf</h5>
                  <span className="text-[11px] text-slate-400">Verified by HR • 2.4 MB</span>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          )}

          {/* 8. Performance */}
          {activeTab === 'performance' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500">Q3-Q4 Performance Appraisal</span>
              <p className="text-lg font-black text-amber-500 mt-1">★ 4.8 / 5.0 (Exceeds Expectations)</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                &ldquo;Outstanding initiative in design and engineering collaboration with high product velocity.&rdquo;
              </p>
            </div>
          )}

          {/* 9. Training */}
          {activeTab === 'training' && (
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h5 className="font-bold">Enterprise Cybersecurity & Data Privacy Standards</h5>
                <span className="text-[11px] text-slate-400">Progress: 100% Completed</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold">Certificate Issued</span>
            </div>
          )}

          {/* 10. Assets */}
          {activeTab === 'assets' && (
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h5 className="font-bold">MacBook Pro 16&quot; M3 Max (36GB, 1TB)</h5>
                <span className="text-[11px] text-slate-400">Tag: AST-MBP-001 • Condition: Excellent</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-bold">Assigned</span>
            </div>
          )}

          {/* 11. Activity History */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">User Profile Authenticated</p>
                  <span className="text-[10px] text-slate-400">Oct 19, 2026 at 08:55 AM (Office Geofence)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
