'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Search,
  User,
  Users,
} from 'lucide-react';
import { Employee } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { getSharpAvatarUrl } from '../../lib/imageUtils';
import { useCompanyLive } from '../../lib/useCompanyLive';

interface TeamDirectoryModuleProps {
  employees?: Employee[];
  onOpenChatWithEmployee?: (employeeId: string) => void;
}

interface DirectoryPerson {
  id: string;
  name: string;
  role: string;
  designation: string;
  department: string;
  teamName: string;
  reportingManagerName: string;
  status: string;
  employeeCode?: string;
  joiningDate?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
}

type DirectoryTab = 'all' | 'department' | 'team';

export const TeamDirectoryModule: React.FC<TeamDirectoryModuleProps> = ({
  employees = [],
  onOpenChatWithEmployee,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [people, setPeople] = useState<DirectoryPerson[]>([]);
  const [departmentsMeta, setDepartmentsMeta] = useState<string[]>([]);
  const [designationsMeta, setDesignationsMeta] = useState<string[]>([]);
  const [teamsMeta, setTeamsMeta] = useState<Array<{ name: string; leaderName?: string; memberIds: Set<string>; memberNames: Set<string> }>>([]);

  const [activeTab, setActiveTab] = useState<DirectoryTab>('all');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [desigFilter, setDesigFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedPerson, setSelectedPerson] = useState<DirectoryPerson | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'team'>('overview');
  const [copiedId, setCopiedId] = useState(false);

  const PAGE_SIZE = 6;

  const normalizeRoleLabel = (rawRole?: string) => {
    const r = String(rawRole || 'EMPLOYEE').trim().toUpperCase();
    if (r === 'ADMIN' || r === 'COMPANY_ADMIN' || r === 'ORG_ADMIN') return 'Admin';
    if (r === 'HR' || r === 'HR_ADMIN') return 'HR';
    if (r === 'MANAGER' || r === 'TEAM_LEAD' || r === 'LEAD') return 'Manager';
    return 'Employee';
  };

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [myTeamsRes, allTeamsRes, deptsRes, desigsRes, directRes, staffRes, dashRes, companyRes, directoryUsersRes] = await Promise.all([
        api.listMyTeams().catch(() => null),
        api.listTeams().catch(() => null),
        api.getDepartments().catch(() => []),
        api.getDesignations().catch(() => []),
        api.listDirectChats().catch(() => null),
        api.listStaffThreads().catch(() => null),
        api.getDashboard().catch(() => null),
        api.getMyCompany().catch(() => null),
        api.listCompanyDirectory().catch(() => []),
      ]);

      const extractList = (res: any, key?: string) => {
        if (Array.isArray(res)) return res;
        if (key && Array.isArray(res?.[key])) return res[key];
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.items)) return res.items;
        return [];
      };

      const pickAvatar = (obj: any): string => {
        if (!obj || typeof obj !== 'object') return '';
        const candidates = [
          obj.avatarUrl,
          obj.avatar,
          obj.profilePhoto,
          obj.photoUrl,
          obj.image,
          obj.imageUrl,
          obj.profileImage,
          obj.avatar_url,
          obj.user?.avatarUrl,
          obj.user?.avatar,
          obj.user?.profilePhoto,
          obj.employee?.avatarUrl,
          obj.employee?.avatar,
          obj.employee?.profilePhoto,
        ];
        for (const c of candidates) {
          if (typeof c === 'string' && c.trim()) return c.trim();
        }
        return '';
      };

      const avatarByIdOrName = new Map<string, string>();
      const registerAvatar = (obj: any) => {
        const url = pickAvatar(obj);
        if (!url) return;
        const ids = [obj?.userId, obj?.id, obj?.employeeId, obj?.user?.id, obj?.employee?.id].filter(Boolean);
        for (const id of ids) avatarByIdOrName.set(String(id).trim().toLowerCase(), url);
        const nm = String(
          obj?.name ||
            `${obj?.firstName || obj?.user?.firstName || ''} ${obj?.lastName || obj?.user?.lastName || ''}`
        )
          .trim()
          .toLowerCase();
        if (nm) avatarByIdOrName.set(nm, url);
      };

      const rawTeams = [...extractList(allTeamsRes, 'teams'), ...extractList(myTeamsRes, 'teams')];
      const teamMap = new Map<string, { name: string; leaderName?: string; departmentName?: string; memberIds: Set<string>; memberNames: Set<string> }>();
      for (const t of rawTeams) {
        if (t?.leader) registerAvatar(t.leader);
        const tName = String(t?.name || '').trim();
        if (!tName) continue;
        const existing = teamMap.get(tName.toLowerCase()) || {
          name: tName,
          leaderName:
            t?.leaderName ||
            (t?.leader ? `${t.leader.firstName || ''} ${t.leader.lastName || ''}`.trim() || t.leader.name : '') ||
            t?.managerName ||
            '',
          departmentName: t?.departmentName || t?.department?.name || '',
          memberIds: new Set<string>(),
          memberNames: new Set<string>(),
        };
        const members = Array.isArray(t?.members) ? t.members : [];
        for (const m of members) {
          registerAvatar(m);
          const mid = String(m?.userId || m?.employeeId || m?.id || '').trim();
          const mName = String(
            m?.name || `${m?.firstName || m?.user?.firstName || ''} ${m?.lastName || m?.user?.lastName || ''}`
          )
            .trim()
            .toLowerCase();
          if (mid) existing.memberIds.add(mid);
          if (mName) existing.memberNames.add(mName);
        }
        teamMap.set(tName.toLowerCase(), existing);
      }
      const parsedTeams = Array.from(teamMap.values());
      setTeamsMeta(parsedTeams);

      const rawDepts = extractList(deptsRes, 'departments')
        .map((d: any) => String(d?.name || d?.departmentName || d || '').trim())
        .filter(Boolean);
      setDepartmentsMeta(Array.from(new Set(rawDepts)));

      const rawDesigs = extractList(desigsRes, 'designations')
        .map((d: any) => String(d?.title || d?.name || d || '').trim())
        .filter(Boolean);
      setDesignationsMeta(Array.from(new Set(rawDesigs)));

      const directList = extractList(directRes);
      const staffList = extractList(staffRes, 'staff');
      const dashStaff = Array.isArray((dashRes as any)?.employees) ? (dashRes as any).employees : [];
      const userCompId = String((user as any)?.companyId || '').trim();
      const directoryUsers = (Array.isArray(directoryUsersRes) ? directoryUsersRes : []).filter((u: any) =>
        !userCompId || !u?.companyId || String(u.companyId) === userCompId
      );

      employees.forEach(registerAvatar);
      directoryUsers.forEach(registerAvatar);
      dashStaff.forEach(registerAvatar);
      directList.forEach(registerAvatar);
      staffList.forEach(registerAvatar);

      const findTeamForPerson = (ids: string[], fullName: string, fallbackTeam?: string) => {
        if (fallbackTeam) return { teamName: fallbackTeam, leaderName: '' };
        const lowerName = fullName.trim().toLowerCase();
        for (const tm of parsedTeams) {
          if (ids.some((id) => tm.memberIds.has(id)) || (lowerName && tm.memberNames.has(lowerName))) {
            return { teamName: tm.name, leaderName: tm.leaderName || '' };
          }
        }
        return { teamName: '', leaderName: '' };
      };

      const byKey = new Map<string, DirectoryPerson>();
      const upsert = (raw: any) => {
        if (!raw) return;
        const ids = [raw.userId, raw.id, raw.employeeId, raw.user?.id, raw.employee?.id]
          .filter(Boolean)
          .map((v) => String(v).trim());
        const id = ids[0] || '';
        const name = String(
          raw.name ||
            `${raw.firstName || raw.user?.firstName || ''} ${raw.lastName || raw.user?.lastName || ''}`
        ).trim();
        if (!id && !name) return;

        const lowerName = name.toLowerCase();
        const matchedEntry = Array.from(byKey.entries()).find(
          ([k, v]) => ids.includes(k) || ids.includes(v.id) || (lowerName && v.name.toLowerCase() === lowerName)
        );
        const key = matchedEntry ? matchedEntry[0] : (id || lowerName);
        const existing = matchedEntry ? matchedEntry[1] : byKey.get(key);
        const roleLabel = normalizeRoleLabel(raw.role || raw.user?.role);

        const teamMatch = findTeamForPerson(ids, name, raw.teamName || raw.team?.name);
        const designation =
          String(raw.designationTitle || raw.designation?.title || raw.designation || raw.jobTitle || existing?.designation || '').trim() ||
          roleLabel;
        const department =
          String(raw.departmentName || raw.department?.name || existing?.department || '').trim() || 'General';
        const reportingManagerName =
          String(raw.reportingManagerName || existing?.reportingManagerName || teamMatch.leaderName || '').trim() ||
          'Not assigned';
        const teamName = teamMatch.teamName || existing?.teamName || 'Unassigned';
        const status = String(raw.status || existing?.status || 'Active').trim();
        const resolvedAvatar =
          pickAvatar(raw) ||
          ids.map((cid) => avatarByIdOrName.get(cid.toLowerCase())).find(Boolean) ||
          (lowerName ? avatarByIdOrName.get(lowerName) : undefined) ||
          existing?.avatarUrl;

        byKey.set(key, {
          id: id || existing?.id || key,
          name: name || existing?.name || 'Staff Member',
          role: roleLabel,
          designation,
          department,
          teamName,
          reportingManagerName,
          status,
          employeeCode: raw.employeeCode || raw.employee?.employeeCode || raw.user?.employeeCode || existing?.employeeCode,
          joiningDate: raw.joiningDate || raw.employee?.joiningDate || raw.createdAt || existing?.joiningDate,
          phone: raw.phone || raw.mobile || raw.user?.phone || raw.employee?.phone || existing?.phone,
          email: raw.email || raw.user?.email || existing?.email,
          avatarUrl: resolvedAvatar,
        });
      };

      employees.forEach(upsert);
      directoryUsers.forEach(upsert);
      dashStaff.forEach(upsert);
      directList.forEach(upsert);
      staffList.forEach(upsert);

      if (user) {
        upsert({
          id: user.employeeId || user.id,
          userId: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          role: user.role,
          designationTitle: (user as any).designationTitle,
          departmentName: (user as any).departmentName,
          reportingManagerName: (user as any).reportingManagerName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          status: 'Active',
        });
      }

      // Enrich colleagues lacking avatarUrl or profile details via GET /users/:id when permitted by backend
      const baseList = Array.from(byKey.values());
      const adminCompanyAvatar = (companyRes as any)?.adminAvatarUrl || '';
      const needProfileFetch = baseList.filter((p) => p.id && !p.avatarUrl);
      if (needProfileFetch.length > 0) {
        const fetchedUsers = await Promise.all(
          needProfileFetch.map((p) =>
            api
              .getUser(p.id)
              .then((res: any) => ({ personId: p.id, raw: res?.data?.user || res?.user || res?.data || res }))
              .catch(() => null)
          )
        );
        for (const item of fetchedUsers) {
          if (item?.raw) upsert({ ...item.raw, id: item.raw.id || item.personId });
        }
      }

      const finalPeople = Array.from(byKey.values()).map((p) => {
        if (!p.avatarUrl && p.role === 'Admin' && adminCompanyAvatar) {
          return { ...p, avatarUrl: adminCompanyAvatar };
        }
        return p;
      });

      setPeople(finalPeople);
    } catch (err: any) {
      setError(err?.message || 'Unable to load company directory.');
    } finally {
      setLoading(false);
    }
  }, [employees, user]);

  useEffect(() => {
    void loadDirectory();
    const onEmpUpdate = () => void loadDirectory();
    window.addEventListener('hrms_employees_updated', onEmpUpdate);
    return () => {
      window.removeEventListener('hrms_employees_updated', onEmpUpdate);
    };
  }, [loadDirectory]);

  useCompanyLive(['all', 'employees', 'organization', 'settings'], () => {
    void loadDirectory();
  });

  const departmentOptions = useMemo(() => {
    const set = new Set<string>(departmentsMeta);
    people.forEach((p) => {
      if (p.department) set.add(p.department);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [departmentsMeta, people]);

  const designationOptions = useMemo(() => {
    const set = new Set<string>(designationsMeta);
    people.forEach((p) => {
      if (p.designation) set.add(p.designation);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [designationsMeta, people]);

  const teamOptions = useMemo(() => {
    const set = new Set<string>(teamsMeta.map((t) => t.name));
    people.forEach((p) => {
      if (p.teamName && p.teamName !== 'Unassigned') set.add(p.teamName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [teamsMeta, people]);

  const activeCount = useMemo(
    () => people.filter((p) => p.status.toLowerCase() === 'active').length,
    [people]
  );

  const filteredPeople = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    return people
      .filter((p) => {
        if (deptFilter !== 'All' && p.department !== deptFilter) return false;
        if (desigFilter !== 'All' && p.designation !== desigFilter) return false;
        if (teamFilter !== 'All' && p.teamName !== teamFilter) return false;
        if (statusFilter !== 'All' && p.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.designation.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.teamName.toLowerCase().includes(q) ||
          p.reportingManagerName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, appliedSearch, deptFilter, desigFilter, teamFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPeople.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedPeople = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredPeople.slice(start, start + PAGE_SIZE);
  }, [filteredPeople, safePage]);

  useEffect(() => {
    setPage(1);
  }, [appliedSearch, deptFilter, desigFilter, teamFilter, statusFilter]);

  const departmentBreakdown = useMemo(() => {
    return departmentOptions.map((dept) => ({
      name: dept,
      count: people.filter((p) => p.department === dept).length,
    }));
  }, [departmentOptions, people]);

  const designationBreakdown = useMemo(() => {
    return designationOptions.map((desig) => ({
      name: desig,
      count: people.filter((p) => p.designation === desig).length,
    }));
  }, [designationOptions, people]);

  const teamBreakdown = useMemo(() => {
    return teamOptions.map((tm) => {
      const meta = teamsMeta.find((t) => t.name === tm);
      return {
        name: tm,
        leaderName: meta?.leaderName || 'Not assigned',
        count: people.filter((p) => p.teamName === tm).length,
      };
    });
  }, [teamOptions, teamsMeta, people]);

  const handleExportCsv = () => {
    const headers = ['Name', 'Designation', 'Department', 'Team', 'Reports To', 'Status'];
    const rows = filteredPeople.map((p) => [
      p.name,
      p.designation,
      p.department,
      p.teamName,
      p.reportingManagerName,
      p.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'company-directory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const applySearchNow = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchInput);
    setActiveTab('all');
  };

  const startIdx = filteredPeople.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filteredPeople.length);

  const openProfile = (person: DirectoryPerson) => {
    setSelectedPerson(person);
    setProfileTab('overview');
    setCopiedId(false);
  };

  const formatJoinDate = (rawDate?: string) => {
    if (!rawDate) return 'Not available';
    const dt = new Date(rawDate);
    if (Number.isNaN(dt.getTime())) return rawDate;
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (selectedPerson) {
    const personInitials =
      selectedPerson.name
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'E';
    const isPersonActive = selectedPerson.status.toLowerCase() === 'active';
    const isSelfPerson =
      selectedPerson.id === user?.id ||
      selectedPerson.id === user?.employeeId ||
      selectedPerson.name.toLowerCase() ===
        `${user?.firstName || ''} ${user?.lastName || ''}`.trim().toLowerCase();

    const managerPerson =
      selectedPerson.reportingManagerName && selectedPerson.reportingManagerName !== 'Not assigned'
        ? people.find(
            (p) => p.name.toLowerCase() === selectedPerson.reportingManagerName.toLowerCase()
          ) || null
        : null;

    const peerColleagues = people.filter(
      (p) =>
        p.id !== selectedPerson.id &&
        ((selectedPerson.teamName !== 'Unassigned' && p.teamName === selectedPerson.teamName) ||
          (selectedPerson.department && p.department === selectedPerson.department))
    );

    return (
      <div className="space-y-4 w-full animate-in fade-in">
        {/* Back Button */}
        <div>
          <button
            type="button"
            onClick={() => setSelectedPerson(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-200/90 text-xs font-semibold text-[#1b4332] hover:bg-emerald-50 shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Directory</span>
          </button>
        </div>

        {/* 2-Column In-Page Profile View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Summary Card */}
          <div className="lg:col-span-4 relative rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div
              className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
              style={{
                background:
                  'linear-gradient(160deg, rgba(255,255,255,0) 20%, rgba(216,243,220,0.55) 65%, rgba(45,106,79,0.22) 100%)',
              }}
            />

            <div className="relative p-6 space-y-5">
              {/* Photo & Identity */}
              <div className="flex flex-col items-center text-center">
                {selectedPerson.avatarUrl ? (
                  <img
                    src={getSharpAvatarUrl(selectedPerson.avatarUrl, 240)}
                    alt={selectedPerson.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#d8f3dc] border-4 border-white shadow-md text-[#1b4332] text-2xl font-bold flex items-center justify-center">
                    {personInitials}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
                  <h2 className="text-lg font-extrabold text-slate-900">{selectedPerson.name}</h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      isPersonActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isPersonActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    />
                    <span>{selectedPerson.status || 'Active'}</span>
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{selectedPerson.designation}</p>

                {/* Circular Quick Action Row */}
                <div className="flex items-center justify-center gap-2.5 mt-4">
                  {selectedPerson.email && (
                    <a
                      href={`mailto:${selectedPerson.email}`}
                      title={`Email ${selectedPerson.email}`}
                      className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-[#1b4332] hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center transition"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  {selectedPerson.phone && (
                    <a
                      href={`tel:${selectedPerson.phone}`}
                      title={`Call ${selectedPerson.phone}`}
                      className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-[#1b4332] hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center transition"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  {!isSelfPerson && onOpenChatWithEmployee && (
                    <button
                      type="button"
                      onClick={() => onOpenChatWithEmployee(selectedPerson.id)}
                      title={`Chat with ${selectedPerson.name}`}
                      className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-[#1b4332] hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center transition cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const val = selectedPerson.employeeCode || selectedPerson.email || selectedPerson.name;
                      navigator.clipboard?.writeText(val);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 1800);
                    }}
                    title="Copy details"
                    className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-[#1b4332] hover:border-emerald-300 flex items-center justify-center transition cursor-pointer"
                  >
                    {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Left Meta Rows */}
              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#d8f3dc]/60 text-[#1b4332] flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 block">Employee ID</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedPerson.employeeCode || 'Not assigned'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#d8f3dc]/60 text-[#1b4332] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 block">Department</span>
                    <span className="font-semibold text-slate-800 truncate block">{selectedPerson.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#d8f3dc]/60 text-[#1b4332] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 block">Team</span>
                    <span className="font-semibold text-slate-800 truncate block">{selectedPerson.teamName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#d8f3dc]/60 text-[#1b4332] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 block">Reporting Manager</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {selectedPerson.reportingManagerName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Detailed Section */}
          <div className="lg:col-span-8 space-y-4">
            {/* Tabs Bar */}
            <div className="flex items-center gap-6 border-b border-slate-200 px-1">
              <button
                type="button"
                onClick={() => setProfileTab('overview')}
                className={`pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
                  profileTab === 'overview'
                    ? 'border-[#1b4332] text-[#1b4332]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('team')}
                className={`pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
                  profileTab === 'team'
                    ? 'border-[#1b4332] text-[#1b4332]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Team &amp; Peers ({peerColleagues.length})
              </button>
            </div>

            {profileTab === 'overview' ? (
              <>
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">About</h3>
                    <p className="text-xs sm:text-[13px] text-slate-600 mt-1.5 leading-relaxed">
                      {selectedPerson.name} works as <strong className="text-slate-800">{selectedPerson.designation}</strong> in the{' '}
                      <strong className="text-slate-800">{selectedPerson.department}</strong> department
                      {selectedPerson.teamName !== 'Unassigned' ? ` (${selectedPerson.teamName})` : ''}.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-400 block">Designation</span>
                        <span className="font-semibold text-slate-800 truncate block">{selectedPerson.designation}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-400 block">Department</span>
                        <span className="font-semibold text-slate-800 truncate block">{selectedPerson.department}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-400 block">Team</span>
                        <span className="font-semibold text-slate-800 truncate block">{selectedPerson.teamName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-400 block">Joining Date</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {formatJoinDate(selectedPerson.joiningDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-400 block">Email</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {selectedPerson.email || 'Not shared'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-400 block">Phone</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {selectedPerson.phone || 'Not shared'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reports To Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">Reports To</h4>
                  {selectedPerson.reportingManagerName === 'Not assigned' ? (
                    <p className="text-xs text-slate-400">No reporting manager assigned.</p>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {managerPerson?.avatarUrl ? (
                          <img
                            src={getSharpAvatarUrl(managerPerson.avatarUrl, 128)}
                            alt={selectedPerson.reportingManagerName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#d8f3dc] text-[#1b4332] text-xs font-bold flex items-center justify-center shrink-0">
                            {selectedPerson.reportingManagerName
                              .split(' ')
                              .filter(Boolean)
                              .map((p) => p[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase() || 'RM'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {selectedPerson.reportingManagerName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {managerPerson?.designation || 'Reporting Manager'}
                          </p>
                        </div>
                      </div>

                      {managerPerson && (
                        <button
                          type="button"
                          onClick={() => openProfile(managerPerson)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#1b4332] text-xs font-semibold text-slate-700 transition shrink-0 cursor-pointer"
                        >
                          <span>View Profile</span>
                          <span>&rarr;</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">
                  Colleagues in {selectedPerson.teamName !== 'Unassigned' ? selectedPerson.teamName : selectedPerson.department}
                </h4>
                {peerColleagues.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No other members found in this group.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {peerColleagues.map((peer) => {
                      const pInit =
                        peer.name
                          .split(' ')
                          .filter(Boolean)
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'E';
                      return (
                        <div
                          key={peer.id}
                          className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {peer.avatarUrl ? (
                              <img
                                src={getSharpAvatarUrl(peer.avatarUrl, 128)}
                                alt={peer.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#d8f3dc] text-[#1b4332] text-xs font-bold flex items-center justify-center shrink-0">
                                {pInit}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{peer.name}</p>
                              <p className="text-[11px] text-slate-500 truncate">{peer.designation}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openProfile(peer)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-[11px] font-semibold text-slate-700 cursor-pointer shrink-0"
                          >
                            View &rarr;
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full animate-in fade-in">
      {/* 1. Top Header Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, rgba(255,255,255,1) 42%, rgba(216,243,220,0.65) 75%, rgba(45,106,79,0.28) 100%)',
          }}
        />
        <div
          className="hidden sm:block absolute inset-y-0 right-0 w-[44%] max-w-[460px] pointer-events-none select-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.92) 30%, transparent 98%)',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,0.92) 30%, transparent 98%)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/directory-building.jpg"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-85"
          />
        </div>
        <div className="relative px-5 py-4 sm:px-6 sm:py-5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span>HRMS</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800 font-semibold">Team &amp; Directory</span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#1b4332] text-white flex items-center justify-center shadow-sm shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Company Directory
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Explore our company&apos;s people, departments, and teams.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Three Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          type="button"
          onClick={() => {
            setActiveTab('all');
            setDeptFilter('All');
            setDesigFilter('All');
            setTeamFilter('All');
          }}
          className="text-left bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:border-emerald-200 hover:shadow-sm transition cursor-pointer flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-full bg-[#d8f3dc]/70 text-[#1b4332] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-500 block">Total Employees</span>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight mt-0.5 tabular-nums">
              {activeCount}
            </p>
            <span className="text-[11px] text-slate-400 block">Active Employees</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('department')}
          className="text-left bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:border-emerald-200 hover:shadow-sm transition cursor-pointer flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-full bg-[#d8f3dc]/70 text-[#1b4332] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-500 block">Departments</span>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight mt-0.5 tabular-nums">
              {departmentOptions.length}
            </p>
            <span className="text-[11px] text-slate-400 block">Total Departments</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className="text-left bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:border-emerald-200 hover:shadow-sm transition cursor-pointer flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-full bg-[#d8f3dc]/70 text-[#1b4332] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-500 block">Teams</span>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight mt-0.5 tabular-nums">
              {teamOptions.length}
            </p>
            <span className="text-[11px] text-slate-400 block">Total Teams</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </div>

      {/* 3. Filter Pills & Export Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#1b4332] text-white border-[#1b4332] shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Employees ({people.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('department')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition cursor-pointer ${
              activeTab === 'department'
                ? 'bg-[#1b4332] text-white border-[#1b4332] shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>By Department ({departmentOptions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition cursor-pointer ${
              activeTab === 'team'
                ? 'bg-[#1b4332] text-white border-[#1b4332] shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>By Team ({teamOptions.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredPeople.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 text-[#1b4332]" />
          <span>Export</span>
        </button>
      </div>

      {/* 4. Search & Dropdown Filter Bar */}
      <form onSubmit={applySearchNow} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
        <div className="relative lg:col-span-5">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setAppliedSearch(e.target.value);
            }}
            placeholder="Search employees by name..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2d6a4f]"
          />
        </div>

        <div className="lg:col-span-2">
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setActiveTab('all');
            }}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2d6a4f] cursor-pointer"
          >
            <option value="All">All Departments</option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            value={teamFilter}
            onChange={(e) => {
              setTeamFilter(e.target.value);
              setActiveTab('all');
            }}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2d6a4f] cursor-pointer"
          >
            <option value="All">All Teams</option>
            {teamOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setActiveTab('all');
            }}
            className="w-full h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2d6a4f] cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="lg:col-span-1">
          <button
            type="submit"
            className="w-full h-10 px-3 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </form>

      {/* 5. Main Content Area */}
      {error ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center text-xs text-rose-700">
          {error}
        </div>
      ) : loading && people.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 py-14 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-[#2d6a4f]" />
          <span>Loading company directory...</span>
        </div>
      ) : activeTab === 'department' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentBreakdown.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-400">
              No departments found.
            </div>
          ) : (
            departmentBreakdown.map((dept) => (
              <button
                key={dept.name}
                type="button"
                onClick={() => {
                  setDeptFilter(dept.name);
                  setActiveTab('all');
                }}
                className="text-left bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:border-emerald-300 hover:shadow-sm transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#d8f3dc]/70 text-[#1b4332] flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{dept.name}</p>
                    <p className="text-xs text-slate-500">{dept.count} {dept.count === 1 ? 'Employee' : 'Employees'}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))
          )}
        </div>
      ) : activeTab === 'team' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamBreakdown.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-400">
              No teams configured yet.
            </div>
          ) : (
            teamBreakdown.map((tm) => (
              <button
                key={tm.name}
                type="button"
                onClick={() => {
                  setTeamFilter(tm.name);
                  setActiveTab('all');
                }}
                className="text-left bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:border-emerald-300 hover:shadow-sm transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#d8f3dc]/70 text-[#1b4332] flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{tm.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      Lead: {tm.leaderName} • {tm.count} {tm.count === 1 ? 'Member' : 'Members'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))
          )}
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700">No matching employees found</p>
          <p className="text-xs text-slate-400">Try clearing your search or filter selections.</p>
          {(appliedSearch || deptFilter !== 'All' || desigFilter !== 'All' || teamFilter !== 'All' || statusFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setAppliedSearch('');
                setDeptFilter('All');
                setDesigFilter('All');
                setTeamFilter('All');
                setStatusFilter('All');
              }}
              className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#d8f3dc] text-[#1b4332] text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedPeople.map((person) => {
              const initials =
                person.name
                  .split(' ')
                  .filter(Boolean)
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'E';
              const isActive = person.status.toLowerCase() === 'active';

              return (
                <div
                  key={`${person.id}-${person.name}`}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:border-emerald-200 hover:shadow-sm transition flex flex-col justify-between gap-3.5"
                >
                  {/* Top: Avatar + Name + Status */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {person.avatarUrl ? (
                        <img
                          src={getSharpAvatarUrl(person.avatarUrl, 128)}
                          alt={person.name}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#d8f3dc]/70 border border-[#b7e4c7] text-[#1b4332] text-sm font-bold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{person.name}</h4>
                        <p className="text-xs text-slate-500 truncate">{person.designation}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{person.status || 'Active'}</span>
                    </span>
                  </div>

                  {/* Middle: Department & Team */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-700">{person.department}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-700">{person.teamName}</span>
                    </span>
                  </div>

                  {/* Bottom: Reports To + View Profile */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 min-w-0 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        Reports To: <strong className="text-slate-700 font-semibold">{person.reportingManagerName}</strong>
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => openProfile(person)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#1b4332] text-xs font-semibold text-slate-700 transition shrink-0 cursor-pointer"
                    >
                      <span>View Profile</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6. Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500">
              Showing {startIdx} – {endIdx} of {filteredPeople.length} employees
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPage(num)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    num === safePage
                      ? 'bg-[#1b4332] text-white border-[#1b4332]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
