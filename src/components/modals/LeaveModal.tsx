'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, User as UserIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Employee, LeaveType } from '../../types/hrms';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  employees?: Employee[];
  portalMode?: 'admin' | 'employee';
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
  employees = [],
  portalMode = 'employee',
}) => {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual Leave');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync default employee whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const myId = user.employeeId || user.id || '';
      setSelectedEmpId(myId);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen, user.employeeId, user.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a valid reason for leave.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Resolve target employee details
      const matchedEmp = employees.find(
        (emp) =>
          emp.id === selectedEmpId ||
          emp.userId === selectedEmpId ||
          (user.email && emp.email?.toLowerCase() === user.email.toLowerCase())
      );

      const targetEmp = matchedEmp || user;
      const targetEmpId = matchedEmp?.id || user.employeeId || user.id || selectedEmpId;
      const targetEmpCode = (matchedEmp as any)?.employeeCode || (user as any)?.employeeCode || '';
      const targetEmpName = matchedEmp?.firstName
        ? `${matchedEmp.firstName} ${matchedEmp.lastName || ''}`.trim()
        : `${user.firstName || 'Employee'} ${user.lastName || ''}`.trim();
      const targetEmpEmail = matchedEmp?.email || user.email || '';
      const targetDeptName =
        (matchedEmp as any)?.departmentName ||
        (user as any)?.departmentName ||
        'General';
      const targetCompId =
        (matchedEmp as any)?.companyId ||
        user.companyId ||
        (typeof window !== 'undefined' ? localStorage.getItem('hrms_company_id') || '' : '');
      const targetCompCode =
        (matchedEmp as any)?.companyCode ||
        user.companyCode ||
        (typeof window !== 'undefined' ? localStorage.getItem('hrms_company_code') || '' : '');

      await api.applyLeave({
        employeeId: targetEmpId,
        employeeCode: targetEmpCode,
        employeeName: targetEmpName,
        employeeEmail: targetEmpEmail,
        departmentName: targetDeptName,
        companyId: targetCompId,
        companyCode: targetCompCode,
        leaveType,
        startDate,
        endDate,
        isHalfDay,
        reason: reason.trim(),
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hrms_leaves_updated'));
      }

      await onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-modal-backdrop cursor-pointer"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 border border-slate-100 shadow-2xl relative cursor-default animate-modal-zoom max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 pr-8">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Apply for Leave</h3>
            <p className="text-xs text-slate-500">
              Submit your request for manager & HR review
            </p>
          </div>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Employee Selector for Admin Portal */}
          {portalMode === 'admin' && employees.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Applying For Employee
              </label>
              <div className="relative">
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value={user.employeeId || user.id}>
                    Myself ({user.firstName} {user.lastName || ''} - Admin)
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.id}) - {emp.departmentName || 'General'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Leave Type
            </label>
            <select
              id="leave-type-select"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Casual Leave">Casual Leave (CL)</option>
              <option value="Sick Leave">Sick Leave (SL)</option>
              <option value="Paid Leave">Paid / Annual Leave (PL)</option>
              <option value="Comp Off">Compensatory Off</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Paternity Leave">Paternity Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                id="leave-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date
              </label>
              <input
                id="leave-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="halfDay"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="halfDay" className="text-xs text-slate-600 font-medium cursor-pointer">
              Half Day Leave (Morning or Afternoon Session)
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Leave
            </label>
            <textarea
              id="leave-reason-textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide details for the team coverage and emergency contact..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-leave"
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
