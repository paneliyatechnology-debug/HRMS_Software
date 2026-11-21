'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

function userToEmployee(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  gender?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  role?: string;
  status?: string;
  companyId?: string | null;
  companyName?: string | null;
}): Employee {
  const gender = user.gender === 'Male' || user.gender === 'Female' || user.gender === 'Other' ? user.gender : 'Other';
  return {
    id: user.id,
    employeeCode: '',
    companyId: user.companyId || '',
    companyName: user.companyName || '',
    role: (user.role || 'EMPLOYEE') as Employee['role'],
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || '',
    gender,
    dateOfBirth: '',
    address: user.address || '',
    emergencyContact: { name: '', relationship: '', phone: '' },
    joiningDate: '',
    employmentType: 'Full-time',
    status: user.status === 'Inactive' ? 'Inactive' : 'Active',
    departmentId: '',
    departmentName: '',
    designationId: '',
    designationTitle: '',
    workLocationId: '',
    workLocationName: '',
    shift: '',
    bankDetails: { bankName: '', accountNumber: '', ifscOrRouting: '', accountHolderName: '' },
    taxInformation: { taxId: '', panOrSsn: '', taxRegime: '' },
    education: [],
    previousExperience: [],
    skills: [],
    salary: { basic: 0, allowances: 0, deductions: 0, net: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as Employee;
}

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
  const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedJoining, setSelectedJoining] = useState('Any');

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadLiveEmployees = async () => {
    try {
      setFetchLoading(true);
      const res = await api.listUsers({
        page,
        limit,
        search: search.trim() || undefined,
        status: selectedStatus === 'All' ? undefined : selectedStatus,
      });
      const rows = Array.isArray(res?.data) ? res.data.map(userToEmployee) : [];
      setLocalEmployees(rows);
      setTotal(Number(res?.total || 0));
      setTotalPages(Math.max(1, Number(res?.totalPages || 1)));
    } catch (err) {
      console.warn('EmployeesModule live fetch error:', err);
      setLocalEmployees([]);
      setTotal(0);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLiveEmployees();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [page, limit, search, selectedStatus]);

  useEffect(() => {
    const reload = () => {
      setPage(1);
      void loadLiveEmployees();
    };
    window.addEventListener('hrms_employees_updated', reload);
    return () => window.removeEventListener('hrms_employees_updated', reload);
  }, [limit, search, selectedStatus]);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
  useEffect(() => {
    const isAnyOpen = !!removingEmp || !!noticeTargetEmp;
    if (!isAnyOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (removingEmp) setRemovingEmp(null);
        if (noticeTargetEmp) setNoticeTargetEmp(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [removingEmp, noticeTargetEmp]);

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
    loadLiveEmployees();
    if (onRefresh) onRefresh();
  };

  const filtered = localEmployees;
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

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
      const empIdToDelete = removingEmp.id || (removingEmp as any).employeeId || '';
      const payload = {
        firstName: removingEmp.firstName || '',
        lastName: removingEmp.lastName || '',
        phone: removingEmp.phone || '',
        status: removingEmp.status || 'Active',
      };
      const res = await api.deleteEmployee(empIdToDelete, payload);

      showToast({
        type: 'success',
        title: 'Employee Removed',
        message: res?.message || `${removingEmp.firstName} ${removingEmp.lastName} removed from staff.`,
      });

      // Optimistically remove from local state immediately
      setLocalEmployees((prev) => prev.filter((e) => e.id !== removingEmp.id && e.id !== empIdToDelete));
      setRemovingEmp(null);

      // Re-fetch live employees from backend to maintain absolute data integrity
      await loadLiveEmployees();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Remove Failed',
        message: err.message || 'Failed to remove employee.',
      });
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleToggleEmployeeStatus = async (emp: Employee, targetStatus: 'Active' | 'Inactive') => {
    const empId = emp.id || (emp as any).employeeId;
    if (!empId) return;

    setStatusLoadingId(empId);
    try {
      if (targetStatus === 'Inactive') {
        // EXACT API: DELETE /api/employees/{id}
        await api.deactivateEmployee(empId);
        showToast({
          type: 'success',
          title: 'Status Updated',
          message: `${emp.firstName} ${emp.lastName} marked as Inactive.`,
        });
      } else {
        // Activate: PUT /api/employees/{id}
        await api.activateEmployee(empId);
        showToast({
          type: 'success',
          title: 'Status Updated',
          message: `${emp.firstName} ${emp.lastName} marked as Active.`,
        });
      }

      setLocalEmployees((prev) =>
        prev.map((e) => (e.id === empId ? { ...e, status: targetStatus } : e))
      );

      await loadLiveEmployees();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || `Failed to update status to ${targetStatus}.`,
      });
    } finally {
      setStatusLoadingId(null);
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
        authorName: `${user.firstName || 'HR'} ${user.lastName || 'Admin'} (HR & Admin)`,
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
            {total} {total === 1 ? 'user' : 'users'}
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
          />
          {search ? (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
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
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
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
        <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-500 font-medium flex items-center justify-between">
          <span>{fetchLoading ? 'Loading users...' : `${rangeStart}–${rangeEnd} of ${total}`}</span>
          <span className="text-[11px] text-slate-400 md:hidden">Tap card to view full profile</span>
        </div>

        {/* Mobile Cards Roster (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No employees found matching &quot;{search}&quot;
            </div>
          ) : (
            filtered.map((emp, empIdx) => {
              const isCurrentUser =
                emp.email === user.email ||
                emp.id === user.employeeId ||
                emp.id === user.id;
              const isSelected = selectedRows.includes(emp.id);
              const roleDef = getRoleDefinition(emp.role || 'EMPLOYEE');

              return (
                <div
                  key={emp.id ? `${emp.id}-${empIdx}` : empIdx}
                  className={`p-3.5 space-y-2.5 transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50/70'
                    }`}
                  onClick={() => onSelectEmployee(emp)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full font-bold text-xs border flex items-center justify-center shrink-0 bg-slate-100 text-slate-700 border-slate-200 overflow-hidden">
                        {emp.avatarUrl ? (
                          <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            {emp.firstName[0]}
                            {emp.lastName ? emp.lastName[0] : ''}
                          </>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {emp.firstName} {emp.lastName}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {emp.employeeCode || 'EMP'} • {emp.departmentName || 'General'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {portalMode === 'admin' ? (
                        <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200/80 shadow-2xs">
                          <button
                            type="button"
                            disabled={statusLoadingId === emp.id || (emp.status || '').toLowerCase() === 'active'}
                            onClick={() => handleToggleEmployeeStatus(emp, 'Active')}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${(emp.status || '').toLowerCase() === 'active'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                              }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${(emp.status || '').toLowerCase() === 'active' ? 'bg-white' : 'bg-slate-400'}`} />
                            Active
                          </button>
                          <button
                            type="button"
                            disabled={statusLoadingId === emp.id || (emp.status || '').toLowerCase() === 'inactive'}
                            onClick={() => handleToggleEmployeeStatus(emp, 'Inactive')}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${(emp.status || '').toLowerCase() === 'inactive'
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                              }`}
                          >
                            {statusLoadingId === emp.id ? (
                              <span className="w-2.5 h-2.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className={`w-1.5 h-1.5 rounded-full ${(emp.status || '').toLowerCase() === 'inactive' ? 'bg-white' : 'bg-slate-400'}`} />
                            )}
                            Inactive
                          </button>
                        </div>
                      ) : (
                        emp.status?.toLowerCase() === 'inactive' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Inactive</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 gap-2 pt-1 border-t border-slate-50">
                    <span className="truncate text-[11px]">{emp.email}</span>
                    <button
                      type="button"
                      disabled={portalMode !== 'admin'}
                      onClick={(e) => {
                        if (portalMode === 'admin') {
                          e.stopPropagation();
                          handleOpenRoleModal(emp);
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${roleDef.badgeClass}`}
                    >
                      <Shield className="w-2.5 h-2.5 shrink-0" />
                      <span>{roleDef.label}</span>
                    </button>
                  </div>

                  {portalMode === 'admin' && (
                    <div className="flex items-center justify-end gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                      {onOpenChatWithEmployee && (
                        <button
                          type="button"
                          onClick={() => onOpenChatWithEmployee(emp.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1"
                          title="Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chat</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenNoticeModal(emp)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1"
                        title="Send Notice"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-600" />
                        <span>Notice</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRemoveModal(emp)}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold"
                        title="Remove Employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[850px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
              {filtered.map((emp, empIdx) => {
                const isCurrentUser =
                  emp.email === user.email ||
                  emp.id === user.employeeId ||
                  emp.id === user.id;
                const isSelected = selectedRows.includes(emp.id);

                return (
                  <tr
                    key={emp.id ? `${emp.id}-${empIdx}` : empIdx}
                    className={`transition-colors cursor-pointer ${isSelected
                      ? 'bg-emerald-50/30 hover:bg-slate-50/70'
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
                        onChange={() => { }}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{emp.employeeCode || 'EMP-1'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full font-semibold text-xs border flex items-center justify-center shrink-0 bg-slate-100 text-slate-700 border-slate-200 overflow-hidden">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              {emp.firstName[0]}
                              {emp.lastName ? emp.lastName[0] : ''}
                            </>
                          )}
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
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${roleDef.badgeClass
                                } ${portalMode === 'admin'
                                  ? 'hover:ring-2 hover:ring-emerald-400/50 hover:shadow-xs cursor-pointer'
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
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {portalMode === 'admin' ? (
                        <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200/80 shadow-2xs">
                          <button
                            type="button"
                            disabled={statusLoadingId === emp.id || (emp.status || '').toLowerCase() === 'active'}
                            onClick={() => handleToggleEmployeeStatus(emp, 'Active')}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${(emp.status || '').toLowerCase() === 'active'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                              }`}
                            title="Set status to Active"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${(emp.status || '').toLowerCase() === 'active' ? 'bg-white' : 'bg-slate-400'}`} />
                            <span>Active</span>
                          </button>
                          <button
                            type="button"
                            disabled={statusLoadingId === emp.id || (emp.status || '').toLowerCase() === 'inactive'}
                            onClick={() => handleToggleEmployeeStatus(emp, 'Inactive')}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${(emp.status || '').toLowerCase() === 'inactive'
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                              }`}
                            title="Set status to Inactive (DELETE /api/employees/{id})"
                          >
                            {statusLoadingId === emp.id ? (
                              <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className={`w-1.5 h-1.5 rounded-full ${(emp.status || '').toLowerCase() === 'inactive' ? 'bg-white' : 'bg-slate-400'}`} />
                            )}
                            <span>Inactive</span>
                          </button>
                        </div>
                      ) : (
                        emp.status?.toLowerCase() === 'inactive' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Inactive</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </span>
                        )
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
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
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
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span>
              {rangeStart}–{rangeEnd} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-center disabled:text-slate-300 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              <button type="button" className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                {page}
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-center disabled:text-slate-300 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern In-App Remove Employee Confirmation Modal */}
      {mounted && removingEmp && typeof document !== 'undefined' && createPortal(
        <div
          id="remove-employee-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRemovingEmp(null);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
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
        </div>,
        document.body
      )}

      {/* Modern In-App Send Notice Modal */}
      {mounted && noticeTargetEmp && typeof document !== 'undefined' && createPortal(
        <div
          id="send-notice-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNoticeTargetEmp(null);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs shrink-0">
                  <Bell className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Send Notice
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                      Direct Notice
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    To: <strong className="text-slate-700">{noticeTargetEmp.firstName} {noticeTargetEmp.lastName}</strong> ({noticeTargetEmp.employeeCode} • {noticeTargetEmp.departmentName || 'Staff'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNoticeTargetEmp(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">
                  Notice Subject / Title *
                </label>
                <input
                  id="input-notice-title"
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Schedule Update, Mandatory Training, Performance Note..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">
                  Urgency / Priority Level
                </label>
                <select
                  id="select-notice-priority"
                  value={noticePriority}
                  onChange={(e) => setNoticePriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium cursor-pointer"
                >
                  <option value="Low">🟢 Low Priority (General Notice)</option>
                  <option value="Medium">🔵 Medium Priority (Standard Notice)</option>
                  <option value="High">🟠 High Priority (Action Required)</option>
                  <option value="Urgent">🔴 Urgent Notice (Immediate Attention)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">
                  Notice Details / Content *
                </label>
                <textarea
                  id="textarea-notice-content"
                  rows={4}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Type the message or instructions for the employee..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium placeholder:text-slate-400 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100">
              <button
                id="btn-cancel-send-notice"
                type="button"
                onClick={() => setNoticeTargetEmp(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-send-notice"
                type="button"
                onClick={handleConfirmSendNotice}
                disabled={noticeLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{noticeLoading ? 'Sending...' : 'Send Notice'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
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
