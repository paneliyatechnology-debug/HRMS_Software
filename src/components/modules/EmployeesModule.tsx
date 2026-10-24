'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Mail,
  Network,
  MoreHorizontal,
  ChevronDown,
  Columns,
  Table as TableIcon,
  List,
  Info,
  Check,
  Filter,
  Trash2,
  Bell,
  X,
  AlertCircle,
  Send,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { Employee, Department } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';
import { getRoleDefinition } from '../../lib/roleConfig';
import { ChangeRoleModal } from '../modals/ChangeRoleModal';

interface EmployeesModuleProps {
  employees: Employee[];
  departments: Department[];
  onSelectEmployee: (emp: Employee) => void;
  onOpenAddModal: () => void;
  onRefresh?: () => void;
  onOpenChatWithEmployee?: (empId: string) => void;
  portalMode?: 'employee' | 'admin';
}

export const EmployeesModule: React.FC<EmployeesModuleProps> = ({
  employees,
  departments,
  onSelectEmployee,
  onOpenAddModal,
  onRefresh,
  onOpenChatWithEmployee,
  portalMode = 'admin',
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [selectedJoining, setSelectedJoining] = useState('Any');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search on '/' key press
  useEffect(() => {
    const handleSlashKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleSlashKey);
    return () => window.removeEventListener('keydown', handleSlashKey);
  }, []);

  // State for removing employee
  const [removingEmp, setRemovingEmp] = useState<Employee | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // State for sending notice to employee
  const [noticeTargetEmp, setNoticeTargetEmp] = useState<Employee | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [noticeLoading, setNoticeLoading] = useState(false);

  // State for changing employee role
  const [roleTargetEmp, setRoleTargetEmp] = useState<Employee | null>(null);

  const handleOpenRoleModal = (emp: Employee) => {
    setRoleTargetEmp(emp);
  };

  const handleRoleUpdated = (updated: Employee) => {
    setRoleTargetEmp(null);
    if (onRefresh) onRefresh();
  };

  const query = search.trim().toLowerCase();
  const filtered = employees.filter((emp) => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    const dept = (emp.departmentName || '').toLowerCase();
    const desig = (emp.designationTitle || '').toLowerCase();
    const phone = (emp.phone || '').toLowerCase();

    const matchesSearch =
      !query ||
      fullName.includes(query) ||
      email.includes(query) ||
      code.includes(query) ||
      dept.includes(query) ||
      desig.includes(query) ||
      phone.includes(query);

    let matchesStatus = true;
    if (selectedStatus === 'Active') {
      matchesStatus = (emp.status || '').toLowerCase() !== 'inactive';
    } else if (selectedStatus === 'Inactive') {
      matchesStatus = (emp.status || '').toLowerCase() === 'inactive';
    } else if (selectedStatus === 'All') {
      matchesStatus = true;
    }

    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedRows.length === filtered.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filtered.map((e) => e.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleOpenRemoveModal = (emp: Employee) => {
    setRemovingEmp(emp);
  };

  const handleConfirmRemoveEmployee = async () => {
    if (!removingEmp) return;
    setRemoveLoading(true);
    try {
      const res = await api.deleteEmployee(removingEmp.id);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Employee Removed',
          message: res.message || `${removingEmp.firstName} ${removingEmp.lastName} removed from staff.`,
        });
        setRemovingEmp(null);
        if (onRefresh) onRefresh();
      } else {
        showToast({
          type: 'error',
          title: 'Remove Failed',
          message: res.message || 'Could not remove employee.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to remove employee.',
      });
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleOpenNoticeModal = (emp: Employee) => {
    setNoticeTargetEmp(emp);
    setNoticeTitle(`Official Circular for ${emp.firstName} ${emp.lastName}`);
    setNoticeContent('');
    setNoticePriority('Medium');
  };

  const handleConfirmSendNotice = async () => {
    if (!noticeTargetEmp) return;
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      showToast({
        type: 'warning',
        title: 'Incomplete Notice',
        message: 'Please provide both notice title and content.',
      });
      return;
    }

    setNoticeLoading(true);
    try {
      await api.createAnnouncement({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        targetAudience: 'Individual',
        targetEmployeeId: noticeTargetEmp.id,
        targetEmployeeName: `${noticeTargetEmp.firstName} ${noticeTargetEmp.lastName}`,
        departmentName: noticeTargetEmp.departmentName,
        priority: noticePriority,
        authorName: `${user.firstName || 'Keyur'} ${user.lastName || 'Sangani'} (HR & Admin)`,
        authorRole: 'Administration',
      });

      showToast({
        type: 'success',
        title: 'Notice Sent',
        message: `Notice dispatched to ${noticeTargetEmp.firstName} ${noticeTargetEmp.lastName}.`,
      });
      setNoticeTargetEmp(null);
      setNoticeTitle('');
      setNoticeContent('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Send Failed',
        message: err.message || 'Could not send notice.',
      });
    } finally {
      setNoticeLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employees</h1>
          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Sending bulk email...')}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Email"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={() => alert('Viewing organisation chart...')}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Organisation Chart"
          >
            <Network className="w-4 h-4" />
          </button>
          <button
            onClick={() => alert('More employee options')}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            title="More actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input matching Clan.biz */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search name, email, department, role, or ID (Press /)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">
              /
            </span>
          )}
        </div>

        {/* Dropdown Filters and View Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active status dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="Active">Active</option>
              <option value="All">All Statuses</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Any joining date dropdown */}
          <div className="relative">
            <select
              value={selectedJoining}
              onChange={(e) => setSelectedJoining(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="Any">Any joining date</option>
              <option value="Oct2026">October 2026</option>
              <option value="ThisYear">This Year</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filters icon button */}
          <button
            onClick={() => alert('Filter panel')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
          </button>

          {/* View Mode Controls */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button className="p-1.5 rounded-lg bg-slate-100 text-slate-900" title="Table View">
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800" title="List View">
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => alert('Column customizer')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Columns className="w-3.5 h-3.5 text-slate-500" />
            <span>Columns</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table info header */}
        <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-500 font-medium">
          1–{filtered.length} of {filtered.length}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-bold">EMPLOYEE ID</th>
                <th className="py-3 px-4 font-bold">NAME</th>
                <th className="py-3 px-4 font-bold">EMAIL</th>
                <th className="py-3 px-4 font-bold">USER ROLE</th>
                <th className="py-3 px-4 font-bold">REPORTING TO</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
                {portalMode === 'admin' && (
                  <th className="py-3 px-4 font-bold text-right">ACTIONS</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((emp) => {
                const isCurrentUser =
                  emp.email === (user.email || 'keyur.sangani1234@gmail.com') ||
                  emp.firstName === 'Keyur';
                const isSelected = selectedRows.includes(emp.id);

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/30 hover:bg-slate-50/70'
                        : 'hover:bg-slate-50/70'
                    }`}
                    onClick={() => onSelectEmployee(emp)}
                  >
                    <td
                      className="py-3 px-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectRow(emp.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{emp.employeeCode || 'EMP-1'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full font-semibold text-xs border flex items-center justify-center shrink-0 bg-slate-100 text-slate-700 border-slate-200">
                          {emp.firstName[0]}
                          {emp.lastName ? emp.lastName[0] : ''}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">
                            {emp.firstName} {emp.lastName}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              It's you
                            </span>
                          )}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                            New Hire
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {emp.email}
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const roleDef = getRoleDefinition(emp.role || 'EMPLOYEE');
                        return (
                          <div className="flex flex-col gap-1 items-start">
                            <button
                              type="button"
                              disabled={portalMode !== 'admin'}
                              onClick={(e) => {
                                if (portalMode === 'admin') {
                                  e.stopPropagation();
                                  handleOpenRoleModal(emp);
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                roleDef.badgeClass
                              } ${
                                portalMode === 'admin'
                                  ? 'hover:ring-2 hover:ring-indigo-400/50 hover:shadow-xs cursor-pointer'
                                  : 'cursor-default'
                              }`}
                              title={
                                portalMode === 'admin'
                                  ? `Click to change role (Current: ${roleDef.label})`
                                  : roleDef.description
                              }
                            >
                              <Shield className="w-3 h-3 shrink-0" />
                              <span>{roleDef.label}</span>
                            </button>
                            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                              {emp.designationTitle || 'Staff Member'}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {emp.reportingManagerName || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {emp.status?.toLowerCase() === 'inactive' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Inactive</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      )}
                    </td>

                    {portalMode === 'admin' && (
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            id={`btn-chat-${emp.id}`}
                            onClick={() => onOpenChatWithEmployee?.(emp.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                            title="Chat with employee"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Chat</span>
                          </button>

                          <button
                            id={`btn-role-${emp.id}`}
                            onClick={() => handleOpenRoleModal(emp)}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                            title="Change system role (Admin/HR/Manager/Team Leader/Employee)"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Role</span>
                          </button>

                          <button
                            id={`btn-notice-${emp.id}`}
                            onClick={() => handleOpenNoticeModal(emp)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                            title="Send notice to employee"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Notice</span>
                          </button>

                          {!isCurrentUser && (
                            <button
                              id={`btn-remove-${emp.id}`}
                              onClick={() => handleOpenRemoveModal(emp)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                              title="Remove employee from staff"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span>
              1–{filtered.length} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center cursor-not-allowed"
              >
                ‹
              </button>
              <button className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                1
              </button>
              <button
                disabled
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center cursor-not-allowed"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern In-App Remove Employee Confirmation Modal */}
      {removingEmp && (
        <div
          id="remove-employee-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRemovingEmp(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Employee?</h3>
                <p className="text-xs text-slate-500">Staff roster modification</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">{removingEmp.firstName} {removingEmp.lastName}</strong> ({removingEmp.employeeCode}) from the company staff roster?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                id="btn-cancel-remove-emp"
                type="button"
                onClick={() => setRemovingEmp(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-remove-emp"
                type="button"
                onClick={handleConfirmRemoveEmployee}
                disabled={removeLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {removeLoading ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern In-App Send Notice Modal */}
      {noticeTargetEmp && (
        <div
          id="send-notice-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNoticeTargetEmp(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Send Notice to {noticeTargetEmp.firstName} {noticeTargetEmp.lastName}
                  </h3>
                  <p className="text-[11px] text-slate-500">{noticeTargetEmp.employeeCode} &bull; {noticeTargetEmp.departmentName}</p>
                </div>
              </div>
              <button
                onClick={() => setNoticeTargetEmp(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Notice Subject / Title
                </label>
                <input
                  id="input-notice-title"
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Schedule Update, Mandatory Training, Performance Note..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Priority
                </label>
                <select
                  id="select-notice-priority"
                  value={noticePriority}
                  onChange={(e) => setNoticePriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none cursor-pointer bg-white"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent / Important Notice</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Notice Details / Content
                </label>
                <textarea
                  id="textarea-notice-content"
                  rows={4}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Type the message or instructions for the employee..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                id="btn-cancel-send-notice"
                type="button"
                onClick={() => setNoticeTargetEmp(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-send-notice"
                type="button"
                onClick={handleConfirmSendNotice}
                disabled={noticeLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{noticeLoading ? 'Sending...' : 'Send Notice'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      <ChangeRoleModal
        isOpen={Boolean(roleTargetEmp)}
        onClose={() => setRoleTargetEmp(null)}
        employee={roleTargetEmp}
        onSuccess={handleRoleUpdated}
      />
    </div>
  );
};
