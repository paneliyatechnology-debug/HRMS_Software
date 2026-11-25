'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
  AlertCircle,
  MapPin,
  Network,
  Plus,
  Briefcase,
  X,
  Globe,
  Mail,
  Phone,
  Shield,
  Crown,
  Heart,
  Sparkles,
  Target,
  FileText,
  TrendingUp,
  Layers,
  Star,
  Zap,
  ChevronRight,
  Award,
  Clock,
  Edit2,
  RotateCcw,
  UserPlus,
  UserMinus,
  Check,
  ArrowRight,
  User,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
} from 'lucide-react';
import { Department, Designation, Location, Role, Employee, DesignationMember } from '../../types/hrms';
import { api } from '../../lib/api';
import { resolveCompanyBrandAvatar } from '../../lib/companyService';
import { useSocket } from '../../context/SocketContext';
import { useAuth, isUserAdminRole } from '../../context/AuthContext';
import { ASSIGNABLE_ROLE_DEFINITIONS, getRoleDefinition } from '../../lib/roleConfig';

interface OrganizationModuleProps {
  departments: Department[];
  designations?: Designation[];
  locations: Location[];
  initialTab?: 'departments' | 'teams' | 'about' | 'hierarchy';
  onRefresh: () => void;
  portalMode?: 'employee' | 'admin';
  employees?: any[];
  company?: any;
}

const DEPT_COLORS = [
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
  { bg: 'from-teal-500 to-cyan-600', light: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-800' },
  { bg: 'from-slate-600 to-slate-800', light: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-800' },
  { bg: 'from-orange-500 to-amber-600', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800' },
  { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800' },
  { bg: 'from-amber-500 to-yellow-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
];

function getSafeString(val: any, fallback: string = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim() || fallback;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (typeof val.name === 'string' && val.name.trim()) return val.name.trim();
    if (typeof val.companyName === 'string' && val.companyName.trim()) return val.companyName.trim();
    if (typeof val.label === 'string' && val.label.trim()) return val.label.trim();
    if (typeof val.title === 'string' && val.title.trim()) return val.title.trim();
    if (typeof val.code === 'string' && val.code.trim()) return val.code.trim();
    return fallback;
  }
  return fallback;
}

export const OrganizationModule: React.FC<OrganizationModuleProps> = ({
  departments: propDepartments = [],
  designations = [],
  locations,
  initialTab = 'departments',
  onRefresh,
  portalMode = 'admin',
  employees = [],
  company: propCompany,
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const isAdmin = isUserAdminRole(user?.role);
  const [departments, setDepartments] = useState<Department[]>(propDepartments || []);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const loadDepartments = useCallback(async () => {
    setLoadingDepartments(true);
    try {
      const data = await api.getDepartments();
      const depts = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray((data as any)?.departments)
        ? (data as any).departments
        : [];
      setDepartments(depts);
      return depts;
    } catch (err: any) {
      console.warn('Could not load departments:', err);
      return [];
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  useEffect(() => {
    if (propDepartments && propDepartments.length > 0) {
      setDepartments(propDepartments);
    } else {
      loadDepartments();
    }
  }, [propDepartments, loadDepartments]);

  const [activeTab, setActiveTab] = useState<'departments' | 'teams' | 'about' | 'hierarchy'>(() => {
    if (initialTab === 'teams') return 'teams';
    if (initialTab === 'about') return 'about';
    return 'departments';
  });

  // Dynamic Company State
  const [currentCompany, setCurrentCompany] = useState<any>(propCompany || null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  useEffect(() => {
    if (propCompany) {
      setCurrentCompany(propCompany);
    } else {
      const loadComp = async () => {
        setLoadingCompany(true);
        try {
          const comp = await api.getMyCompany();
          if (comp) setCurrentCompany(comp);
        } catch (err) {
          console.warn('Could not fetch company in OrganizationModule:', err);
        } finally {
          setLoadingCompany(false);
        }
      };
      loadComp();
    }
  }, [propCompany, user?.companyId]);

  // Edit organization modal state
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);

  const [editCompanyName, setEditCompanyName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editGst, setEditGst] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);

  const handleOpenEditCompany = () => {
    const comp = currentCompany || {};
    setEditCompanyName(getSafeString(comp.companyName || comp.name || user?.companyName, ''));
    setEditIndustry(getSafeString(comp.industry || comp.industrySector, ''));
    setEditDescription(getSafeString(comp.description, ''));
    setEditEmail(getSafeString(comp.email || comp.contactEmail || user?.email, ''));
    setEditPhone(getSafeString(comp.phone || comp.contactPhone || (user as any)?.phone, ''));
    setEditAddress(getSafeString(comp.address, ''));
    setEditCity(getSafeString(comp.city, ''));
    setEditState(getSafeString(comp.state, ''));
    setEditGst(getSafeString(comp.gstNumber || comp.panNumber || comp.taxId, ''));
    setEditWebsite(getSafeString(comp.website, ''));
    setIsEditCompanyOpen(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      const companyId = currentCompany?.id || user?.companyId;
      if (!companyId) {
        showToast?.({ type: 'error', title: 'Error', message: 'No company ID found to update.' });
        return;
      }
      const updated = await api.updateCompany(companyId, {
        name: editCompanyName.trim(),
        companyName: editCompanyName.trim(),
        industry: editIndustry.trim(),
        description: editDescription.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        gstNumber: editGst.trim(),
        website: editWebsite.trim(),
      });
      setCurrentCompany(updated);
      setIsEditCompanyOpen(false);
      showToast?.({
        type: 'success',
        title: 'Organization Updated',
        message: 'Company profile details have been saved successfully.',
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update company details.',
      });
    } finally {
      setSavingCompany(false);
    }
  };

  // Modals state
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  const [isAssignEmpModalOpen, setIsAssignEmpModalOpen] = useState(false);

  // Department Edit & Delete states
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [savingDeptEdit, setSavingDeptEdit] = useState(false);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [deletingDeptSubmitting, setDeletingDeptSubmitting] = useState(false);

  // Teams state
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  // Team Modals state
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDeptId, setTeamDeptId] = useState('');
  const [submittingTeam, setSubmittingTeam] = useState(false);

  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDeptId, setEditTeamDeptId] = useState('');
  const [submittingEditTeam, setSubmittingEditTeam] = useState(false);

  const [deletingTeam, setDeletingTeam] = useState<any | null>(null);
  const [submittingDeleteTeam, setSubmittingDeleteTeam] = useState(false);

  const [settingLeaderTeam, setSettingLeaderTeam] = useState<any | null>(null);
  const [selectedLeaderUserId, setSelectedLeaderUserId] = useState('');
  const [submittingLeader, setSubmittingLeader] = useState(false);

  const [viewingTeam, setViewingTeam] = useState<any | null>(null);
  const [loadingViewTeam, setLoadingViewTeam] = useState(false);

  // Assign Employee to Department state
  const [assignDeptId, setAssignDeptId] = useState<string>('');
  const [assignEmployeeId, setAssignEmployeeId] = useState<string>('');
  const [assignRole, setAssignRole] = useState<Role>('EMPLOYEE');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  useEffect(() => {
    const isAnyOpen =
      addDeptModalOpen ||
      isEditCompanyOpen ||
      isAssignEmpModalOpen ||
      !!editingDept ||
      !!deletingDept ||
      isAddTeamOpen ||
      !!editingTeam ||
      !!deletingTeam ||
      !!settingLeaderTeam ||
      !!viewingTeam;

    if (!isAnyOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (addDeptModalOpen) setAddDeptModalOpen(false);
        if (isEditCompanyOpen) setIsEditCompanyOpen(false);
        if (isAssignEmpModalOpen) setIsAssignEmpModalOpen(false);
        if (editingDept) setEditingDept(null);
        if (deletingDept) setDeletingDept(null);
        if (isAddTeamOpen) setIsAddTeamOpen(false);
        if (editingTeam) setEditingTeam(null);
        if (deletingTeam) setDeletingTeam(null);
        if (settingLeaderTeam) setSettingLeaderTeam(null);
        if (viewingTeam) setViewingTeam(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    addDeptModalOpen,
    isEditCompanyOpen,
    isAssignEmpModalOpen,
    editingDept,
    deletingDept,
    isAddTeamOpen,
    editingTeam,
    deletingTeam,
    settingLeaderTeam,
    viewingTeam,
  ]);

  // Department form state
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHeadName, setDeptHeadName] = useState('Department Head');
  const [deptDescription, setDeptDescription] = useState('');
  const [deptSubmitting, setDeptSubmitting] = useState(false);
  const [deptErrors, setDeptErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialTab === 'teams') setActiveTab('teams');
    else if (initialTab === 'departments') setActiveTab('departments');
    else if (initialTab === 'about') setActiveTab('about');
  }, [initialTab]);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!deptName.trim()) {
      errors.deptName = 'Department name is required.';
    } else if (deptName.trim().length < 2) {
      errors.deptName = 'Department name must be at least 2 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setDeptErrors(errors);
      return;
    }

    setDeptErrors({});
    setDeptSubmitting(true);
    try {
      await api.createDepartment({
        name: deptName.trim(),
      });
      showToast?.({
        title: 'Department Created',
        message: `${deptName.trim()} has been registered successfully.`,
        type: 'success',
      });
      setAddDeptModalOpen(false);
      setDeptName('');
      setDeptCode('');
      setDeptDescription('');
      setDeptHeadName('Department Head');
      await loadDepartments();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Department creation failed:', err);
      showToast?.({
        title: 'Creation Failed',
        message: err.message || 'Could not create department.',
        type: 'error',
      });
    } finally {
      setDeptSubmitting(false);
    }
  };


  const handleOpenAssignEmpModal = (targetDeptId?: string) => {
    const chosenDeptId = targetDeptId || departments[0]?.id || '';
    setAssignDeptId(chosenDeptId);

    // Default to first employee if none selected
    const initialEmp = employees.length > 0 ? (assignEmployeeId ? employees.find((e) => e.id === assignEmployeeId) : employees[0]) : null;
    if (initialEmp) {
      setAssignEmployeeId(initialEmp.id);
      if (initialEmp.role) {
        setAssignRole(initialEmp.role as Role);
      }
    }

    setIsAssignEmpModalOpen(true);
  };

  const handleAssignDeptChange = (newDeptId: string) => {
    setAssignDeptId(newDeptId);
  };

  const handleAssignEmployeeChange = (empId: string) => {
    setAssignEmployeeId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp && emp.role) {
      setAssignRole(emp.role as Role);
    }
  };

  const handleConfirmAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmployeeId || !assignDeptId) {
      showToast?.({
        type: 'error',
        title: 'Missing Selection',
        message: 'Please select both an employee and a department.',
      });
      return;
    }

    const selectedEmp = employees.find((e) => e.id === assignEmployeeId);
    const selectedDept = departments.find((d) => d.id === assignDeptId);

    if (!selectedEmp || !selectedDept) return;

    setAssignSubmitting(true);
    try {
      const roleDef = getRoleDefinition(assignRole);
      const targetUserId = (selectedEmp as any).userId || selectedEmp.id;

      // Find target designation for the selected department or use default
      const matchingDes = designations.find((d) => d.departmentId === selectedDept.id);

      // 1. Call POST /organization/designations/:id/members with { userIds: [targetUserId] }
      let apiMessage = '';
      try {
        const desRes = matchingDes
          ? await api.addDesignationMembers(matchingDes.id, [targetUserId])
          : null;
        if (desRes?.message) {
          apiMessage = desRes.message;
        }
      } catch (desErr) {
        console.warn('addDesignationMembers API call response:', desErr);
      }

      // 2. Update employee's department and role
      const updatePayload: any = {
        departmentId: selectedDept.id,
        departmentName: selectedDept.name,
        role: assignRole,
      };

      if (matchingDes) {
        updatePayload.designationId = matchingDes.id;
        updatePayload.designationTitle = matchingDes.title;
      }

      await api.updateEmployee(selectedEmp.id, updatePayload);

      showToast?.({
        type: 'success',
        title: 'Employee Added Successfully',
        message:
          apiMessage ||
          `${selectedEmp.firstName} ${selectedEmp.lastName} added to ${selectedDept.name} with role "${roleDef.label}".`,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hrms_employee_updated', {
            detail: {
              id: selectedEmp.id,
              departmentId: selectedDept.id,
              departmentName: selectedDept.name,
              role: assignRole,
            },
          })
        );
      }

      setIsAssignEmpModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to assign employee to department:', err);
      showToast?.({
        type: 'error',
        title: 'Assignment Failed',
        message: err.message || 'Could not assign employee to department.',
      });
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Teams API Loader
  const loadTeams = useCallback(async () => {
    setLoadingTeams(true);
    setTeamsError(null);
    try {
      const res = await api.listTeams();
      const data = Array.isArray(res) ? res : (res as any)?.data || [];
      setTeams(data);
    } catch (err: any) {
      console.warn('Could not load teams:', err);
      setTeamsError(err.message || 'Failed to load teams');
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // Department Edit & Delete Handlers
  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setEditDeptName(dept.name);
  };

  const handleSaveEditDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editDeptName.trim()) return;
    setSavingDeptEdit(true);
    try {
      await api.editDepartment(editingDept.id, { name: editDeptName.trim() });
      showToast?.({
        type: 'success',
        title: 'Department Updated',
        message: `${editDeptName} updated successfully.`,
      });
      setEditingDept(null);
      await loadDepartments();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update department.',
      });
    } finally {
      setSavingDeptEdit(false);
    }
  };

  const handleDeleteDept = async () => {
    if (!deletingDept) return;
    setDeletingDeptSubmitting(true);
    try {
      await api.deleteDepartment(deletingDept.id);
      showToast?.({
        type: 'success',
        title: 'Department Deleted',
        message: `${deletingDept.name} has been removed.`,
      });
      setDeletingDept(null);
      await loadDepartments();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete department.',
      });
    } finally {
      setDeletingDeptSubmitting(false);
    }
  };

  // Team Action Handlers
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSubmittingTeam(true);
    try {
      await api.createTeam({
        name: teamName.trim(),
        departmentId: teamDeptId || departments[0]?.id || undefined,
      });
      showToast?.({
        type: 'success',
        title: 'Team Created',
        message: `${teamName} has been created.`,
      });
      setIsAddTeamOpen(false);
      setTeamName('');
      loadTeams();
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Could not create team.',
      });
    } finally {
      setSubmittingTeam(false);
    }
  };

  const handleOpenEditTeam = (team: any) => {
    setEditingTeam(team);
    setEditTeamName(team.name || '');
    setEditTeamDeptId(team.departmentId || (team.department as any)?.id || '');
  };

  const handleSaveEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !editTeamName.trim()) return;
    setSubmittingEditTeam(true);
    try {
      await api.editTeam(editingTeam.id, {
        name: editTeamName.trim(),
        departmentId: editTeamDeptId || undefined,
      });
      showToast?.({
        type: 'success',
        title: 'Team Updated',
        message: 'Team details saved.',
      });
      setEditingTeam(null);
      loadTeams();
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update team.',
      });
    } finally {
      setSubmittingEditTeam(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deletingTeam) return;
    setSubmittingDeleteTeam(true);
    try {
      await api.deleteTeam(deletingTeam.id);
      showToast?.({
        type: 'success',
        title: 'Team Deleted',
        message: 'Team has been removed.',
      });
      setDeletingTeam(null);
      loadTeams();
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete team.',
      });
    } finally {
      setSubmittingDeleteTeam(false);
    }
  };

  const handleSetLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingLeaderTeam || !selectedLeaderUserId) return;
    setSubmittingLeader(true);
    try {
      await api.setTeamLeader(settingLeaderTeam.id, { userId: selectedLeaderUserId });
      showToast?.({
        type: 'success',
        title: 'Team Leader Assigned',
        message: 'Team leader updated.',
      });
      setSettingLeaderTeam(null);
      loadTeams();
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'Assignment Failed',
        message: err.message || 'Could not set leader.',
      });
    } finally {
      setSubmittingLeader(false);
    }
  };

  const handleViewTeam = async (team: any) => {
    setViewingTeam(team);
    setLoadingViewTeam(true);
    try {
      const detailed = await api.getTeam(team.id);
      if (detailed) setViewingTeam(detailed);
    } catch (err) {
      console.warn('Could not load detailed team:', err);
    } finally {
      setLoadingViewTeam(false);
    }
  };

  const totalEmployees = employees?.length || 0;
  const totalDepts = departments.length;
  const totalTeams = teams.length;
  const totalLocations = locations.length;

  return (
    <div className="space-y-5 w-full select-none">
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          TAB: ABOUT / OVERVIEW
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'about' && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* ── Dynamic Organization Hero Banner ─────────── */}
          {(() => {
            const rawCompName = currentCompany?.companyName || currentCompany?.name || user?.companyName || user?.companyCode;
            const compName = getSafeString(rawCompName, 'Company Workspace');
            const compInitial = (compName[0] || 'C').toUpperCase();
            const compLogo = resolveCompanyBrandAvatar(currentCompany, user, employees);
            const compIndustry = getSafeString(currentCompany?.industry || currentCompany?.industrySector, 'Corporate Workspace');
            const compDesc = getSafeString(currentCompany?.description, 'Corporate workspace structure and workforce management identity.');
            const compEmail = getSafeString(currentCompany?.email || currentCompany?.contactEmail || (isUserAdminRole(user?.role) ? user?.email : ''), 'Not provided');
            const compPhone = getSafeString(currentCompany?.phone || currentCompany?.contactPhone || (user as any)?.phone, 'Not provided');
            const compAddress = getSafeString(currentCompany?.address, 'Not provided');
            const cityStr = getSafeString(currentCompany?.city, '');
            const stateStr = getSafeString(currentCompany?.state, '');
            const compCityState = cityStr && stateStr
              ? `${cityStr}, ${stateStr}`
              : cityStr || stateStr || (compAddress !== 'Not provided' ? compAddress : 'Not provided');
            const compGst = getSafeString(currentCompany?.gstNumber || currentCompany?.panNumber || currentCompany?.taxId || currentCompany?.companyCode, 'Not provided');
            const compWebsite = getSafeString(currentCompany?.website, 'Not provided');
            const estYear = currentCompany?.createdAt ? new Date(currentCompany.createdAt).getFullYear() : 'Established';
            const ownerDisplayName = getSafeString(
              currentCompany?.adminUser?.fullName || (isUserAdminRole(user?.role) ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : ''),
              'Company Leadership'
            );
            const ownerDisplayRole = currentCompany?.adminUser?.role
              ? getRoleDefinition(currentCompany.adminUser.role).label
              : (isUserAdminRole(user?.role) ? getRoleDefinition(user?.role).label : 'Executive Management');

            return (
              <>
                <div className="relative rounded-3xl overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 45%, #081c15 100%)' }}>
                  {/* Glow blobs */}
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%)', transform: 'translate(30%, -40%)' }} />
                  <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.2), transparent 70%)', transform: 'translate(-30%, 40%)' }} />

                  <div className="relative z-10 p-6 sm:p-10">
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center">
                      {/* Company logo area */}
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="relative shrink-0">
                          <div
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center font-black text-white text-4xl shadow-2xl border border-white/20 overflow-hidden bg-white"
                            style={compLogo ? undefined : { background: 'linear-gradient(135deg, #52b788, #40916c, #2d6a4f)' }}
                          >
                            {compLogo ? (
                              <img src={compLogo} alt={compName} className="w-full h-full object-cover" />
                            ) : (
                              compInitial
                            )}
                          </div>
                          <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-white"></span>
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Check className="w-3 h-3 shrink-0" /> {currentCompany?.status || 'Active'} Company
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                              {estYear}
                            </span>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={handleOpenEditCompany}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[#2d6a4f] hover:bg-[#40916c] text-white border border-[#95d5b2]/50 shadow-xs transition cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit Profile</span>
                              </button>
                            )}
                          </div>
                          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight truncate">
                            {compName}
                          </h2>
                          <p className="text-emerald-300 text-xs sm:text-sm font-semibold mt-1">
                            {compIndustry}
                          </p>
                          <p className="text-emerald-100/80 text-xs mt-2 max-w-xl leading-relaxed line-clamp-2">
                            {compDesc}
                          </p>
                        </div>
                      </div>

                      {/* KPI Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:ml-auto shrink-0 w-full lg:w-auto">
                        {[
                          { label: 'Total Workforce', value: `${totalEmployees}`, sub: 'Active Staff', icon: Users, color: 'text-emerald-300' },
                          { label: 'Departments', value: `${totalDepts}`, sub: 'Core Divisions', icon: Layers, color: 'text-teal-300' },
                          { label: 'Teams', value: `${totalTeams}`, sub: 'Active Teams', icon: Users, color: 'text-emerald-200' },
                          { label: 'Locations', value: `${totalLocations || (currentCompany?.address ? 1 : 0)}`, sub: 'Offices', icon: MapPin, color: 'text-amber-300' },
                        ].map(({ label, value, sub, icon: Icon, color }) => (
                          <div
                            key={label}
                            className="relative p-3.5 sm:p-4 rounded-2xl overflow-hidden cursor-default"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                          >
                            <Icon className={`w-4 h-4 ${color} mb-2`} />
                            <div className="text-xl sm:text-2xl font-semibold tracking-tight text-white">{value}</div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</div>
                            <div className="text-[10px] text-white/50 mt-0.5">{sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Info Grid: Leadership + Corporate Identity ───── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Leadership Card */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">Founder &amp; Executive Leadership</h3>
                          <p className="text-[11px] text-slate-400">Authenticated enterprise management</p>
                        </div>
                        <span className="ml-auto px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 uppercase tracking-wide">
                          Verified
                        </span>
                      </div>

                      {/* Executive Leadership Profile */}
                      <div className="p-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-emerald-50/30">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0"
                            style={{ background: 'linear-gradient(135deg, #2d6a4f, #1b4332)' }}
                          >
                            {(ownerDisplayName[0] || 'L').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-base font-black text-slate-900 truncate">{ownerDisplayName}</h4>
                            <p className="text-xs font-bold text-emerald-700">{ownerDisplayRole}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{compName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Quote */}
                      <div className="mt-4 p-4 rounded-2xl bg-slate-50 border-l-4 border-emerald-500 text-xs text-slate-600 leading-relaxed italic">
                        "Our core foundation is our people. We believe in providing an empowering workspace with complete transparency and dependable engineering excellence."
                      </div>

                      {/* Contact Grid */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                            <Mail className="w-3 h-3" /> Direct Email
                          </div>
                          <p className="text-xs font-bold text-emerald-700 truncate select-all">{compEmail}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                            <MapPin className="w-3 h-3" /> Location
                          </div>
                          <p className="text-xs font-bold text-slate-800 truncate">{compCityState}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Corporate Identity Card */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">Corporate Identity &amp; Tax</h3>
                          <p className="text-[11px] text-slate-400">Official company registration details</p>
                        </div>
                        <span className="ml-auto px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 uppercase tracking-wide">
                          Official
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {[
                          { icon: Shield, label: 'Legal Name', value: compName, mono: false },
                          { icon: Sparkles, label: 'Industry', value: compIndustry, mono: false },
                          { icon: FileText, label: 'Tax ID / GSTIN', value: compGst, mono: true },
                          { icon: Mail, label: 'Official Email', value: compEmail, mono: false },
                          { icon: Phone, label: 'Contact Phone', value: compPhone, mono: false },
                          { icon: Globe, label: 'Website', value: compWebsite, mono: false },
                          { icon: MapPin, label: 'City & State', value: compCityState, mono: false },
                        ].map(({ icon: Icon, label, value, mono }) => (
                          <div
                            key={label}
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-emerald-50/40 hover:border-emerald-100 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 text-xs text-slate-500">
                              <Icon className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                              <span className="font-medium">{label}</span>
                            </div>
                            <span className={`text-xs font-bold text-slate-800 ${mono ? 'font-mono' : ''} max-w-[220px] truncate text-right`}>
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Three Value Cards ──────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    {
                      icon: MapPin,
                      title: 'Corporate Headquarters',
                      color: 'from-emerald-600 to-teal-500',
                      bg: 'bg-emerald-50',
                      iconColor: 'text-emerald-600',
                      body: compAddress !== 'Not provided' ? compAddress : 'Corporate office address is not provided yet.',
                      footer: compCityState,
                    },
                    {
                      icon: Target,
                      title: 'Mission & Vision',
                      color: 'from-emerald-500 to-teal-500',
                      bg: 'bg-emerald-50',
                      iconColor: 'text-emerald-600',
                      body: compDesc,
                      footer: compName,
                    },
                    {
                      icon: Heart,
                      title: 'Workplace Values',
                      color: 'from-rose-500 to-pink-500',
                      bg: 'bg-rose-50',
                      iconColor: 'text-rose-600',
                      body: 'Dedicated to transparency, teamwork, employee wellness, and building sustainable business operations.',
                      footer: 'Growth • Excellence • Integrity',
                    },
                  ].map(({ icon: Icon, title, color, bg, iconColor, body, footer }) => (
                    <div
                      key={title}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      <div className="p-5">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-5 h-5 ${iconColor}`} />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mb-2">{title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{body}</p>
                        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">{footer}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}

          {/* ── Department Snapshot ─────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Network className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Active Departments</h3>
                  <p className="text-[11px] text-slate-400">Core divisions — {departments.length} registered</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('departments')}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5">
              {departments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No departments yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {departments.map((dept, idx) => {
                    const c = DEPT_COLORS[idx % DEPT_COLORS.length];
                    const deptCode = getSafeString(dept.code, 'DEP');
                    const deptName = getSafeString(dept.name, 'Unnamed Department');
                    const deptHead = getSafeString(dept.headName, 'Unassigned');
                    return (
                      <div
                        key={dept.id || idx}
                        onClick={() => setActiveTab('departments')}
                        className={`p-4 rounded-2xl border ${c.border} ${c.light} hover:shadow-md transition-all cursor-pointer group`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.badge}`}>
                            {deptCode}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                            <Users className="w-2.5 h-2.5" /> {dept.employeeCount || 0}
                          </span>
                        </div>
                        <h5 className={`text-sm font-bold text-slate-900 group-hover:${c.text} transition-colors`}>
                          {deptName}
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                          {deptHead}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          TAB: DEPARTMENTS
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'departments' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500 font-medium">{departments.length} departments registered</p>
              <button
                type="button"
                onClick={loadDepartments}
                disabled={loadingDepartments}
                className="p-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Refresh departments"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingDepartments ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>
            {portalMode === 'admin' && (
              <div className="flex items-center gap-2">
                <button
                  id="btn-add-dept-modal"
                  onClick={() => setAddDeptModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition-all active:scale-95 hover:opacity-90 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #2d6a4f, #1b4332)' }}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Department</span>
                </button>
              </div>
            )}
          </div>

          {departments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No departments yet</p>
              <p className="text-slate-400 text-xs mt-1">Add your first department to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept, idx) => {
                const c = DEPT_COLORS[idx % DEPT_COLORS.length];
                const deptCode = getSafeString(dept.code, 'DEP');
                const deptName = getSafeString(dept.name, 'Unnamed Department');
                const deptDesc = getSafeString(dept.description, 'Core business division of the organisation.');
                const deptHead = getSafeString(dept.headName, 'Unassigned');
                return (
                  <div key={dept.id || idx} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${c.badge} border ${c.border}`}>
                          {deptCode}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">Head: {deptHead}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">{deptName}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {deptDesc}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 flex-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Teams ({teams.filter((team: any) => team.departmentId === dept.id || (team.departmentName && String(team.departmentName).toLowerCase() === deptName.toLowerCase())).length})</p>
                        {teams.filter((team: any) => team.departmentId === dept.id || (team.departmentName && String(team.departmentName).toLowerCase() === deptName.toLowerCase())).length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic">No teams in this department.</p>
                        ) : (
                          teams
                            .filter((team: any) => team.departmentId === dept.id || (team.departmentName && String(team.departmentName).toLowerCase() === deptName.toLowerCase()))
                            .map((team: any) => (
                              <div key={team.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <span className="text-xs font-bold text-slate-800 truncate">{team.name}</span>
                              </div>
                            ))
                        )}
                      </div>

                      {/* Action Button: Add Employee to this Department */}
                      {portalMode === 'admin' && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDept(dept)}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer"
                            title="Edit department"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingDept(dept)}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition-all cursor-pointer"
                            title="Delete department"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          TAB: TEAMS (CROSS-FUNCTIONAL WORKGROUPS)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'teams' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500 font-medium">{teams.length} teams registered</p>
              <p className="text-xs text-slate-400">Collaborative groups formed across departments</p>
            </div>
            {portalMode === 'admin' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadTeams}
                  disabled={loadingTeams}
                  className="p-2 rounded-xl bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Refresh teams"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loadingTeams ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddTeamOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition-all active:scale-95 hover:opacity-90 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #2d6a4f, #1b4332)' }}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create Team</span>
                </button>
              </div>
            )}
          </div>

          {teamsError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{teamsError}</span>
              </div>
              <button
                type="button"
                onClick={loadTeams}
                className="px-3 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[11px] transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {loadingTeams ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-600 font-bold text-xs">Loading teams from server...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-bold text-sm">No teams found</p>
              <p className="text-slate-400 text-xs mt-1">
                Create your first team using the button above to begin organizing cross-functional projects.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team: any, idx: number) => {
                const c = DEPT_COLORS[idx % DEPT_COLORS.length];

                return (
                  <div key={team.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${c.badge} border ${c.border}`}>
                          {team.departmentName || team.department?.name || departments.find((d) => d.id === team.departmentId)?.name || 'General Team'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{team.name}</h3>

                      {/* Team Card Actions */}
                      {portalMode === 'admin' && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewTeam(team)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="View team details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditTeam(team)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit team"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTeam(team)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          TAB: HIERARCHY
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'hierarchy' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
            <div className="text-center mb-8">
              <h3 className="text-base font-black text-slate-900">Company Org Chart</h3>
              <p className="text-xs text-slate-400 mt-1">Executive leadership and departmental structure</p>
            </div>

            {/* Top node */}
            <div className="flex justify-center mb-4">
              <div className="px-6 py-4 rounded-2xl text-white shadow-xl max-w-xs w-full"
                style={{ background: 'linear-gradient(135deg, #2d6a4f, #1b4332)' }}>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 mb-1">Executive Leadership</div>
                <div className="text-base font-black">Company Director</div>
                <div className="text-xs text-emerald-200 mt-0.5">Managing Director & HR Head</div>
                <div className="text-[10px] text-emerald-300/80 mt-1">Executive Board</div>
              </div>
            </div>

            {/* Connector */}
            <div className="flex justify-center mb-4">
              <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-slate-200"></div>
            </div>

            {/* Dept grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {departments.map((dept, idx) => {
                const c = DEPT_COLORS[idx % DEPT_COLORS.length];
                const deptCode = getSafeString(dept.code, 'DEP');
                const deptName = getSafeString(dept.name, 'Unnamed Department');
                const deptHead = getSafeString(dept.headName, 'Unassigned');
                return (
                  <div key={dept.id || idx} className={`p-4 rounded-2xl border ${c.border} ${c.light}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.badge}`}>{deptCode}</span>
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3" /> {dept.employeeCount || 0}
                      </span>
                    </div>
                    <h5 className={`font-bold text-sm text-slate-900`}>{deptName}</h5>
                    <p className={`text-[11px] ${c.text} mt-0.5 font-medium`}>Head: {deptHead}</p>
                  </div>
                );
              })}
              {departments.length === 0 && (
                <div className="col-span-3 text-center py-8 text-slate-400 text-sm">No departments to show.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MODAL: Add Department
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {addDeptModalOpen && (
        <div
          id="add-department-modal"
          onClick={(e) => { if (e.target === e.currentTarget) setAddDeptModalOpen(false); }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Add New Department</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">Create organizational division</p>
                </div>
              </div>
              <button onClick={() => setAddDeptModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDepartment} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Department Name *</label>
                    {deptErrors.deptName && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {deptErrors.deptName}
                      </span>
                    )}
                  </div>
                  <input id="input-dept-name" type="text" required value={deptName}
                    onChange={(e) => {
                      setDeptName(e.target.value);
                      if (deptErrors.deptName) {
                        setDeptErrors((p) => { const c = { ...p }; delete c.deptName; return c; });
                      }
                    }}
                    placeholder="e.g. Artificial Intelligence"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none transition ${deptErrors.deptName
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800'
                      }`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">Code (Optional)</label>
                    </div>
                    <input id="input-dept-code" type="text" value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      placeholder="e.g. AI"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Dept. Head</label>
                    <input id="input-dept-head" type="text" value={deptHeadName} onChange={(e) => setDeptHeadName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Description</label>
                  <textarea id="input-dept-desc" rows={2} value={deptDescription} onChange={(e) => setDeptDescription(e.target.value)}
                    placeholder="Brief summary of department focus..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition resize-none" />
                </div>
              </div>
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                <button type="button" onClick={() => setAddDeptModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer">
                  Cancel
                </button>
                <button id="btn-submit-add-dept" type="submit" disabled={deptSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50">
                  {deptSubmitting ? 'Creating…' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MODAL: Assign Employee to Department & Auto-Update Role
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {isAssignEmpModalOpen && (
        <div
          id="assign-employee-dept-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget && !assignSubmitting) setIsAssignEmpModalOpen(false);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    Add Employee
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Select department, employee and role
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignEmpModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmAssignEmployee} className="p-6 space-y-4 text-xs overflow-y-auto [scrollbar-width:thin] flex-1">
              {/* Department Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignDeptId}
                  onChange={(e) => handleAssignDeptChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value="" disabled>
                    -- Select Department --
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Employee <span className="text-rose-500">*</span>
                </label>
                {employees.length === 0 ? (
                  <p className="text-xs text-amber-600 font-medium bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    No registered employees found.
                  </p>
                ) : (
                  <select
                    required
                    value={assignEmployeeId}
                    onChange={(e) => handleAssignEmployeeChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 transition cursor-pointer"
                  >
                    <option value="" disabled>
                      -- Select Employee --
                    </option>
                    {employees.map((emp) => {
                      const currentDeptName = emp.departmentName || 'No Dept';
                      const currentRoleDef = getRoleDefinition(emp.role);
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode || 'EMP'}) • {currentDeptName} • {currentRoleDef.shortLabel}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value as Role)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 transition cursor-pointer"
                >
                  {ASSIGNABLE_ROLE_DEFINITIONS.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label} ({r.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Preview Card */}
              {(() => {
                const targetEmp = employees.find((e) => e.id === assignEmployeeId);
                const targetDept = departments.find((d) => d.id === assignDeptId);
                const roleDef = getRoleDefinition(assignRole);

                if (!targetEmp || !targetDept) return null;

                const prevDept = targetEmp.departmentName || 'Unassigned';
                const prevRoleDef = getRoleDefinition(targetEmp.role);

                return (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Assignment Preview
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{targetEmp.firstName} {targetEmp.lastName}</p>
                        <p className="text-[11px] text-slate-500">{targetEmp.employeeCode || 'EMP'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${roleDef.borderClass} ${roleDef.bgLight} ${roleDef.textColor}`}>
                          {roleDef.label}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">From</span>
                        <span className="font-medium text-slate-700">{prevDept} ({prevRoleDef.shortLabel})</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="text-right">
                        <span className="text-emerald-600 block text-[9px] uppercase font-bold">To</span>
                        <span className="font-bold text-emerald-800">{targetDept.name} ({roleDef.shortLabel})</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Modal Actions */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAssignEmpModalOpen(false)}
                  disabled={assignSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting || !assignEmployeeId || !assignDeptId}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{assignSubmitting ? 'Adding...' : 'Add Employee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Organization Modal for Admin ── */}
      {isEditCompanyOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditCompanyOpen(false);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col cursor-default transition-all my-auto"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Edit Organization Profile</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">Manage legal entity details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCompanyOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 text-xs flex-1 [scrollbar-width:thin]">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  placeholder="e.g. Acme Technologies Pvt Ltd"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Industry Sector</label>
                  <input
                    type="text"
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                    placeholder="e.g. IT & Software"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={editGst}
                    onChange={(e) => setEditGst(e.target.value)}
                    placeholder="e.g. 24AAAAA0000A1Z5"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Company Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Briefly describe your company's core operations..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Office Street Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. 402, Business Hub, Ring Road"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Surat"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">State</label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    placeholder="e.g. Gujarat"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Website URL</label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              </div>

              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditCompanyOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCompany}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingCompany ? 'Saving...' : 'Save Organization Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Department Modal ─────────────────────────── */}
      {Boolean(editingDept) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setEditingDept(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Edit Department</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditDept} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDeptEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 hover:opacity-90 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #2d6a4f, #1b4332)' }}
                >
                  {savingDeptEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Department Modal ───────────────────────── */}
      {Boolean(deletingDept) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDeletingDept(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-y-auto my-auto p-6 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Department</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">{deletingDept?.name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingDeptSubmitting}
                onClick={handleDeleteDept}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {deletingDeptSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Team Modal ────────────────────────────────── */}
      {isAddTeamOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsAddTeamOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Create New Team</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTeamOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Team Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Core Platform Engineers"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Department
                </label>
                <select
                  value={teamDeptId}
                  onChange={(e) => setTeamDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                >
                  <option value="">General / Inter-departmental</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTeamOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTeam}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 hover:opacity-90 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #2d6a4f, #1b4332)' }}
                >
                  {submittingTeam && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Team</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Team Modal ───────────────────────────────── */}
      {Boolean(editingTeam) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setEditingTeam(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Edit Team Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditTeam} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Team Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Department
                </label>
                <select
                  value={editTeamDeptId}
                  onChange={(e) => setEditTeamDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                >
                  <option value="">General</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEditTeam}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 hover:opacity-90 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #2d6a4f, #1b4332)' }}
                >
                  {submittingEditTeam && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Team Modal ─────────────────────────────── */}
      {Boolean(deletingTeam) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDeletingTeam(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-y-auto my-auto p-6 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Team</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">{deletingTeam?.name}</span>?
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingTeam(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDeleteTeam}
                onClick={handleDeleteTeam}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {submittingDeleteTeam && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Set Team Leader Modal ─────────────────────────── */}
      {Boolean(settingLeaderTeam) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSettingLeaderTeam(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Assign Team Leader</h3>
              </div>
              <button
                type="button"
                onClick={() => setSettingLeaderTeam(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSetLeader} className="p-6 space-y-4 text-xs overflow-y-auto">
              <p className="text-slate-500 leading-relaxed">
                Select an employee to lead <span className="font-bold text-slate-800">{settingLeaderTeam?.name}</span>.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Choose Leader <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedLeaderUserId}
                  onChange={(e) => setSelectedLeaderUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                >
                  <option value="">Select an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={(emp as any).userId || emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.departmentName || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettingLeaderTeam(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeader}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 hover:opacity-90 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #2d6a4f, #1b4332)' }}
                >
                  {submittingLeader && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Set as Leader</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Team Details Modal ───────────────────────── */}
      {Boolean(viewingTeam) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewingTeam(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Team Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingTeam(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              {loadingViewTeam ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
                  <p className="text-slate-500 font-medium">Fetching team profile from backend...</p>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team Name</span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">{viewingTeam?.name}</h4>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</span>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {viewingTeam?.departmentName || viewingTeam?.department?.name || 'General Operations'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setViewingTeam(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
