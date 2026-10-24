'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Shield,
  ShieldCheck,
  UserPlus,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Lock,
  ExternalLink,
  Clock,
  Briefcase,
  Layers,
  CircleDollarSign,
  UserCheck,
  Power,
  RotateCcw,
} from 'lucide-react';
import { Employee, Department, AttendanceRecord } from '../../types/hrms';
import {
  CompanyTenant,
  getAllCompanies,
  createCompany,
  updateCompany,
  toggleCompanyStatus,
  getCompanyEmployees,
  addEmployeeToCompany,
  removeEmployeeFromCompany,
} from '../../lib/companyService';
import { useSocket } from '../../context/SocketContext';

interface SuperAdminModuleProps {
  primaryEmployees: Employee[];
  departments?: Department[];
  attendance?: AttendanceRecord[];
  onRefreshData?: () => void;
}

export const SuperAdminModule: React.FC<SuperAdminModuleProps> = ({
  primaryEmployees,
  departments = [],
  attendance = [],
  onRefreshData,
}) => {
  const { showToast } = useSocket();
  const [companies, setCompanies] = useState<CompanyTenant[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'employees' | 'details' | 'admin' | 'departments'>('employees');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Drilldown Employee Search & Filter
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [empFilterDept, setEmpFilterDept] = useState('ALL');

  // Modals
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);

  // Form states: New Company
  const [newCompName, setNewCompName] = useState('');
  const [newCompIndustry, setNewCompIndustry] = useState('Software & IT Services');
  const [newCompPlan, setNewCompPlan] = useState<'Starter' | 'Growth' | 'Enterprise'>('Enterprise');
  const [newCompCity, setNewCompCity] = useState('');
  const [newCompState, setNewCompState] = useState('');
  const [newCompMaxEmps, setNewCompMaxEmps] = useState(100);
  const [newCompAdminName, setNewCompAdminName] = useState('');
  const [newCompAdminEmail, setNewCompAdminEmail] = useState('');
  const [newCompAdminPhone, setNewCompAdminPhone] = useState('');
  const [newCompAdminPassword, setNewCompAdminPassword] = useState('Admin@2026');

  // Form states: New Employee in Company
  const [newEmpFirstName, setNewEmpFirstName] = useState('');
  const [newEmpLastName, setNewEmpLastName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('');
  const [newEmpDesignation, setNewEmpDesignation] = useState('');
  const [newEmpSalary, setNewEmpSalary] = useState(45000);
  const [newEmpType, setNewEmpType] = useState<'Full-time' | 'Remote' | 'Part-time'>('Full-time');

  // Form states: Reset Password
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Form states: Edit Company
  const [editCompName, setEditCompName] = useState('');
  const [editCompIndustry, setEditCompIndustry] = useState('');
  const [editCompAddress, setEditCompAddress] = useState('');
  const [editCompCity, setEditCompCity] = useState('');
  const [editCompState, setEditCompState] = useState('');
  const [editCompMaxEmps, setEditCompMaxEmps] = useState(100);

  // Load companies
  const refreshCompaniesList = () => {
    const list = getAllCompanies();
    const todayStr = new Date().toISOString().split('T')[0];
    const rawPaneliyaDepts = departments && departments.length > 0 ? departments.map((d) => d.name) : [];
    const paneliyaDepts = Array.from(new Set(rawPaneliyaDepts.filter(Boolean)));
    const paneliyaSalaries = (primaryEmployees || []).reduce((sum, e) => sum + (e.salary?.gross || 0), 0);
    const punchesToday = (attendance || []).filter((a) => a.date === todayStr && a.status !== 'Absent').length;

    // Update live counts for Paneliya based strictly on real database API data
    const updated = list.map((c) => {
      const cleanDepts = Array.from(new Set((c.departments || []).filter(Boolean)));
      if (c.id === 'comp-paneliya') {
        return {
          ...c,
          employeesCount: primaryEmployees ? primaryEmployees.length : 0,
          departments: paneliyaDepts.length > 0 ? paneliyaDepts : cleanDepts,
          monthlyPayrollEstimate: paneliyaSalaries,
          activePunchesToday: punchesToday,
        };
      }
      return {
        ...c,
        departments: cleanDepts,
      };
    });
    setCompanies(updated);
  };

  useEffect(() => {
    refreshCompaniesList();
    const handleUpdate = () => refreshCompaniesList();
    window.addEventListener('hrms_companies_updated', handleUpdate);
    window.addEventListener('hrms_tenant_employees_updated', handleUpdate);
    return () => {
      window.removeEventListener('hrms_companies_updated', handleUpdate);
      window.removeEventListener('hrms_tenant_employees_updated', handleUpdate);
    };
  }, [primaryEmployees, departments, attendance]);

  // Selected company object
  const rawSelectedCompany = companies.find((c) => c.id === selectedCompanyId) || null;
  const selectedCompany = rawSelectedCompany
    ? {
        ...rawSelectedCompany,
        departments: Array.from(new Set((rawSelectedCompany.departments || []).filter(Boolean))),
      }
    : null;

  // Memoized unique departments for the selected company
  const selectedCompanyDepartments = React.useMemo(() => {
    if (!selectedCompany?.departments) return [];
    return Array.from(new Set(selectedCompany.departments.filter(Boolean)));
  }, [selectedCompany?.departments]);

  const currentCompanyEmployees = selectedCompany
    ? getCompanyEmployees(selectedCompany.id, primaryEmployees)
    : [];

  // Filtered companies
  // Filtered companies
  const sq = searchQuery.trim().toLowerCase();
  const filteredCompanies = companies.filter((c) => {
    const matchesQuery =
      !sq ||
      (c.name || '').toLowerCase().includes(sq) ||
      (c.code || '').toLowerCase().includes(sq) ||
      (c.adminUser?.fullName || '').toLowerCase().includes(sq) ||
      (c.adminUser?.email || '').toLowerCase().includes(sq) ||
      (c.city || '').toLowerCase().includes(sq);

    const matchesPlan = filterPlan === 'ALL' || (c.plan || '').toUpperCase() === filterPlan;
    const matchesStatus = filterStatus === 'ALL' || (c.status || '').toUpperCase() === filterStatus;

    return matchesQuery && matchesPlan && matchesStatus;
  });

  // Filtered employees under selected company
  const esq = empSearchQuery.trim().toLowerCase();
  const filteredCompanyEmployees = currentCompanyEmployees.filter((emp) => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const desig = (emp.designationTitle || '').toLowerCase();
    const dept = (emp.departmentName || '').toLowerCase();

    const matchesQuery =
      !esq ||
      fullName.includes(esq) ||
      code.includes(esq) ||
      email.includes(esq) ||
      desig.includes(esq) ||
      dept.includes(esq);

    const matchesDept = empFilterDept === 'ALL' || emp.departmentName === empFilterDept;

    return matchesQuery && matchesDept;
  });

  // Calculate platform totals strictly from live database data
  const totalEmployeesAcrossPlatform = companies.reduce(
    (acc, c) => acc + (c.id === 'comp-paneliya' ? (primaryEmployees?.length || 0) : (c.employeesCount || 0)),
    0
  );
  const todayStr = new Date().toISOString().split('T')[0];
  const totalActivePunches = attendance
    ? attendance.filter((a) => a.date === todayStr && a.status !== 'Absent').length
    : 0;

  // Handlers
  const handleToggleStatus = (companyId: string, companyName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = toggleCompanyStatus(companyId);
    showToast({
      type: newStatus === 'Active' ? 'success' : 'warning',
      title: `Company ${newStatus}`,
      message: `${companyName} has been ${newStatus.toLowerCase()}.`,
    });
    refreshCompaniesList();
  };

  const handleCreateCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim() || !newCompAdminEmail.trim() || !newCompAdminName.trim()) {
      showToast({ type: 'error', title: 'Missing Information', message: 'Company name and admin details are required.' });
      return;
    }

    const created = createCompany({
      name: newCompName.trim(),
      industry: newCompIndustry,
      plan: newCompPlan,
      city: newCompCity || 'Surat',
      state: newCompState || 'Gujarat',
      maxEmployees: Number(newCompMaxEmps) || 50,
      adminName: newCompAdminName.trim(),
      adminEmail: newCompAdminEmail.trim().toLowerCase(),
      adminPhone: newCompAdminPhone.trim() || '+91 9876543210',
      temporaryPassword: newCompAdminPassword || 'Admin@2026',
    });

    showToast({
      type: 'success',
      title: 'Company & Admin Created',
      message: `${created.name} registered with Owner ${created.adminUser.fullName}.`,
    });

    setIsAddCompanyModalOpen(false);
    // Reset form
    setNewCompName('');
    setNewCompCity('');
    setNewCompState('');
    setNewCompAdminName('');
    setNewCompAdminEmail('');
    setNewCompAdminPhone('');
    refreshCompaniesList();
  };

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId || !newEmpFirstName.trim() || !newEmpEmail.trim()) {
      showToast({ type: 'error', title: 'Validation Error', message: 'First name and email are required.' });
      return;
    }

    const added = addEmployeeToCompany(
      selectedCompanyId,
      {
        firstName: newEmpFirstName.trim(),
        lastName: newEmpLastName.trim(),
        email: newEmpEmail.trim().toLowerCase(),
        phone: newEmpPhone.trim() || '+91 9876543210',
        departmentName: newEmpDept || selectedCompany?.departments[0] || 'General Administration',
        designationTitle: newEmpDesignation || 'Software Engineer',
        salaryBasic: Number(newEmpSalary) || 45000,
        employmentType: newEmpType,
      },
      primaryEmployees
    );

    showToast({
      type: 'success',
      title: 'Employee Added',
      message: `${added.firstName} ${added.lastName} enrolled under ${selectedCompany?.name}.`,
    });

    setIsAddEmployeeModalOpen(false);
    // Reset form
    setNewEmpFirstName('');
    setNewEmpLastName('');
    setNewEmpEmail('');
    setNewEmpPhone('');
    setNewEmpDesignation('');
    refreshCompaniesList();
    if (onRefreshData) onRefreshData();
  };

  const handleRemoveEmployee = (empId: string, empName: string) => {
    if (!selectedCompanyId) return;
    if (confirm(`Are you sure you want to remove ${empName} from this company?`)) {
      removeEmployeeFromCompany(selectedCompanyId, empId, primaryEmployees);
      showToast({
        type: 'info',
        title: 'Employee Removed',
        message: `${empName} has been removed from ${selectedCompany?.name}.`,
      });
      refreshCompaniesList();
      if (onRefreshData) onRefreshData();
    }
  };

  const handleOpenEditCompanyModal = () => {
    if (!selectedCompany) return;
    setEditCompName(selectedCompany.name);
    setEditCompIndustry(selectedCompany.industry);
    setEditCompAddress(selectedCompany.address);
    setEditCompCity(selectedCompany.city);
    setEditCompState(selectedCompany.state);
    setEditCompMaxEmps(selectedCompany.maxEmployees);
    setIsEditCompanyModalOpen(true);
  };

  const handleSaveCompanyEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) return;

    updateCompany(selectedCompanyId, {
      name: editCompName.trim(),
      industry: editCompIndustry,
      address: editCompAddress,
      city: editCompCity,
      state: editCompState,
      maxEmployees: Number(editCompMaxEmps),
    });

    showToast({
      type: 'success',
      title: 'Company Updated',
      message: `${editCompName} details updated successfully.`,
    });

    setIsEditCompanyModalOpen(false);
    refreshCompaniesList();
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !newPasswordValue.trim()) return;

    updateCompany(selectedCompany.id, {
      adminUser: {
        ...selectedCompany.adminUser,
        password: newPasswordValue.trim(),
      },
    });

    showToast({
      type: 'success',
      title: 'Password Updated',
      message: `Password reset for Admin ${selectedCompany.adminUser.fullName}.`,
    });

    setIsResetPasswordModalOpen(false);
    setNewPasswordValue('');
    refreshCompaniesList();
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in pb-12">
      {/* ================================================================ */}
      {/* VIEW A: MAIN DIRECTORY (ALL COMPANIES & ADMINS)                  */}
      {/* ================================================================ */}
      {!selectedCompany ? (
        <>
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#e4eaf5]">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#152345] tracking-tight">
                  Super Admin Console
                </h1>
                <span className="tag">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-[#6e7b98] mt-1">
                Manage all registered company owners (admins), tenant companies, and their respective workforce rosters
              </p>
            </div>

            <button
              id="btn-onboard-company"
              onClick={() => setIsAddCompanyModalOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Onboard New Company &amp; Admin</span>
            </button>
          </div>

          {/* 4 KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="stat">
              <div className="stat-icon" style={{ background: '#eaf0ff', color: '#4f5fe8' }}>
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <small>Total Companies</small>
                <strong>{companies.length}</strong>
                <small className="text-[#16a779] font-medium">● {companies.filter((c) => c.status === 'Active').length} Active Organizations</small>
              </div>
            </div>

            <div className="stat">
              <div className="stat-icon" style={{ background: '#e4faf5', color: '#16a779' }}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <small>Company Admins</small>
                <strong>{companies.length}</strong>
                <small>Verified Tenant Owners</small>
              </div>
            </div>

            <div className="stat">
              <div className="stat-icon" style={{ background: '#fff2e4', color: '#f39a3f' }}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <small>Total Workforce</small>
                <strong>{totalEmployeesAcrossPlatform}</strong>
                <small>Staff across all companies</small>
              </div>
            </div>

            <div className="stat">
              <div className="stat-icon" style={{ background: '#f1eaff', color: '#8c60e8' }}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <small>Live Punches Today</small>
                <strong>{totalActivePunches}</strong>
                <small className="text-[#16a779] font-medium">Real-Time Cloud Synced</small>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-companies"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company, admin, email, city..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Plan:</span>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="h-9 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="ALL">All Plans</option>
                  <option value="ENTERPRISE">Enterprise</option>
                  <option value="GROWTH">Growth</option>
                  <option value="STARTER">Starter</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-9 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Companies Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredCompanies.map((comp) => {
              const empCount =
                comp.id === 'comp-paneliya'
                  ? (primaryEmployees?.length || 0)
                  : (comp.employeesCount || 0);

              const deptCount =
                comp.id === 'comp-paneliya' && departments && departments.length > 0
                  ? new Set(departments.map((d) => d.name).filter(Boolean)).size
                  : new Set(comp.departments || []).size;

              const isFlagship = comp.id === 'comp-paneliya';

              return (
                <div
                  key={comp.id}
                  id={`company-card-${comp.id}`}
                  onClick={() => {
                    setSelectedCompanyId(comp.id);
                    setActiveTab('employees');
                  }}
                  className={`p-5 rounded-2xl bg-white border transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 group flex flex-col justify-between ${
                    comp.status === 'Active'
                      ? 'border-slate-200/90 hover:border-indigo-400'
                      : 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                  }`}
                >
                  <div>
                    {/* Top Company Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md ${
                            isFlagship
                              ? 'bg-gradient-to-tr from-indigo-600 to-violet-700 shadow-indigo-600/30 ring-2 ring-indigo-600/20'
                              : 'bg-gradient-to-tr from-slate-800 to-slate-900 shadow-slate-900/20'
                          }`}
                        >
                          {comp.name
                            .split(' ')
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {comp.name}
                            </h3>
                            {isFlagship && (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-extrabold text-[9px] uppercase tracking-wider">
                                Primary HQ
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <span>{comp.code}</span>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{comp.city}, {comp.state}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          comp.status === 'Active'
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border border-rose-200 text-rose-700'
                        }`}
                      >
                        {comp.status}
                      </span>
                    </div>

                    {/* Admin / Owner Info Banner */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                          {comp.adminUser.fullName
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {comp.adminUser.fullName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {comp.adminUser.email}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 shrink-0 shadow-2xs">
                        Owner Admin
                      </span>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          Employees
                        </span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {empCount} <span className="text-[10px] text-slate-400 font-normal">/ {comp.maxEmployees}</span>
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          Depts
                        </span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {deptCount}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          Plan Tier
                        </span>
                        <p className="text-xs font-bold text-indigo-600 mt-0.5">
                          {comp.plan}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCompanyId(comp.id);
                        setActiveTab('employees');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <span>Manage Company &amp; Staff</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(comp.id, comp.name, e)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          comp.status === 'Active'
                            ? 'border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                        title={comp.status === 'Active' ? 'Suspend Company Access' : 'Activate Company Access'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ================================================================ */
        /* VIEW B: DRILLDOWN INTO SELECTED COMPANY & ALL EMPLOYEES          */
        /* ================================================================ */
        <div className="space-y-6">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <button
              id="btn-back-to-companies"
              onClick={() => setSelectedCompanyId(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Companies</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenEditCompanyModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Company Details</span>
              </button>

              <button
                onClick={() => handleToggleStatus(selectedCompany.id, selectedCompany.name)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                  selectedCompany.status === 'Active'
                    ? 'border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                    : 'border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{selectedCompany.status === 'Active' ? 'Suspend Company' : 'Activate Company'}</span>
              </button>
            </div>
          </div>

          {/* Company Hero Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-800 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 ring-4 ring-indigo-50">
                  {selectedCompany.name
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {selectedCompany.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                      {selectedCompany.plan} Plan
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        selectedCompany.status === 'Active'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          : 'bg-rose-50 border border-rose-200 text-rose-700'
                      }`}
                    >
                      {selectedCompany.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700">{selectedCompany.industry}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {selectedCompany.address}, {selectedCompany.city}, {selectedCompany.state}
                    </span>
                    <span>•</span>
                    <span>Code: {selectedCompany.code}</span>
                  </p>
                </div>
              </div>

              {/* Admin Owner Summary Pill */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {selectedCompany.adminUser.fullName
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900">
                      {selectedCompany.adminUser.fullName}
                    </p>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white font-extrabold text-[8px] uppercase">
                      Owner
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {selectedCompany.adminUser.email} • {selectedCompany.adminUser.phone}
                  </p>
                </div>
                <button
                  onClick={() => setIsResetPasswordModalOpen(true)}
                  className="ml-2 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 text-[11px] font-semibold transition shadow-2xs"
                  title="Reset Admin Password"
                >
                  <Lock className="w-3.5 h-3.5 inline mr-1" />
                  Password
                </button>
              </div>
            </div>

            {/* Drilldown Sub-Tabs */}
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
              <button
                onClick={() => setActiveTab('employees')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'employees'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Employees Under This Admin ({currentCompanyEmployees.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('details')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'details'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Company Profile &amp; Settings</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Owner Admin Credentials</span>
              </button>

              <button
                onClick={() => setActiveTab('departments')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'departments'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Departments ({selectedCompanyDepartments.length})</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: EMPLOYEES ROSTER UNDER THIS ADMIN                       */}
          {/* ============================================================== */}
          {activeTab === 'employees' && (
            <div className="space-y-4">
              {/* Employee Controls Toolbar */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={empSearchQuery}
                      onChange={(e) => setEmpSearchQuery(e.target.value)}
                      placeholder="Search employee by name, code, role..."
                      className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <select
                    value={empFilterDept}
                    onChange={(e) => setEmpFilterDept(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                  >
                    <option value="ALL">All Departments</option>
                    {selectedCompanyDepartments.map((d, idx) => (
                      <option key={`${d}-${idx}`} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  id="btn-add-emp-to-company"
                  onClick={() => {
                    setNewEmpDept(selectedCompanyDepartments[0] || 'Engineering');
                    setIsAddEmployeeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Employee to {selectedCompany.name}</span>
                </button>
              </div>

              {/* Employees Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Role &amp; Department</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Employment</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCompanyEmployees.length > 0 ? (
                        filteredCompanyEmployees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {emp.firstName[0]}
                                  {emp.lastName?.[0] || ''}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 leading-tight">
                                    {emp.firstName} {emp.lastName}
                                  </p>
                                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                    {emp.employeeCode}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-800">{emp.designationTitle}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{emp.departmentName}</p>
                            </td>

                            <td className="py-3 px-4">
                              <p className="text-slate-800">{emp.email}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{emp.phone || '—'}</p>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {emp.employmentType || 'Full-time'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  emp.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {emp.status}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleRemoveEmployee(emp.id, `${emp.firstName} ${emp.lastName}`)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Remove employee from company"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No employees found under this company. Click &quot;Add Employee&quot; to enroll staff.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: COMPANY PROFILE & SETTINGS                              */}
          {/* ============================================================== */}
          {activeTab === 'details' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Company Legal Profile &amp; Quota</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  General workspace information, address, and workforce limits
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Company Name</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedCompany.name}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Company Identifier Code</span>
                  <p className="font-mono font-bold text-slate-900 text-sm">{selectedCompany.code}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Industry</span>
                  <p className="font-semibold text-slate-900">{selectedCompany.industry}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Office Address</span>
                  <p className="font-semibold text-slate-900">{selectedCompany.address}, {selectedCompany.city}, {selectedCompany.state}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Max Employee Quota</span>
                  <p className="font-bold text-indigo-600 text-sm">{selectedCompany.maxEmployees} Seats</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Billing Cycle</span>
                  <p className="font-semibold text-slate-900">{selectedCompany.billingCycle} Subscription</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={handleOpenEditCompanyModal}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                >
                  Edit Company Profile
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: OWNER ADMIN ACCESS & CREDENTIALS                        */}
          {/* ============================================================== */}
          {activeTab === 'admin' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Company Owner / Primary Administrator</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This user holds the primary administrative credentials to manage employees, approvals, and timesheets for {selectedCompany.name}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Admin Full Name</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedCompany.adminUser.fullName}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Login Email</span>
                  <p className="font-semibold text-slate-900">{selectedCompany.adminUser.email}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Phone Number</span>
                  <p className="font-semibold text-slate-900">{selectedCompany.adminUser.phone}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Assigned Role</span>
                  <p className="font-bold text-indigo-700">{selectedCompany.adminUser.role}</p>
                </div>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Admin Privileges Granted
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Full Employee &amp; Workforce Management</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Attendance &amp; Live Punch Regularization</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Leave Approval &amp; Policy Management</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Company Payroll Generation &amp; Salary Slips</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setIsResetPasswordModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                >
                  Reset Admin Password
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: DEPARTMENTS & TEAMS                                     */}
          {/* ============================================================== */}
          {activeTab === 'departments' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Configured Departments</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Organizational departments active in {selectedCompany.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedCompanyDepartments.map((dept, idx) => {
                  const countInDept = currentCompanyEmployees.filter((e) => e.departmentName === dept).length;
                  return (
                    <div key={`${dept}-${idx}`} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-900">{dept}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{countInDept} staff enrolled</p>
                      </div>
                      <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {countInDept}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 1: ONBOARD NEW COMPANY & OWNER ADMIN                       */}
      {/* ================================================================ */}
      {isAddCompanyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Onboard New Company</h3>
                  <p className="text-[11px] text-slate-500">Register tenant company with owner admin</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCompanyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompanySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="e.g. Zenith Tech Solutions"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={newCompIndustry}
                    onChange={(e) => setNewCompIndustry(e.target.value)}
                    placeholder="e.g. FinTech, Healthcare"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subscription Plan</label>
                  <select
                    value={newCompPlan}
                    onChange={(e) => setNewCompPlan(e.target.value as any)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Growth">Growth</option>
                    <option value="Starter">Starter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newCompCity}
                    onChange={(e) => setNewCompCity(e.target.value)}
                    placeholder="e.g. Surat / Ahmedabad"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newCompState}
                    onChange={(e) => setNewCompState(e.target.value)}
                    placeholder="e.g. Gujarat"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="block font-bold text-slate-800 mb-2">Owner Admin Credentials</span>
                <div className="space-y-2.5">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Admin Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newCompAdminName}
                      onChange={(e) => setNewCompAdminName(e.target.value)}
                      placeholder="e.g. Rajesh Shah"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Admin Email *</label>
                      <input
                        type="email"
                        required
                        value={newCompAdminEmail}
                        onChange={(e) => setNewCompAdminEmail(e.target.value)}
                        placeholder="rajesh@zenith.com"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={newCompAdminPhone}
                        onChange={(e) => setNewCompAdminPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Temporary Password</label>
                    <input
                      type="text"
                      value={newCompAdminPassword}
                      onChange={(e) => setNewCompAdminPassword(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition"
                >
                  Register Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 2: ADD EMPLOYEE TO SELECTED COMPANY                        */}
      {/* ================================================================ */}
      {isAddEmployeeModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Employee to {selectedCompany.name}</h3>
                <p className="text-[11px] text-slate-500">Enroll new team member under this company admin</p>
              </div>
              <button
                onClick={() => setIsAddEmployeeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newEmpFirstName}
                    onChange={(e) => setNewEmpFirstName(e.target.value)}
                    placeholder="e.g. Amit"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newEmpLastName}
                    onChange={(e) => setNewEmpLastName(e.target.value)}
                    placeholder="e.g. Patel"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  placeholder="amit@company.com"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={newEmpDept}
                    onChange={(e) => setNewEmpDept(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {selectedCompanyDepartments.map((d, idx) => (
                      <option key={`${d}-${idx}`} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={newEmpDesignation}
                    onChange={(e) => setNewEmpDesignation(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={newEmpSalary}
                    onChange={(e) => setNewEmpSalary(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition"
                >
                  Enroll Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 3: RESET ADMIN PASSWORD                                    */}
      {/* ================================================================ */}
      {isResetPasswordModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Reset Admin Password</h3>
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
              <p className="text-slate-500">
                Set a new password for <strong className="text-slate-900">{selectedCompany.adminUser.fullName}</strong> ({selectedCompany.adminUser.email}):
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password *</label>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="Enter new secure password"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 4: EDIT COMPANY DETAILS                                    */}
      {/* ================================================================ */}
      {isEditCompanyModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Edit Company Profile</h3>
              <button
                onClick={() => setIsEditCompanyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompanyEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={editCompName}
                  onChange={(e) => setEditCompName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Industry</label>
                <input
                  type="text"
                  value={editCompIndustry}
                  onChange={(e) => setEditCompIndustry(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editCompAddress}
                  onChange={(e) => setEditCompAddress(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editCompCity}
                    onChange={(e) => setEditCompCity(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editCompState}
                    onChange={(e) => setEditCompState(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Employee Quota</label>
                <input
                  type="number"
                  value={editCompMaxEmps}
                  onChange={(e) => setEditCompMaxEmps(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCompanyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
