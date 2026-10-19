'use client';

import React, { useState } from 'react';
import {
  Plus,
  Upload,
  Download,
  Filter,
  Calendar,
  User,
  List,
  Search,
  ChevronDown,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { LeaveRequest } from '../../types/hrms';
import { api } from '../../lib/api';

interface LeaveModuleProps {
  leaves: LeaveRequest[];
  onOpenApplyModal: () => void;
  onRefresh: () => void;
}

export const LeaveModule: React.FC<LeaveModuleProps> = ({
  leaves,
  onOpenApplyModal,
  onRefresh,
}) => {
  const [duration, setDuration] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredLeaves = leaves.filter((l) => {
    const matchesSearch =
      l.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      l.reason?.toLowerCase().includes(search.toLowerCase()) ||
      l.leaveType?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await api.approveLeave(id, 'SUPER_ADMIN', 'Keyur Sangani', 'Approved via Clan.biz Portal');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please enter rejection remarks:');
    if (!reason) return;
    setProcessingId(id);
    try {
      await api.rejectLeave(id, 'Keyur Sangani', reason);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  const exportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Employee,Leave Date,Duration,Status,Type\n' +
      filteredLeaves
        .map((l) => `"${l.employeeName}","${l.startDate} to ${l.endDate}","${l.daysCount} days","${l.status}","${l.leaveType}"`)
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'leaves_export.csv');
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto select-none">
      {/* Top Filter Bar matching Clan.biz */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
        {/* Duration picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 shrink-0">Duration</span>
          <div className="relative">
            <input
              type="text"
              placeholder="Start Date To End Date"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none shadow-2xs w-48 sm:w-56"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Start typing to search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none shadow-2xs"
          />
        </div>

        {/* Filter button */}
        <button
          onClick={() => alert('Filter panel')}
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 shadow-2xs flex items-center justify-center"
          title="Filter"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenApplyModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4f46e5] hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Leave</span>
          </button>

          <button
            onClick={() => alert('Import CSV modal')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import</span>
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>

        {/* View Switches */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
          <button className="p-1.5 rounded-lg bg-slate-100 text-slate-900" title="Table View">
            <List className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800" title="Calendar View">
            <Calendar className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800" title="User View">
            <User className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-bold">EMPLOYEE ⇅</th>
                <th className="py-3 px-4 font-bold">LEAVE DATE ⇅</th>
                <th className="py-3 px-4 font-bold">DURATION ⇅</th>
                <th className="py-3 px-4 font-bold">LEAVE STATUS ⇅</th>
                <th className="py-3 px-4 font-bold">LEAVE TYPE ⇅</th>
                <th className="py-3 px-4 font-bold">PAID ⇅</th>
                <th className="py-3 px-4 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                    No data available in table
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(leave.id)}
                        onChange={() => {
                          setSelectedRows((prev) =>
                            prev.includes(leave.id) ? prev.filter((r) => r !== leave.id) : [...prev, leave.id]
                          );
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{leave.employeeName}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{leave.daysCount} days</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          leave.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : leave.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{leave.leaveType}</td>
                    <td className="py-3 px-4 text-slate-600">Yes</td>
                    <td className="py-3 px-4 text-right">
                      {leave.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(leave.id)}
                            disabled={processingId === leave.id}
                            className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            title="Approve"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <button
                            onClick={() => handleReject(leave.id)}
                            disabled={processingId === leave.id}
                            className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                            title="Reject"
                          >
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer">
              <option value="10">10</option>
              <option value="25">25</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Showing {filteredLeaves.length === 0 ? '0 to 0 of 0' : `1 to ${filteredLeaves.length} of ${filteredLeaves.length}`} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled
                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-300 text-xs font-medium cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled
                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-300 text-xs font-medium cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
