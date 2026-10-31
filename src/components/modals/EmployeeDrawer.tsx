'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, ChevronRight, ChevronLeft, Camera, Upload, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Employee, Department, Designation, Role } from '../../types/hrms';
import { getCompanySubscription } from '../../lib/subscriptionService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getAllCompanies } from '../../lib/companyService';
import { compressImage, validateImageFile } from '../../lib/imageUtils';
import {
  validateEmail,
  validatePhone,
  validateName,
  validatePassword,
  cleanPhoneNumber,
  checkDuplicateEmailOrPhone,
} from '../../lib/validation';

interface EmployeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  departments: Department[];
  designations: Designation[];
  employees?: Employee[];
}

export const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({
  isOpen,
  onClose,
  onRefresh,
  departments,
  designations,
  employees = [],
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const allComps = getAllCompanies();
  const currentCompany =
    allComps.find(
      (c) =>
        c.id === user?.companyId ||
        c.adminUser?.email?.toLowerCase() === user?.email?.toLowerCase()
    ) || allComps[0];
  const adminCompanyId = user?.companyId || currentCompany?.id || 'comp-paneliya';
  const adminCompanyName = user?.companyName || currentCompany?.name || 'Paneliya Technology Inc.';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [nextEmployeeCode, setNextEmployeeCode] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      api.getNextEmployeeCode(adminCompanyId)
        .then((res) => {
          if (res?.nextCode) setNextEmployeeCode(res.nextCode);
        })
        .catch((err) => console.warn('Could not fetch next employee code:', err));
    }
  }, [isOpen, adminCompanyId]);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male' as const,
    dateOfBirth: '1995-05-15',
    address: '',
    departmentId: departments[0]?.id || 'dept-1',
    designationId: designations[0]?.id || 'des-3',
    employmentType: 'Full-time' as const,
    workLocationId: 'loc-1',
    shift: 'General Shift (9 AM - 6 PM)',
    basicSalary: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
    taxId: '',
    initialPassword: '',
    role: 'EMPLOYEE' as Role,
    avatarUrl: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setFormError(null);
    try {
      // Validate Basic Info
      const fNameCheck = validateName(formData.firstName, 'First Name', 2);
      if (!fNameCheck.isValid) {
        const msg = fNameCheck.error || 'First Name is required (minimum 2 characters).';
        setFormError(msg);
        showToast({ type: 'error', title: 'First Name Required', message: msg });
        setStep(1);
        setLoading(false);
        return;
      }

      const lNameCheck = validateName(formData.lastName, 'Last Name', 2);
      if (!lNameCheck.isValid) {
        const msg = lNameCheck.error || 'Last Name is required (minimum 2 characters).';
        setFormError(msg);
        showToast({ type: 'error', title: 'Last Name Required', message: msg });
        setStep(1);
        setLoading(false);
        return;
      }

      const emailCheck = validateEmail(formData.email, true);
      if (!emailCheck.isValid) {
        const msg = emailCheck.error || 'Please enter a valid employee work email.';
        setFormError(msg);
        showToast({ type: 'error', title: 'Invalid Email', message: msg });
        setStep(1);
        setLoading(false);
        return;
      }

      const phoneCheck = validatePhone(formData.phone, true);
      if (!phoneCheck.isValid) {
        const msg = phoneCheck.error || 'Please enter a valid 10-digit mobile number.';
        setFormError(msg);
        showToast({ type: 'error', title: 'Invalid Mobile Number', message: msg });
        setStep(1);
        setLoading(false);
        return;
      }

      // Strict Uniqueness: 1 Email = 1 Account & 1 Mobile Number = 1 Account
      const freshEmployees = employees && employees.length > 0 ? employees : await api.getEmployees().catch(() => []);
      const dupCheck = checkDuplicateEmailOrPhone({
        email: formData.email,
        phone: formData.phone,
        existingEmployees: freshEmployees,
        currentUserEmail: user?.email,
        currentUserPhone: (user as any)?.phone,
      });
      if (!dupCheck.isValid) {
        const msg = dupCheck.error || 'Duplicate email or phone detected.';
        setFormError(msg);
        showToast({ type: 'error', title: 'Duplicate Detected', message: msg });
        setStep(1);
        setLoading(false);
        return;
      }

      if (formData.initialPassword) {
        const passCheck = validatePassword(formData.initialPassword, 6);
        if (!passCheck.isValid) {
          const msg = passCheck.error || 'Password must be at least 6 characters long.';
          setFormError(msg);
          showToast({ type: 'error', title: 'Password Too Short', message: msg });
          setStep(1);
          setLoading(false);
          return;
        }
      }

      if (formData.emergencyPhone) {
        const emCheck = validatePhone(formData.emergencyPhone, false);
        if (!emCheck.isValid) {
          const msg = emCheck.error || 'Invalid emergency contact phone number.';
          setFormError(msg);
          showToast({ type: 'error', title: 'Invalid Emergency Phone', message: msg });
          setStep(3);
          setLoading(false);
          return;
        }
      }

      const selectedDept = departments.find((d) => d.id === formData.departmentId) || departments[0];
      const selectedDes = designations.find((d) => d.id === formData.designationId) || designations[0];
      const basicNum = Number(formData.basicSalary) || 0;

      const employeePayload: Partial<Employee> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.initialPassword || '',
        role: formData.role || 'EMPLOYEE',
        avatarUrl: formData.avatarUrl,
        companyId: adminCompanyId,
        companyName: adminCompanyName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        departmentId: formData.departmentId || selectedDept?.id || '',
        departmentName: selectedDept?.name || '',
        designationId: formData.designationId || selectedDes?.id || '',
        designationTitle: selectedDes?.title || '',
        employmentType: formData.employmentType,
        workLocationId: formData.workLocationId,
        workLocationName: adminCompanyName ? `${adminCompanyName} Office` : '',
        shift: formData.shift,
        salary: basicNum > 0 ? {
          basic: basicNum,
          hra: basicNum * 0.4,
          allowances: 0,
          bonus: 0,
          pf: basicNum * 0.12,
          tax: 0,
          professionalTax: 200,
          gross: basicNum * 1.4,
          net: basicNum * 1.4 - (basicNum * 0.12 + 200),
        } : undefined,
        bankDetails: formData.bankName || formData.accountNumber ? {
          bankName: formData.bankName || '',
          accountNumber: formData.accountNumber || '',
          ifscOrRouting: formData.routingNumber || '',
          accountHolderName: `${formData.firstName} ${formData.lastName}`.trim(),
        } : undefined,
        emergencyContact: formData.emergencyName || formData.emergencyPhone ? {
          name: formData.emergencyName || '',
          relationship: formData.emergencyRelationship || '',
          phone: formData.emergencyPhone || formData.phone,
        } : undefined,
      };

      console.log('[EmployeeDrawer] Submitting employee payload to backend API:', employeePayload);
      const created = await api.createEmployee(employeePayload);
      console.log('[EmployeeDrawer] Successfully created employee in database:', created);

      showToast({
        type: 'success',
        title: 'Employee Added!',
        message: `${formData.firstName} ${formData.lastName} has been successfully added to ${adminCompanyName}.`,
      });

      onRefresh();
      onClose();
    } catch (err: any) {
      console.error('[EmployeeDrawer] Failed to create employee:', err);
      const msg = err.message || 'Failed to create employee. Please try again.';
      setFormError(msg);
      showToast({
        type: 'error',
        title: 'Add Employee Failed',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm animate-in fade-in flex justify-end cursor-pointer"
    >
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-100 cursor-default">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Add New Employee</h3>
                <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 truncate max-w-[140px]">
                  {adminCompanyName}
                </span>
                {nextEmployeeCode && (
                  <span className="text-[10px] font-mono font-bold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    {nextEmployeeCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                Adding to {adminCompanyName} • Step {step} of 3
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] sm:text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              step === 1 ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 1 ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-200 text-slate-600'
            }`}>1</span>
            <span>Personal Info</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              step === 2 ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 2 ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-200 text-slate-600'
            }`}>2</span>
            <span>Employment</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              step === 3 ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 3 ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-200 text-slate-600'
            }`}>3</span>
            <span>Salary & Bank</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <span>{formError}</span>
              <button onClick={() => setFormError(null)} className="text-rose-500 hover:text-rose-700 font-bold">&times;</button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              {/* Profile Photo Upload Option */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-13 h-13 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold overflow-hidden shrink-0">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Profile Picture (Optional)</p>
                    <p className="text-[10px] text-slate-500">Upload employee photo for directory & attendance</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition active:scale-95 shadow-xs">
                    <span>{formData.avatarUrl ? 'Change' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const val = validateImageFile(file);
                        if (!val.valid) {
                          setFormError(val.error || 'Invalid file');
                          return;
                        }
                        try {
                          let photoUrl = '';
                          try {
                            const up = await api.uploadProfilePhoto(file);
                            if (up.avatarUrl) photoUrl = up.avatarUrl;
                          } catch (_) {}
                          if (!photoUrl) {
                            photoUrl = await compressImage(file, 360, 360, 0.85);
                          }
                          setFormData((prev) => ({ ...prev, avatarUrl: photoUrl }));
                          setFormError(null);
                        } catch (err: any) {
                          setFormError(err.message || 'Could not process photo');
                        }
                        if (e.target) e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  {formData.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: '' }))}
                      className="p-1.5 text-rose-500 hover:text-rose-700"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="input-employee-first-name"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormError(null);
                      setFormData({ ...formData, firstName: e.target.value });
                    }}
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="input-employee-last-name"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Mercer"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email Address
                </label>
                <input
                  id="input-employee-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormError(null);
                    setFormData({ ...formData, email: e.target.value });
                  }}
                  placeholder="alex.mercer@paneliya.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile / Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={13}
                    value={formData.phone}
                    onChange={(e) => {
                      setFormError(null);
                      setFormData({ ...formData, phone: e.target.value.replace(/[^0-9+\s-]/g, '').slice(0, 13) });
                    }}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">10-digit mobile number</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="424 Market Street, Suite 900, San Francisco, CA"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Login Password / PIN
                </label>
                <input
                  id="input-employee-initial-password"
                  type="text"
                  value={formData.initialPassword}
                  onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                  placeholder="Create initial login password"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
                <p className="text-[11px] text-indigo-600 mt-1 font-medium leading-snug">
                  💡 This employee can directly sign in using their registered email or phone with this password, or activate their account anytime via Sign Up.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation
                </label>
                <select
                  value={formData.designationId}
                  onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {designations.map((des) => (
                    <option key={des.id} value={des.id}>
                      {des.title} ({des.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  System Access Role
                </label>
                <select
                  id="select-employee-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="EMPLOYEE">Employee (Standard Access)</option>
                  <option value="TEAM_LEADER">Team Leader</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR_EXECUTIVE">HR Executive</option>
                  <option value="HR_ADMIN">HR Admin (HR)</option>
                  <option value="RECRUITER">Recruiter</option>
                  <option value="FINANCE_ADMIN">Finance Admin</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Assign the system role (e.g., HR, Manager, Team Leader, Employee).
                </p>
              </div>

              <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Remote">Remote</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contractual">Contractual</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Working Shift
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="General Shift (9 AM - 6 PM)">General Shift (9 AM - 6 PM)</option>
                    <option value="Morning Shift (7 AM - 4 PM)">Morning Shift (7 AM - 4 PM)</option>
                    <option value="Flexible Shift">Flexible Shift</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Basic Salary (USD $)
                </label>
                <input
                  type="number"
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  HRA (40%), Special Allowances, and PF deductions will be calculated automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="9940192841"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    placeholder="Contact person"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="+1 (555) 999-9999"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          <div className="flex items-center gap-2">
            {step < 3 && (
              <button
                type="button"
                id="btn-next-step-employee"
                onClick={() => {
                  if (step === 1) {
                    const fNameCheck = validateName(formData.firstName, 'First Name', 2);
                    if (!fNameCheck.isValid) {
                      const msg = fNameCheck.error || 'First Name is required.';
                      setFormError(msg);
                      showToast({ type: 'error', title: 'First Name Required', message: msg });
                      return;
                    }
                    const lNameCheck = validateName(formData.lastName, 'Last Name', 2);
                    if (!lNameCheck.isValid) {
                      const msg = lNameCheck.error || 'Last Name is required.';
                      setFormError(msg);
                      showToast({ type: 'error', title: 'Last Name Required', message: msg });
                      return;
                    }
                    const emailCheck = validateEmail(formData.email, true);
                    if (!emailCheck.isValid) {
                      const msg = emailCheck.error || 'Please enter a valid work email address.';
                      setFormError(msg);
                      showToast({ type: 'error', title: 'Invalid Email', message: msg });
                      return;
                    }
                    const phoneCheck = validatePhone(formData.phone, true);
                    if (!phoneCheck.isValid) {
                      const msg = phoneCheck.error || 'Please enter a valid 10-digit mobile number.';
                      setFormError(msg);
                      showToast({ type: 'error', title: 'Invalid Mobile Number', message: msg });
                      return;
                    }

                    // Immediate duplicate check for Step 1
                    const dupCheck = checkDuplicateEmailOrPhone({
                      email: formData.email,
                      phone: formData.phone,
                      existingEmployees: employees,
                      currentUserEmail: user?.email,
                      currentUserPhone: (user as any)?.phone,
                    });
                    if (!dupCheck.isValid) {
                      const msg = dupCheck.error || 'Duplicate email or phone detected.';
                      setFormError(msg);
                      showToast({ type: 'error', title: 'Duplicate Detected', message: msg });
                      return;
                    }
                    if (formData.initialPassword) {
                      const passCheck = validatePassword(formData.initialPassword, 6);
                      if (!passCheck.isValid) {
                        const msg = passCheck.error || 'Password must be at least 6 characters long.';
                        setFormError(msg);
                        showToast({ type: 'error', title: 'Password Too Short', message: msg });
                        return;
                      }
                    }
                  }
                  setFormError(null);
                  setStep((s) => s + 1);
                }}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              id={step < 3 ? 'btn-quick-save-employee' : 'btn-submit-employee'}
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {loading
                ? 'Creating Employee...'
                : step < 3
                ? 'Quick Save & Onboard'
                : 'Complete & Onboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
