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
  Smartphone,
  Laptop,
  Tablet,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { Employee } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import { getRoleDefinition } from '../../lib/roleConfig';
import { ChangeRoleModal } from './ChangeRoleModal';
import { getTodayRecordForEmployee, formatSecondsToHMS } from '../../lib/attendanceService';

interface EmployeeProfileModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { portalMode } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [currentEmp, setCurrentEmp] = useState<Employee | null>(employee);

  React.useEffect(() => {
    setCurrentEmp(employee);
  }, [employee]);

  if (!isOpen || !employee || !currentEmp) return null;

  const roleDef = getRoleDefinition(currentEmp.role || 'EMPLOYEE');

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
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col border border-slate-100 overflow-hidden cursor-default">
        {/* Header Profile Hero */}
        <div className="p-6 bg-white border-b border-slate-100 text-slate-900 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-5">
            {employee.avatarUrl ? (
              <img
                src={employee.avatarUrl}
                alt={employee.firstName}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-100 shadow-2xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-semibold text-lg shadow-xs">
                {employee.firstName?.[0] || 'K'}{employee.lastName?.[0] || 'S'}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight">
                  {currentEmp.firstName} {currentEmp.lastName}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                  {currentEmp.employeeCode}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleDef.badgeClass}`}
                >
                  <Shield className="w-3 h-3" />
                  <span>{roleDef.label}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                  {currentEmp.status}
                </span>
              </div>
              <p className="text-slate-500 text-xs font-medium mt-0.5">
                {currentEmp.designationTitle} • {currentEmp.departmentName}
              </p>
              <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {currentEmp.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {currentEmp.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {currentEmp.workLocationName}
                </span>
              </div>
            </div>

            {portalMode === 'admin' && (
              <div className="ml-auto sm:mr-8">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition-all active:scale-95 shadow-2xs"
                  title="Change system access role"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Change Role</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center border-b border-slate-100 px-6 bg-slate-50/60 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700">
          {/* 1. Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Employment Type</span>
                  <p className="text-base font-bold text-slate-900 mt-1">{employee.employmentType}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Joining Date</span>
                  <p className="text-base font-bold text-slate-900 mt-1">{employee.joiningDate}</p>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Net Monthly Salary</span>
                  <p className="text-base font-bold text-slate-900 mt-1">${employee.salary.net.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Core Skills & Competencies</h4>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs">
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
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">Date of Birth</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{employee.dateOfBirth}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">Gender</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{employee.gender}</p>
              </div>
              <div className="col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">Address</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{employee.address}</p>
              </div>
              <div className="col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">Emergency Contact</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {employee.emergencyContact.name} ({employee.emergencyContact.relationship}) — {employee.emergencyContact.phone}
                </p>
              </div>
            </div>
          )}

          {/* 3. Employment */}
          {activeTab === 'employment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">System Access Role</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${roleDef.badgeClass}`}>
                        <Shield className="w-3.5 h-3.5" />
                        <span>{roleDef.label}</span>
                      </span>
                      <span className="text-xs text-slate-600 font-medium">{roleDef.description}</span>
                    </div>
                  </div>
                  {portalMode === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setRoleModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200 shadow-2xs transition"
                    >
                      Change Role
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Reporting Manager</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{currentEmp.reportingManagerName || 'Executive Leadership'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Shift</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{currentEmp.shift}</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Attendance */}
          {activeTab === 'attendance' && (() => {
            const todayRec = getTodayRecordForEmployee(employee.id);
            return (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
                    Today's Punch &amp; Hardware Verification
                  </h4>
                  {todayRec ? (
                    <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="font-bold text-slate-900 text-xs">
                          {todayRec.date} • {todayRec.isCompleted ? 'Shift Completed' : todayRec.isOnBreak ? 'On Break' : 'Active Working'}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {formatSecondsToHMS(todayRec.activeSeconds || 0)} Worked
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Check In Time</span>
                          <p className="font-mono font-bold text-slate-900">{todayRec.checkIn || '—'}</p>
                          {todayRec.checkInPhoto && (
                            <div className="mt-2 flex items-center gap-2">
                              <img
                                src={todayRec.checkInPhoto}
                                alt="Check-in selfie"
                                className="w-10 h-10 rounded-lg object-cover border border-black shadow-xs shrink-0"
                              />
                              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Selfie Verified
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Check Out Time</span>
                          <p className="font-mono font-bold text-slate-900">{todayRec.checkOut || 'Pending'}</p>
                          {todayRec.checkOutPhoto && (
                            <div className="mt-2 flex items-center gap-2">
                              <img
                                src={todayRec.checkOutPhoto}
                                alt="Check-out selfie"
                                className="w-10 h-10 rounded-lg object-cover border border-black shadow-xs shrink-0"
                              />
                              <span className="text-[10px] text-rose-700 font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Selfie Verified
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Device Hardware Info Card */}
                      {todayRec.checkInDevice && (
                        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black text-xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                            {todayRec.checkInDevice.deviceType === 'Mobile' ? (
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-purple-600" />
                            )}
                            Punch Device Hardware Detected
                          </span>
                          <p className="font-black text-slate-900">
                            {todayRec.checkInDevice.deviceModel} ({todayRec.checkInDevice.deviceType})
                          </p>
                          <p className="text-[11px] font-mono text-slate-600">
                            {todayRec.checkInDevice.os} • {todayRec.checkInDevice.browser} • {todayRec.checkInDevice.screenResolution}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      No check-in recorded for today yet.
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
                    Previous Cycle Logs
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">Oct 19, 2026</span>
                      <span className="text-slate-400 ml-2">08:55 AM — 06:05 PM</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold">
                      Present (8.5 hrs)
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 5. Leave */}
          {activeTab === 'leave' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-blue-50 text-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Casual Leave</span>
                  <p className="text-lg font-black text-blue-600 mt-1">10 Left</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Sick Leave</span>
                  <p className="text-lg font-black text-emerald-600 mt-1">9 Left</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 text-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Paid / Annual</span>
                  <p className="text-lg font-black text-purple-600 mt-1">12 Left</p>
                </div>
              </div>
            </div>
          )}

          {/* 6. Payroll */}
          {activeTab === 'payroll' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2">Salary Structure Breakdown</h4>
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
              <div className="p-3 rounded-xl border border-slate-100 flex items-center justify-between">
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
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Q3-Q4 Performance Appraisal</span>
              <p className="text-base font-semibold text-slate-900 mt-1">Score: 4.8 / 5.0 &mdash; Exceeds Expectations</p>
              <p className="text-xs text-slate-600 mt-2">
                &ldquo;Outstanding initiative in design and engineering collaboration with high product velocity.&rdquo;
              </p>
            </div>
          )}

          {/* 9. Training */}
          {activeTab === 'training' && (
            <div className="p-3 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <h5 className="font-bold">Enterprise Cybersecurity & Data Privacy Standards</h5>
                <span className="text-[11px] text-slate-400">Progress: 100% Completed</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold">Certificate Issued</span>
            </div>
          )}

          {/* 10. Assets */}
          {activeTab === 'assets' && (
            <div className="p-3 rounded-xl border border-slate-100 flex items-center justify-between">
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
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">User Profile Authenticated</p>
                  <span className="text-[10px] text-slate-400">Oct 19, 2026 at 08:55 AM (Office Geofence)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Role Modal */}
      <ChangeRoleModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        employee={currentEmp}
        onSuccess={(updated) => {
          setCurrentEmp(updated);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
