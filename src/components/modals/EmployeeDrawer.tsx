'use client';

import React, { useState } from 'react';
import { X, UserPlus, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { Employee, Department, Designation } from '../../types/hrms';

interface EmployeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  departments: Department[];
  designations: Designation[];
}

export const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({
  isOpen,
  onClose,
  onRefresh,
  departments,
  designations,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
    basicSalary: 6500,
    bankName: 'Silicon Valley Bank',
    accountNumber: '',
    routingNumber: '',
    emergencyName: '',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '',
    taxId: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const selectedDept = departments.find((d) => d.id === formData.departmentId);
      const selectedDes = designations.find((d) => d.id === formData.designationId);

      const employeePayload: Partial<Employee> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        departmentId: formData.departmentId,
        departmentName: selectedDept?.name || 'Engineering',
        designationId: formData.designationId,
        designationTitle: selectedDes?.title || 'Software Engineer',
        employmentType: formData.employmentType,
        workLocationId: formData.workLocationId,
        workLocationName: 'Corporate Headquarters',
        shift: formData.shift,
        salary: {
          basic: Number(formData.basicSalary),
          hra: Number(formData.basicSalary) * 0.4,
          allowances: 1500,
          bonus: 800,
          pf: Number(formData.basicSalary) * 0.12,
          tax: Number(formData.basicSalary) * 0.15,
          professionalTax: 200,
          gross: Number(formData.basicSalary) * 1.4 + 2300,
          net: Number(formData.basicSalary) * 1.4 + 2300 - (Number(formData.basicSalary) * 0.27 + 200),
        },
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber || '99201948191',
          ifscOrRouting: formData.routingNumber || 'SVB00129',
          accountHolderName: `${formData.firstName} ${formData.lastName}`,
        },
        emergencyContact: {
          name: formData.emergencyName || 'Emergency Contact',
          relationship: formData.emergencyRelationship,
          phone: formData.emergencyPhone || formData.phone,
        },
      };

      await api.createEmployee(employeePayload);
      alert(`Employee ${formData.firstName} ${formData.lastName} successfully created!`);
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
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
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Employee</h3>
              <p className="text-xs text-slate-500">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-3 bg-slate-50 flex items-center justify-between text-xs font-semibold">
          <span className={step === 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}>
            1. Personal Info
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className={step === 2 ? 'text-blue-600 font-bold' : 'text-slate-400'}>
            2. Employment
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className={step === 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}>
            3. Compensation & Bank
          </span>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
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
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex.mercer@paneliya.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
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
                  Designation / Role
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

              <div className="grid grid-cols-2 gap-3">
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
                  onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  HRA (40%), Special Allowances, and PF deductions will be calculated automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
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
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && (!formData.firstName || !formData.email)) {
                  alert('Please enter first name and email.');
                  return;
                }
                setStep((s) => s + 1);
              }}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Creating Employee...' : 'Complete & Onboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
