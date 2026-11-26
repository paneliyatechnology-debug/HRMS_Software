'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Plus,
  ChevronDown,
  Info,
  Check,
  Trash2,
  Bell,
  X,
  AlertCircle,
  Send,
  MessageSquare,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { Employee, Department } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';
import { useCompanyLive } from '../../lib/useCompanyLive';
import { getRoleDefinition } from '../../lib/roleConfig';
import { canDeleteUser } from '../../lib/rolePermissions';

interface EmployeesModuleProps {
  employees: Employee[];
  departments: Department[];
  onSelectEmployee: (emp: Employee) => void;
  onOpenAddModal: () => void;
  onRefresh?: () => void;
  onOpenChatWithEmployee?: (empId: string) => void;
  portalMode?: 'employee' | 'admin';
  loading?: boolean;
}

export const EmployeesModule: React.FC<EmployeesModuleProps> = ({
  employees,
  departments,
  onSelectEmployee,
  onOpenAddModal,
  onRefresh,
  onOpenChatWithEmployee,
  portalMode = 'admin',
  loading = false,
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const [localEmployees, setLocalEmployees] = useState<Employee[]>(employees || []);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canReviewPhotos = ['ADMIN', 'SUPER_ADMIN', 'HR', 'HR_ADMIN', 'COMPANY_ADMIN', 'ORG_ADMIN'].includes(String(user?.role || '').toUpperCase());
  const loadPhotoRequests = async () => {
    if (!canReviewPhotos) return;
    try {
      setPhotoRequests(await api.listPhotoRequests());
    } catch {
      setPhotoRequests([]);
    }
  };
  useEffect(() => {
    void loadPhotoRequests();
  }, [canReviewPhotos]);
  useCompanyLive(['employees'], () => {
    void loadPhotoRequests();
  });
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedJoining, setSelectedJoining] = useState('Any');
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [photoRequests, setPhotoRequests] = useState<Array<{ id: string; userName: string; role: string; email: string }>>([]);
  const [photoRequestBusy, setPhotoRequestBusy] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (employees && employees.length > 0) {
      setLocalEmployees(employees);
    }
  }, [employees]);

  // Live backend API fetch
  const loadLiveEmployees = async () => {
    try {
      setFetchLoading(true);
      const res = await api.getEmployees();
      if (Array.isArray(res) && res.length > 0) {
        setLocalEmployees(res);
      }
    } catch (err) {
      console.warn('EmployeesModule live fetch error:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (!employees || employees.length === 0) {
      loadLiveEmployees();
    }
  }, [employees]);

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

  const sourceEmployees = localEmployees.length > 0 ? localEmployees : (employees || []);
  const query = search.trim().toLowerCase();
  const filtered = sourceEmployees.filter((emp) => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    const dept = (emp.departmentName || '').toLowerCase();
    const desig = (emp.designationTitle || '').toLowerCase();
    const phone = (emp.phone || '').toLowerCase();
    const role = (emp.role || '').toLowerCase();

    const matchesSearch =
      !query ||
      fullName.includes(query) ||
      email.includes(query) ||
      code.includes(query) ||
      dept.includes(query) ||
      desig.includes(query) ||
      phone.includes(query) ||
      role.includes(query);

    let matchesStatus = true;
    if (selectedStatus === 'Active') {
      matchesStatus = (emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation';
    } else if (selectedStatus === 'Inactive') {
      matchesStatus = (emp.status || '').toLowerCase() === 'inactive';
    } else if (selectedStatus === 'All') {
      matchesStatus = true;
    }

    let matchesRole = true;
    if (selectedRole !== 'All') {
      matchesRole = (emp.role || 'EMPLOYEE').toUpperCase() === selectedRole.toUpperCase();
    }

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleOpenRemoveModal = (emp: Employee) => {
    setRemovingEmp(emp);
  };

  const handleConfirmRemoveEmployee = async () => {
    if (!removingEmp) return;
    if (!canDeleteUser(user)) {
      showToast({
        type: 'error',
        title: 'Permission Denied',
        message: 'Only Admin and HR have permission to delete users.',
      });
      return;
    }
    setRemoveLoading(true);
    try {
      const empIdToDelete = removingEmp.id || (removingEmp as any).userId || (removingEmp as any)._id || (removingEmp as any).employeeId || '';
      const payload = {
        firstName: removingEmp.firstName || '',
        lastName: removingEmp.lastName || '',
        phone: removingEmp.phone || '',
        status: removingEmp.status || 'Active',
      };
      const res = await api.deleteEmployee(empIdToDelete);

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
    <div className="space-y-5 w-full select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#e9ecef]">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {canReviewPhotos && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-xs font-black text-amber-950">Profile photo change requests</p>
          <p className="text-[11px] text-amber-900">Employee, HR, and Manager can upload a photo once. Admin or HR can approve one new upload.</p>
          {photoRequests.length === 0 && (
            <p className="text-xs font-semibold text-slate-500">No pending requests.</p>
          )}
          {photoRequests.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white border border-amber-100 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{item.userName || item.email}</p>
                <p className="text-[11px] text-slate-500">{item.role} · {item.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={photoRequestBusy === item.id}
                  onClick={async () => {
                    setPhotoRequestBusy(item.id);
                    try {
                      const result = await api.reviewPhotoRequest(item.id, true);
                      showToast({ type: 'success', title: 'Approved', message: result.message });
                      await loadPhotoRequests();
                    } catch (err: any) {
                      showToast({ type: 'error', title: 'Could not approve', message: err.message || 'Try again.' });
                    } finally {
                      setPhotoRequestBusy(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={photoRequestBusy === item.id}
                  onClick={async () => {
                    setPhotoRequestBusy(item.id);
                    try {
                      const result = await api.reviewPhotoRequest(item.id, false);
                      showToast({ type: 'success', title: 'Rejected', message: result.message });
                      await loadPhotoRequests();
                    } catch (err: any) {
                      showToast({ type: 'error', title: 'Could not reject', message: err.message || 'Try again.' });
                    } finally {
                      setPhotoRequestBusy(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 text-xs font-bold disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Role filter dropdown */}
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="All">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
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
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table info header */}
        <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-500 font-medium flex items-center justify-between">
          <span>1–{filtered.length} of {filtered.length}</span>
          <span className="text-[11px] text-slate-400 md:hidden">Tap card to view full profile</span>
        </div>

        {/* Mobile Cards Roster (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {(loading || fetchLoading) && localEmployees.length === 0 ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={`skel-emp-m-${idx}`} className="p-3.5 space-y-2.5 animate-pulse">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                      <div className="space-y-1">
                        <div className="w-28 h-3.5 bg-slate-200 rounded" />
                        <div className="w-16 h-2.5 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="w-14 h-5 bg-slate-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">No employees found</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                No staff members match &quot;{search || selectedRole || selectedStatus}&quot;. Try resetting your filters.
              </p>
              {(search || selectedStatus !== 'Active' || selectedRole !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedStatus('Active');
                    setSelectedRole('All');
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          ) : (
            filtered.map((emp, empIdx) => {
              const isCurrentUser =
                emp.email === user.email ||
                emp.id === user.employeeId ||
                emp.id === user.id;
              const roleDef = getRoleDefinition(emp.role || 'EMPLOYEE');

              return (
                <div
                  key={emp.id ? `${emp.id}-${empIdx}` : empIdx}
                  className="p-3.5 space-y-2.5 transition-colors cursor-pointer hover:bg-slate-50/70"
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
                        <button
                          type="button"
                          role="switch"
                          aria-checked={(emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation'}
                          disabled={statusLoadingId === emp.id}
                          onClick={() => {
                            const isAct = (emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation';
                            handleToggleEmployeeStatus(emp, isAct ? 'Inactive' : 'Active');
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer disabled:opacity-50 ${
                            (emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation'
                              ? 'bg-[#2d6a4f]'
                              : 'bg-slate-300'
                          }`}
                          title={
                            (emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation'
                              ? 'Active — Click to deactivate'
                              : 'Inactive — Click to activate'
                          }
                        >
                          <span
                            className={`inline-flex items-center justify-center h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                              (emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation'
                                ? 'translate-x-4.5'
                                : 'translate-x-1'
                            }`}
                          >
                            {statusLoadingId === emp.id ? (
                              <span className="block w-2 h-2 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                            ) : (emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation' ? (
                              <Check className="w-2.5 h-2.5 text-[#2d6a4f]" strokeWidth={3} />
                            ) : (
                              <X className="w-2.5 h-2.5 text-slate-400" strokeWidth={3} />
                            )}
                          </span>
                        </button>
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
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${roleDef.badgeClass}`}
                      title={roleDef.description}
                    >
                      <Shield className="w-2.5 h-2.5 shrink-0" />
                      <span>{roleDef.label}</span>
                    </span>
                  </div>

                  {portalMode === 'admin' && (
                    <div className="flex items-center justify-end gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                      {onOpenChatWithEmployee && (
                        <button
                          type="button"
                          onClick={() => onOpenChatWithEmployee(emp.id)}
                          className="group inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 text-xs font-semibold transition-all duration-200 cursor-pointer"
                          title="Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[64px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-200 whitespace-nowrap">
                            Chat
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenNoticeModal(emp)}
                        className="group inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200 text-slate-600 hover:text-amber-700 text-xs font-semibold transition-all duration-200 cursor-pointer"
                        title="Send Notice"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[64px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-200 whitespace-nowrap">
                          Notice
                        </span>
                      </button>
                      {canDeleteUser(user) && !isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => handleOpenRemoveModal(emp)}
                          className="group inline-flex items-center justify-center p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 text-xs font-semibold transition-all duration-200 cursor-pointer"
                          title="Remove Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[64px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-200 whitespace-nowrap">
                            Remove
                          </span>
                        </button>
                      )}
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
              {(loading || fetchLoading) && localEmployees.length === 0 ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skel-emp-d-${idx}`} className="animate-pulse">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                      <div className="space-y-1">
                        <div className="w-28 h-3.5 bg-slate-200 rounded" />
                        <div className="w-16 h-2.5 bg-slate-100 rounded" />
                      </div>
                    </td>
                    <td className="py-3 px-4"><div className="w-20 h-3.5 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-4"><div className="w-24 h-3.5 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-4"><div className="w-24 h-3.5 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-4"><div className="w-16 h-5 bg-slate-100 rounded-full" /></td>
                    <td className="py-3 px-4 text-right"><div className="w-14 h-6 bg-slate-100 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={portalMode === 'admin' ? 7 : 6} className="py-14 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">No Employees Found</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          No staff members match your search &quot;{search || selectedRole || selectedStatus}&quot;.
                        </p>
                      </div>
                      {(search || selectedStatus !== 'Active' || selectedRole !== 'All') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('');
                            setSelectedStatus('Active');
                            setSelectedRole('All');
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Clear Filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((emp, empIdx) => {
                const isCurrentUser =
                  emp.email === user.email ||
                  emp.id === user.employeeId ||
                  emp.id === user.id;

                return (
                  <tr
                    key={emp.id ? `${emp.id}-${empIdx}` : empIdx}
                    className="transition-colors cursor-pointer hover:bg-slate-50/70"
                    onClick={() => onSelectEmployee(emp)}
                  >
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
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${roleDef.badgeClass}`}
                            title={roleDef.description}
                          >
                            <Shield className="w-3 h-3 shrink-0" />
                            <span>{roleDef.label}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {emp.reportingManagerName || '—'}
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {portalMode === 'admin' ? (
                        <div className="flex items-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={(emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation'}
                            disabled={statusLoadingId === emp.id}
                            onClick={() => {
                              const isAct = (emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation';
                              handleToggleEmployeeStatus(emp, isAct ? 'Inactive' : 'Active');
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer disabled:opacity-50 ${
                              (emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation'
                                ? 'bg-[#2d6a4f]'
                                : 'bg-slate-300'
                            }`}
                            title={
                              (emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation'
                                ? 'Active — Click to deactivate'
                                : 'Inactive — Click to activate'
                            }
                          >
                            <span
                              className={`inline-flex items-center justify-center h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                (emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation'
                                  ? 'translate-x-4.5'
                                  : 'translate-x-1'
                              }`}
                            >
                              {statusLoadingId === emp.id ? (
                                <span className="block w-2 h-2 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                              ) : (emp.status || '').toLowerCase() === 'active' || (emp.status || '').toLowerCase() === 'probation' ? (
                                <Check className="w-2.5 h-2.5 text-[#2d6a4f]" strokeWidth={3} />
                              ) : (
                                <X className="w-2.5 h-2.5 text-slate-400" strokeWidth={3} />
                              )}
                            </span>
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
                            type="button"
                            id={`btn-chat-${emp.id}`}
                            onClick={() => onOpenChatWithEmployee?.(emp.id)}
                            className="group inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs shadow-2xs transition-all duration-200 cursor-pointer"
                            title="Chat with employee"
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[64px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-200 whitespace-nowrap">
                              Chat
                            </span>
                          </button>

                          <button
                            type="button"
                            id={`btn-notice-${emp.id}`}
                            onClick={() => handleOpenNoticeModal(emp)}
                            className="group inline-flex items-center justify-center p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs shadow-2xs transition-all duration-200 cursor-pointer"
                            title="Send notice to employee"
                          >
                            <Bell className="w-3.5 h-3.5 shrink-0" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[64px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-200 whitespace-nowrap">
                              Notice
                            </span>
                          </button>

                          {canDeleteUser(user) && !isCurrentUser && (
                            <button
                              type="button"
                              id={`btn-remove-${emp.id}`}
                              onClick={() => handleOpenRemoveModal(emp)}
                              className="group inline-flex items-center justify-center p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-all duration-200 cursor-pointer"
                              title="Remove employee from staff"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[64px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-200 whitespace-nowrap">
                                Remove
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              }))}
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
      {mounted && removingEmp && typeof document !== 'undefined' && createPortal(
        <div
          id="remove-employee-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRemovingEmp(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">Remove Employee?</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">Staff roster modification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRemovingEmp(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-900">{removingEmp.firstName} {removingEmp.lastName}</strong> ({removingEmp.employeeCode}) from the company staff roster?
              </p>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                id="btn-cancel-remove-emp"
                type="button"
                onClick={() => setRemovingEmp(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-remove-emp"
                type="button"
                onClick={handleConfirmRemoveEmployee}
                disabled={removeLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      Send Notice
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                      Direct Notice
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    To: <strong className="text-slate-700">{noticeTargetEmp.firstName} {noticeTargetEmp.lastName}</strong> ({noticeTargetEmp.employeeCode} • {noticeTargetEmp.departmentName || 'Staff'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNoticeTargetEmp(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium placeholder:text-slate-400"
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium cursor-pointer"
                >
                  <option value="Low">Low Priority (General Notice)</option>
                  <option value="Medium">Medium Priority (Standard Notice)</option>
                  <option value="High">High Priority (Action Required)</option>
                  <option value="Urgent">Urgent Notice (Immediate Attention)</option>
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
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium placeholder:text-slate-400 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                id="btn-cancel-send-notice"
                type="button"
                onClick={() => setNoticeTargetEmp(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-send-notice"
                type="button"
                onClick={handleConfirmSendNotice}
                disabled={noticeLoading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{noticeLoading ? 'Sending...' : 'Send Notice'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
