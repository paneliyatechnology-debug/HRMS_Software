'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
<<<<<<< HEAD
import {
  X,
  UserPlus,
  Check,
  Camera,
  Upload,
  Trash2,
  AlertCircle,
  Loader2,
  Info,
  Circle,
  ArrowRight,
  ArrowLeft,
  IndianRupee,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Employee, Department, Designation, Role } from '../../types/hrms';
=======
import { X, UserPlus, Check, Camera, Upload, Trash2, AlertCircle, Loader2, Info, Circle } from 'lucide-react';
import { api } from '../../lib/api';
import { Employee, Department, Designation } from '../../types/hrms';
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
import { useModalOverlay } from '../../lib/useModalOverlay';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getAllCompanies } from '../../lib/companyService';
import { compressImage, validateImageFile } from '../../lib/imageUtils';
import {
  validateEmail,
  validatePhone,
  validateName,
<<<<<<< HEAD
=======
  validatePassword,
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
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

<<<<<<< HEAD
  // Multi-step form state (Step 1: Personal Info, Step 2: Salary Structure)
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoFace, setPhotoFace] = useState<number[] | null>(null);
=======
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [nextEmployeeCode, setNextEmployeeCode] = useState<string>('');

  const getInitialFormData = () => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male' as const,
<<<<<<< HEAD
    role: 'EMPLOYEE' as Role,
    address: '',
    avatarUrl: '',
  });

  const getInitialSalaryData = () => ({
    basic: '',
    hra: '',
    allowances: '',
    bonus: '',
    pf: '',
    tax: '',
  });

  const [formData, setFormData] = useState(getInitialFormData);
  const [salaryData, setSalaryData] = useState(getInitialSalaryData);

  const resetFormState = () => {
    setFormData(getInitialFormData());
    setPhotoFile(null);
    setPhotoFace(null);
    setSalaryData(getInitialSalaryData());
    setStep(1);
=======
    address: '',
    initialPassword: '',
    avatarUrl: '',
  });

  const [formData, setFormData] = useState(getInitialFormData);

  const resetFormState = () => {
    setFormData(getInitialFormData());
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
    setLoading(false);
    setPhotoUploading(false);
    setFormError(null);
    setFieldErrors({});
  };

  const handleClose = () => {
    resetFormState();
    onClose();
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
    if (formError) setFormError(null);
  };

<<<<<<< HEAD
  const updateSalaryField = (field: string, value: string) => {
    setSalaryData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
    if (formError) setFormError(null);
  };

  // Salary calculations
  const numBasic = Math.max(0, parseFloat(salaryData.basic) || 0);
  const numHra = Math.max(0, parseFloat(salaryData.hra) || 0);
  const numAllowances = Math.max(0, parseFloat(salaryData.allowances) || 0);
  const numBonus = Math.max(0, parseFloat(salaryData.bonus) || 0);
  const numPf = Math.max(0, parseFloat(salaryData.pf) || 0);
  const numTax = Math.max(0, parseFloat(salaryData.tax) || 0);

  const grossSalary = numBasic + numHra + numAllowances + numBonus;
  const totalDeductions = numPf + numTax;
  const netSalary = Math.max(0, grossSalary - totalDeductions);
  const annualCtc = grossSalary * 12;

=======
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
  useEffect(() => {
    if (!isOpen) {
      resetFormState();
    } else {
      resetFormState();
      api.getNextEmployeeCode(adminCompanyId)
        .then((res) => {
          if (res?.nextCode) setNextEmployeeCode(res.nextCode);
        })
        .catch((err) => console.warn('Could not fetch next employee code:', err));
    }
  }, [isOpen, adminCompanyId]);

  useModalOverlay({ isOpen, onClose: handleClose, closeOnEscape: false });

  if (!isOpen) return null;

<<<<<<< HEAD
  // Validate Step 1 (Personal Details)
  const validateStep1 = async (): Promise<boolean> => {
    setFormError(null);
    const errors: Record<string, string> = {};

    // 1. Validate First Name
    const fNameCheck = validateName(formData.firstName, 'First Name', 2);
    if (!fNameCheck.isValid) {
      errors.firstName = fNameCheck.error || 'First Name is required (minimum 2 characters).';
    }

    // 2. Validate Last Name
    const lNameCheck = validateName(formData.lastName, 'Last Name', 2);
    if (!lNameCheck.isValid) {
      errors.lastName = lNameCheck.error || 'Last Name is required (minimum 2 characters).';
    }

    // 3. Validate Work Email
    const emailCheck = validateEmail(formData.email, true);
    if (!emailCheck.isValid) {
      errors.email = emailCheck.error || 'Please enter a valid employee work email.';
    }

    // 4. Validate Phone Number
    const phoneCheck = validatePhone(formData.phone, true);
    if (!phoneCheck.isValid) {
      errors.phone = phoneCheck.error || 'Please enter a valid 10-digit mobile number.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }

    // 5. Strict Uniqueness Check: 1 Email = 1 Account & 1 Mobile = 1 Account
    setLoading(true);
    try {
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
        if (msg.toLowerCase().includes('email')) {
          errors.email = msg;
        } else {
          errors.phone = msg;
        }
        setFieldErrors(errors);
        return false;
      }
    } finally {
      setLoading(false);
    }

    setFieldErrors({});
    return true;
  };

  // Next step handler
  const handleNextStep = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const isValid = await validateStep1();
    if (isValid) {
      setStep(2);
    }
  };

  // Final submit handler (runs on Step 2)
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (step === 1) {
      const isValid = await validateStep1();
      if (isValid) setStep(2);
      return;
    }

    // Validate Step 2 (Salary)
    if (!salaryData.basic || numBasic <= 0) {
      setFieldErrors({ basic: 'Please enter a valid monthly Basic Salary (greater than ₹0).' });
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      const employeePayload = {
=======
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setFormError(null);
    const errors: Record<string, string> = {};

    try {
      // 1. Validate First Name
      const fNameCheck = validateName(formData.firstName, 'First Name', 2);
      if (!fNameCheck.isValid) {
        errors.firstName = fNameCheck.error || 'First Name is required (minimum 2 characters).';
      }

      // 2. Validate Last Name
      const lNameCheck = validateName(formData.lastName, 'Last Name', 2);
      if (!lNameCheck.isValid) {
        errors.lastName = lNameCheck.error || 'Last Name is required (minimum 2 characters).';
      }

      // 3. Validate Work Email
      const emailCheck = validateEmail(formData.email, true);
      if (!emailCheck.isValid) {
        errors.email = emailCheck.error || 'Please enter a valid employee work email.';
      }

      // 4. Validate Phone Number
      const phoneCheck = validatePhone(formData.phone, true);
      if (!phoneCheck.isValid) {
        errors.phone = phoneCheck.error || 'Please enter a valid 10-digit mobile number.';
      }

      // 5. Validate Password (minimum 6 characters, 1 uppercase, 1 special character, 1 number)
      const passCheck = validatePassword(formData.initialPassword, 6, {
        requireUppercase: true,
        requireSpecial: true,
        requireNumber: true,
      });
      if (!passCheck.isValid) {
        errors.initialPassword = passCheck.error || 'Password must contain at least 1 uppercase letter, 1 number, and 1 special character.';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setLoading(false);
        return;
      }

      // 6. Strict Uniqueness: 1 Email = 1 Account & 1 Mobile Number = 1 Account
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
        if (msg.toLowerCase().includes('email')) {
          errors.email = msg;
        } else {
          errors.phone = msg;
        }
        setFieldErrors(errors);
        setLoading(false);
        return;
      }

      // 7. Construct EXACT payload with ONLY Personal Information fields
      const employeePayload: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        gender: 'Male' | 'Female' | 'Other';
        address: string;
        password: string;
        avatarUrl?: string;
      } = {
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        gender: formData.gender,
<<<<<<< HEAD
        role: formData.role || 'EMPLOYEE',
        address: formData.address.trim(),
        ...(photoFile ? { photo: photoFile, faceDescriptor: photoFace ? JSON.stringify(photoFace) : '' } : {}),
        salary: {
          basic: numBasic,
          hra: numHra,
          allowances: numAllowances,
          bonus: numBonus,
          pf: numPf,
          tax: numTax,
          professionalTax: numTax,
          gross: grossSalary,
          net: netSalary,
        },
      };

      console.log('[EmployeeDrawer] Submitting employee with salary structure:', employeePayload);
=======
        address: formData.address.trim(),
        password: formData.initialPassword.trim(),
        ...(formData.avatarUrl ? { avatarUrl: formData.avatarUrl } : {}),
      };

      console.log('[EmployeeDrawer] Submitting exact personal info payload to POST /api/admin/employees:', employeePayload);
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
      const created = await api.createEmployee({
        ...employeePayload,
        companyId: adminCompanyId,
      });
      console.log('[EmployeeDrawer] Successfully created employee in backend:', created);

      showToast({
        type: 'success',
        title: 'Employee Added!',
<<<<<<< HEAD
        message: `${formData.firstName} ${formData.lastName} has been onboarded successfully with net salary ₹${netSalary.toLocaleString('en-IN')}/mo.`,
=======
        message: `${formData.firstName} ${formData.lastName} has been successfully added to ${adminCompanyName}.`,
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
      });

      resetFormState();
      window.dispatchEvent(new CustomEvent('hrms_employees_updated', { detail: created }));
      onRefresh();
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to create employee. Please try again.';
      console.warn('[EmployeeDrawer] Server response error:', msg);

      const isEmailConflict =
        msg.toLowerCase().includes('email') ||
        msg.toLowerCase().includes('already registered');

      const isPhoneConflict =
        msg.toLowerCase().includes('phone') ||
        msg.toLowerCase().includes('mobile');

<<<<<<< HEAD
      if (isEmailConflict || isPhoneConflict) {
        setStep(1); // Jump back to step 1 so user can see and correct the conflicting field
        if (isEmailConflict) {
          setFieldErrors((prev) => ({ ...prev, email: msg }));
        } else {
          setFieldErrors((prev) => ({ ...prev, phone: msg }));
        }
=======
      if (isEmailConflict) {
        setFieldErrors((prev) => ({ ...prev, email: msg }));
      } else if (isPhoneConflict) {
        setFieldErrors((prev) => ({ ...prev, phone: msg }));
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
      } else {
        setFormError(msg);
      }

      showToast({
        type: 'error',
        title: 'Validation Notice',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const drawer = (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-white/45 backdrop-blur-md animate-in fade-in flex justify-end"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-100 cursor-default"
      >
        {/* Header */}
<<<<<<< HEAD
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
=======
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Add New Employee</h3>
                <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 truncate max-w-[140px]">
                  {adminCompanyName}
                </span>
<<<<<<< HEAD
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {step === 1 ? 'Step 1 of 2: Personal information & credentials' : 'Step 2 of 2: Monthly salary structure & deductions'}
=======
                {nextEmployeeCode && (
                  <span className="text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                    {nextEmployeeCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Adding to {adminCompanyName}
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

<<<<<<< HEAD
        {/* Step Indicator Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => {
              if (step === 2) setStep(1);
            }}
            className={`flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${
              step === 1 ? 'text-indigo-600' : 'text-emerald-700 hover:text-emerald-800'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === 1
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
              }`}
            >
              {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </div>
            <span>Personal Details</span>
          </button>

          {/* Stepper Progress Connector */}
          <div className="flex-1 mx-4 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-indigo-600 transition-all duration-300 ${
                step === 2 ? 'w-full' : 'w-1/2'
              }`}
            />
          </div>

          {/* Step 2 Pill */}
          <div
            className={`flex items-center gap-2 text-xs font-bold ${
              step === 2 ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === 2
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </div>
            <span>Salary Structure</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
=======
        {/* Form Body - ONLY Personal Information */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-500 hover:text-rose-700 font-bold"
              >
                &times;
              </button>
            </div>
          )}

<<<<<<< HEAD
          {/* STEP 1: PERSONAL INFORMATION */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              {/* Profile Photo Upload Option */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-13 h-13 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-800 font-bold overflow-hidden shrink-0">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-indigo-600" />
                    )}
                    {photoUploading && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Profile Picture (Optional)</p>
                    <p className="text-[10px] text-slate-500">
                      {photoUploading ? 'Checking the face photo...' : 'One photo only. Employee, HR, or Manager cannot change it later without admin approval.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white font-bold text-xs transition shadow-xs ${
                      photoUploading
                        ? 'bg-indigo-700/70 cursor-wait pointer-events-none'
                        : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer active:scale-95'
                    }`}
                  >
                    {photoUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{formData.avatarUrl ? 'Change' : 'Upload'}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={photoUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const val = validateImageFile(file);
                        if (!val.valid) {
                          setFormError(val.error || 'Invalid file');
                          e.target.value = '';
                          return;
                        }
                        setPhotoUploading(true);
                        setFormError(null);
                        try {
                          const { assertFaceInPhoto } = await import('../../lib/faceMatch');
                          const face = await assertFaceInPhoto(file);
                          const preview = URL.createObjectURL(file);
                          setPhotoFile(file);
                          setPhotoFace(face);
                          setFormData((prev) => ({ ...prev, avatarUrl: preview }));
                          setFormError(null);
                        } catch (err: any) {
                          setFormError(err.message || 'Could not process photo');
                        } finally {
                          setPhotoUploading(false);
                          e.target.value = '';
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {formData.avatarUrl && !photoUploading && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoFace(null);
                        setFormData((prev) => ({ ...prev, avatarUrl: '' }));
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    {fieldErrors.firstName && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.firstName}
                      </span>
                    )}
                  </div>
                  <input
                    id="input-employee-first-name"
                    type="text"
                    required
                    autoComplete="off"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="e.g. Alex"
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-white transition-all ${
                      fieldErrors.firstName
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900'
                        : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    {fieldErrors.lastName && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.lastName}
                      </span>
                    )}
                  </div>
                  <input
                    id="input-employee-last-name"
                    type="text"
                    required
                    autoComplete="off"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="e.g. Mercer"
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-white transition-all ${
                      fieldErrors.lastName
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900'
                        : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              {/* Work Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Work Email Address <span className="text-red-500">*</span>
                  </label>
                  {fieldErrors.email && (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {fieldErrors.email}
=======
          <div className="space-y-4">
            {/* Profile Photo Upload Option */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-13 h-13 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold overflow-hidden shrink-0">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-emerald-600" />
                  )}
                  {photoUploading && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Profile Picture (Optional)</p>
                  <p className="text-[10px] text-slate-500">
                    {photoUploading ? 'Uploading and processing photo...' : 'Upload employee photo for directory & attendance'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white font-bold text-xs transition shadow-xs ${
                    photoUploading
                      ? 'bg-emerald-700/70 cursor-wait pointer-events-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer active:scale-95'
                  }`}
                >
                  {photoUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formData.avatarUrl ? 'Change' : 'Upload'}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={photoUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const val = validateImageFile(file);
                      if (!val.valid) {
                        setFormError(val.error || 'Invalid file');
                        e.target.value = '';
                        return;
                      }
                      setPhotoUploading(true);
                      setFormError(null);
                      try {
                        let photoUrl = '';
                        try {
                          const up = await api.uploadProfilePhoto(file);
                          if (up.avatarUrl) photoUrl = up.avatarUrl;
                        } catch (uploadErr) {
                          console.warn('Backend photo upload failed, using local compression fallback:', uploadErr);
                        }
                        if (!photoUrl) {
                          photoUrl = await compressImage(file, 400, 400, 0.88);
                        }
                        setFormData((prev) => ({ ...prev, avatarUrl: photoUrl }));
                        setFormError(null);
                      } catch (err: any) {
                        setFormError(err.message || 'Could not process photo');
                      } finally {
                        setPhotoUploading(false);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                </label>
                {formData.avatarUrl && !photoUploading && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: '' }))}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  {fieldErrors.firstName && (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {fieldErrors.firstName}
                    </span>
                  )}
                </div>
                <input
                  id="input-employee-first-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="e.g. Alex"
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-white transition-all ${
                    fieldErrors.firstName
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900'
                      : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  {fieldErrors.lastName && (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {fieldErrors.lastName}
                    </span>
                  )}
                </div>
                <input
                  id="input-employee-last-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="e.g. Mercer"
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-white transition-all ${
                    fieldErrors.lastName
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900'
                      : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* Work Email Address */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Work Email Address <span className="text-red-500">*</span>
                </label>
                {fieldErrors.email && (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.email}
                  </span>
                )}
              </div>
              <input
                id="input-employee-email"
                type="email"
                required
                autoComplete="off"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="alex.mercer@paneliya.com"
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white transition-all ${
                  fieldErrors.email
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900'
                    : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Phone Number & Gender */}
            <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Mobile / Phone Number <span className="text-red-500">*</span>
                  </label>
                  {fieldErrors.phone && (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {fieldErrors.phone}
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                    </span>
                  )}
                </div>
                <input
<<<<<<< HEAD
                  id="input-employee-email"
                  type="email"
                  required
                  autoComplete="off"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="alex.mercer@paneliya.com"
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-white transition-all ${
                    fieldErrors.email
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900'
                      : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
              </div>

              {/* Phone Number & Gender */}
              <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Mobile / Phone Number <span className="text-red-500">*</span>
                    </label>
                    {fieldErrors.phone && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.phone}
                      </span>
                    )}
                  </div>
                  <input
                    id="input-employee-phone"
                    type="tel"
                    maxLength={10}
                    required
                    autoComplete="off"
                    value={formData.phone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                      updateField('phone', clean);
                    }}
                    onBlur={() => {
                      if (formData.phone) {
                        const check = validatePhone(formData.phone, true);
                        if (!check.isValid) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            phone: check.error || 'Please enter a valid 10-digit mobile number.',
                          }));
                        }
                      }
                    }}
                    placeholder="9876543210"
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-white transition-all ${
                      fieldErrors.phone
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900'
                        : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>10-digit mobile number</span>
                    <span className={formData.phone.length === 10 ? 'text-emerald-600 font-bold' : ''}>
                      {formData.phone.length}/10 digits
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="select-employee-gender"
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* System Access Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  System Access Role
                </label>
                <select
                  id="select-employee-role"
                  value={formData.role}
                  onChange={(e) => updateField('role', e.target.value as Role)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="EMPLOYEE">Employee (Standard Staff)</option>
                  <option value="MANAGER">Manager (Team Oversight &amp; Approvals)</option>
                  <option value="HR">HR (Human Resources)</option>
                  <option value="ADMIN">Admin (Workspace Administrator)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Determines modules, approval permissions, and system access level.
                </p>
              </div>

              {/* Residential Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Residential Address
                </label>
                <input
                  id="input-employee-address"
                  type="text"
                  autoComplete="off"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="e.g. 402, Ring Road, Surat"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              {/* Informative Note regarding credentials */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800">Account Access &amp; Password</p>
                  <p className="text-slate-500 leading-relaxed">
                    Login credentials and an account setup invitation will be sent to the employee&apos;s registered email address upon onboarding.
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* STEP 2: SALARY STRUCTURE & COMPENSATION */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Earnings Section */}
              <div className="space-y-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <IndianRupee className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Monthly Earnings & Allowances
                  </h4>
                </div>

                {/* Basic Salary */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Basic Salary (Monthly) <span className="text-red-500">*</span>
                    </label>
                    {fieldErrors.basic && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.basic}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      id="input-salary-basic"
                      type="number"
                      min={0}
                      required
                      placeholder="e.g. 25000"
                      value={salaryData.basic}
                      onChange={(e) => updateSalaryField('basic', e.target.value)}
                      className={`w-full pl-7 pr-3 py-2 text-xs rounded-xl border bg-white transition-all ${
                        fieldErrors.basic
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900'
                          : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Core base compensation component</p>
                </div>

                {/* HRA & Allowances in 2-cols */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      House Rent Allowance (HRA)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        ₹
                      </span>
                      <input
                        id="input-salary-hra"
                        type="number"
                        min={0}
                        placeholder="e.g. 10000"
                        value={salaryData.hra}
                        onChange={(e) => updateSalaryField('hra', e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Special / Other Allowances
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        ₹
                      </span>
                      <input
                        id="input-salary-allowances"
                        type="number"
                        min={0}
                        placeholder="e.g. 5000"
                        value={salaryData.allowances}
                        onChange={(e) => updateSalaryField('allowances', e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Bonus / Incentive */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Bonus / Performance Incentive (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      id="input-salary-bonus"
                      type="number"
                      min={0}
                      placeholder="e.g. 0"
                      value={salaryData.bonus}
                      onChange={(e) => updateSalaryField('bonus', e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="space-y-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Statutory Deductions (Monthly)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Provident Fund (PF) Deduction
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        ₹
                      </span>
                      <input
                        id="input-salary-pf"
                        type="number"
                        min={0}
                        placeholder="e.g. 1800"
                        value={salaryData.pf}
                        onChange={(e) => updateSalaryField('pf', e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">EPF employee contribution</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Professional Tax / TDS
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        ₹
                      </span>
                      <input
                        id="input-salary-tax"
                        type="number"
                        min={0}
                        placeholder="e.g. 200"
                        value={salaryData.tax}
                        onChange={(e) => updateSalaryField('tax', e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">State PT or income withholding</p>
                  </div>
                </div>
              </div>

              {/* Live Salary Breakdown Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold tracking-wide uppercase text-slate-200">
                      Take-Home Salary Breakdown
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Live Calculation
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Gross Monthly Pay</span>
                    <span className="text-sm font-bold text-white">
                      ₹{grossSalary.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Total Deductions</span>
                    <span className="text-sm font-bold text-rose-400">
                      - ₹{totalDeductions.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                      Net In-Hand Salary
                    </span>
                    <span className="text-xl font-extrabold text-emerald-300 flex items-center">
                      <IndianRupee className="w-5 h-5 inline stroke-[2.5]" />
                      {netSalary.toLocaleString('en-IN')}
                      <span className="text-xs text-slate-300 font-normal ml-1">/ month</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Estimated Annual CTC
                    </span>
                    <span className="text-xs font-bold text-indigo-200">
                      ₹{annualCtc.toLocaleString('en-IN')} / yr
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50 shrink-0">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="btn-next-step"
                type="button"
                onClick={handleNextStep}
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <span>Next: Salary Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Personal Details</span>
              </button>

              <button
                id="btn-submit-employee"
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Onboarding Employee...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Complete &amp; Onboard Employee</span>
                  </>
                )}
              </button>
            </>
          )}
=======
                  id="input-employee-phone"
                  type="tel"
                  maxLength={10}
                  required
                  autoComplete="off"
                  value={formData.phone}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                    updateField('phone', clean);
                  }}
                  onBlur={() => {
                    if (formData.phone) {
                      const check = validatePhone(formData.phone, true);
                      if (!check.isValid) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          phone: check.error || 'Please enter a valid 10-digit mobile number.',
                        }));
                      }
                    }
                  }}
                  placeholder="9876543210"
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-white transition-all ${
                    fieldErrors.phone
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900'
                      : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>10-digit mobile number</span>
                  <span className={formData.phone.length === 10 ? 'text-emerald-600 font-bold' : ''}>
                    {formData.phone.length}/10 digits
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  id="select-employee-gender"
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Residential Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Address
              </label>
              <input
                id="input-employee-address"
                type="text"
                autoComplete="off"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="e.g. 402, Ring Road, Surat"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              />
            </div>

            {/* Initial Login Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Initial Login Password / PIN <span className="text-red-500">*</span>
                </label>
                {fieldErrors.initialPassword && (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.initialPassword}
                  </span>
                )}
              </div>
              <input
                id="input-employee-initial-password"
                type="text"
                required
                autoComplete="new-password"
                value={formData.initialPassword}
                onChange={(e) => updateField('initialPassword', e.target.value)}
                onBlur={() => {
                  if (formData.initialPassword) {
                    const check = validatePassword(formData.initialPassword, 6, {
                      requireUppercase: true,
                      requireSpecial: true,
                      requireNumber: true,
                    });
                    if (!check.isValid) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        initialPassword: check.error || 'Password must meet all complexity requirements.',
                      }));
                    }
                  }
                }}
                placeholder="Create password (min. 6 chars, 1 uppercase, 1 special, 1 number)"
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white transition-all ${
                  fieldErrors.initialPassword
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900'
                    : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {/* Requirement Checklist */}
              <div className="mt-2 grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px]">
                <div
                  className={`flex items-center gap-1.5 font-medium transition-colors ${
                    /[A-Z]/.test(formData.initialPassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                      /[A-Z]/.test(formData.initialPassword)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {/[A-Z]/.test(formData.initialPassword) ? <Check className="w-2.5 h-2.5" /> : <Circle className="w-2 h-2" />}
                  </span>
                  <span>1 Uppercase (A-Z)</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 font-medium transition-colors ${
                    /[0-9]/.test(formData.initialPassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                      /[0-9]/.test(formData.initialPassword)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {/[0-9]/.test(formData.initialPassword) ? <Check className="w-2.5 h-2.5" /> : <Circle className="w-2 h-2" />}
                  </span>
                  <span>1 Number (0-9)</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 font-medium transition-colors ${
                    /[^A-Za-z0-9]/.test(formData.initialPassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                      /[^A-Za-z0-9]/.test(formData.initialPassword)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {/[^A-Za-z0-9]/.test(formData.initialPassword) ? <Check className="w-2.5 h-2.5" /> : <Circle className="w-2 h-2" />}
                  </span>
                  <span>1 Special character</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 font-medium transition-colors ${
                    formData.initialPassword.length >= 6 ? 'text-emerald-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                      formData.initialPassword.length >= 6
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {formData.initialPassword.length >= 6 ? <Check className="w-2.5 h-2.5" /> : <Circle className="w-2 h-2" />}
                  </span>
                  <span>Min. 6 characters</span>
                </div>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1 font-medium leading-snug flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>This employee can directly sign in using their registered email or phone with this password.</span>
              </p>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            id="btn-submit-employee"
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {loading ? 'Creating Employee...' : 'Complete & Onboard'}
          </button>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return drawer;
  return createPortal(drawer, document.body);
};
