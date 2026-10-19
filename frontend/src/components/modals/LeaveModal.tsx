'use client';

import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { LeaveType } from '../../types/hrms';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const { user } = useAuth();
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual Leave');
  const [startDate, setStartDate] = useState('2026-10-20');
  const [endDate, setEndDate] = useState('2026-10-20');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      await api.applyLeave({
        employeeId: user.employeeId || 'emp-8',
        leaveType,
        startDate,
        endDate,
        isHalfDay,
        reason,
      });
      alert('Leave application submitted successfully!');
      onRefresh();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in cursor-pointer"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-100 shadow-2xl relative cursor-default">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Leave Type
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              <option value="Casual Leave">Casual Leave (Balance: 10 days)</option>
              <option value="Sick Leave">Sick Leave (Balance: 9 days)</option>
              <option value="Paid Leave">Paid / Annual Leave (Balance: 12 days)</option>
              <option value="Comp Off">Compensatory Off</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Paternity Leave">Paternity Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900"
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
              className="rounded text-blue-600 focus:ring-blue-500"
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
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide details for the team coverage and emergency contact..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
