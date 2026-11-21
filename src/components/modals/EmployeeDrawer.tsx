'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Check, AlertCircle, Camera } from 'lucide-react';
import { api } from '../../lib/api';
import { Department, Designation, Employee } from '../../types/hrms';
import { useModalOverlay } from '../../lib/useModalOverlay';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

interface EmployeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  departments: Department[];
  designations: Designation[];
  employees?: Employee[];
}

const COMPANY_ROLES = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] as const;

export const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const isPlatformAdmin = user?.role === 'SUPER_ADMIN';
  const companyName = user?.companyProfile?.name || user?.companyName || '';

  const emptyForm = () => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    status: 'Active',
    gender: '',
    address: '',
    companyId: '',
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(emptyForm);

  const resetFormState = () => {
    setFormData(emptyForm());
    setPhoto(null);
    setPhotoPreview('');
    setLoading(false);
    setFormError(null);
    setFieldErrors({});
  };

  const handleClose = () => {
    resetFormState();
    onClose();
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
    if (formError) setFormError(null);
  };

  useModalOverlay({ isOpen, onClose: handleClose, closeOnEscape: false });

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errors: Record<string, string> = {};
    if (formData.firstName.trim().length < 2) errors.firstName = 'First name is required.';
    if (formData.lastName.trim().length < 2) errors.lastName = 'Last name is required.';
    if (!formData.email.includes('@')) errors.email = 'Enter a valid email.';
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) errors.phone = 'Enter a 10-digit phone or leave it empty.';
    if (isPlatformAdmin && !formData.companyId.trim()) errors.companyId = 'Company id is required.';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setFormError(null);
    try {
      const created = await api.createUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        gender: formData.gender || undefined,
        address: formData.address.trim() || undefined,
        photo,
        role: formData.role,
        status: formData.status,
        companyId: isPlatformAdmin ? formData.companyId.trim() : undefined,
      });

      showToast({
        type: 'success',
        title: 'User added',
        message: `${formData.firstName} ${formData.lastName} was added. The login password was sent by email.`,
      });

      resetFormState();
      window.dispatchEvent(new CustomEvent('hrms_employees_updated', { detail: created }));
      onRefresh();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'User could not be created.';
      if (msg.toLowerCase().includes('email')) {
        setFieldErrors((prev) => ({ ...prev, email: msg }));
      } else if (msg.toLowerCase().includes('company')) {
        setFieldErrors((prev) => ({ ...prev, companyId: msg }));
      } else {
        setFormError(msg);
      }
      showToast({ type: 'error', title: 'User was not added', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name: string) =>
    `w-full px-3 py-2 text-xs rounded-xl border bg-white transition-all ${
      fieldErrors[name]
        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900'
        : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
    }`;

  const drawer = (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in flex justify-end"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-100 cursor-default"
      >
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Add New Employee</h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {companyName ? `This user joins ${companyName}` : 'The login password is emailed'}
              </p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError(null)} className="text-rose-500 hover:text-rose-700 font-bold">
                &times;
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
            <Field label="First Name" error={fieldErrors.firstName} required>
              <input id="input-employee-first-name" required value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} placeholder="Ravi" className={fieldClass('firstName')} />
            </Field>
            <Field label="Last Name" error={fieldErrors.lastName} required>
              <input id="input-employee-last-name" required value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} placeholder="Shah" className={fieldClass('lastName')} />
            </Field>
          </div>

          <Field label="Email" error={fieldErrors.email} required>
            <input id="input-employee-email" type="email" required value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="ravi.shah@company.com" className={fieldClass('email')} />
          </Field>

          <Field label="Phone" error={fieldErrors.phone} optional>
            <input
              id="input-employee-phone"
              type="tel"
              maxLength={10}
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              className={fieldClass('phone')}
            />
          </Field>

          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
            <Field label="Gender" optional>
              <select id="select-employee-gender" value={formData.gender} onChange={(e) => updateField('gender', e.target.value)} className={fieldClass('gender')}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Profile photo" optional>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 cursor-pointer">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Camera className="h-4 w-4" />
                  </span>
                )}
                <span className="text-xs text-slate-600">{photo ? photo.name : 'Choose an image'}</span>
                <input
                  id="input-employee-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (photoPreview) URL.revokeObjectURL(photoPreview);
                    setPhoto(file);
                    setPhotoPreview(file ? URL.createObjectURL(file) : '');
                  }}
                />
              </label>
            </Field>
          </div>

          <Field label="Address" optional>
            <input id="input-employee-address" value={formData.address} onChange={(e) => updateField('address', e.target.value)} placeholder="402, Ring Road, Surat" className={fieldClass('address')} />
          </Field>

          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
            <Field label="Role" required>
              <select id="select-employee-role" value={formData.role} onChange={(e) => updateField('role', e.target.value)} className={fieldClass('role')}>
                {(isPlatformAdmin ? ['SUPER_ADMIN', ...COMPANY_ROLES] : COMPANY_ROLES).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </Field>
            <Field label="Status" required>
              <select id="select-employee-status" value={formData.status} onChange={(e) => updateField('status', e.target.value)} className={fieldClass('status')}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
          </div>

          {isPlatformAdmin && (
            <Field label="Company Id" error={fieldErrors.companyId} required>
              <input id="input-employee-company-id" required value={formData.companyId} onChange={(e) => updateField('companyId', e.target.value)} placeholder="Company id" className={fieldClass('companyId')} />
            </Field>
          )}

          <p className="text-[11px] text-slate-500">A password is generated and sent to this email. It is not typed here.</p>
        </form>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50 shrink-0">
          <button type="button" onClick={handleClose} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
            Cancel
          </button>
          <button
            id="btn-submit-employee"
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {loading ? 'Creating...' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return drawer;
  return createPortal(drawer, document.body);
};

function Field({
  label,
  error,
  required,
  optional,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
          {optional && <span className="text-slate-400 font-normal"> (optional)</span>}
        </label>
        {error && (
          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {error}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
