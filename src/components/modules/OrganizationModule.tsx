'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
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
} from 'lucide-react';
import { Department, Designation, Location } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';

interface OrganizationModuleProps {
  departments: Department[];
  designations: Designation[];
  locations: Location[];
  initialTab?: 'about' | 'departments' | 'designations' | 'hierarchy';
  onRefresh: () => void;
  portalMode?: 'employee' | 'admin';
  employees?: any[];
}

const DEPT_COLORS = [
  { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-800' },
  { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
  { bg: 'from-orange-500 to-red-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800' },
  { bg: 'from-pink-500 to-rose-600', light: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-800' },
  { bg: 'from-amber-500 to-yellow-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
];

export const OrganizationModule: React.FC<OrganizationModuleProps> = ({
  departments,
  designations,
  locations,
  initialTab = 'about',
  onRefresh,
  portalMode = 'admin',
  employees = [],
}) => {
  const { showToast } = useSocket();
  const [activeTab, setActiveTab] = useState<'about' | 'departments' | 'designations' | 'hierarchy'>(initialTab);

  // Modals state
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  const [addDesModalOpen, setAddDesModalOpen] = useState(false);

  // Department form state
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHeadName, setDeptHeadName] = useState('Department Head');
  const [deptDescription, setDeptDescription] = useState('');
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  // Designation form state
  const [desTitle, setDesTitle] = useState('');
  const [desDeptId, setDesDeptId] = useState(departments[0]?.id || 'dept-1');
  const [desMinSalary, setDesMinSalary] = useState(60000);
  const [desMaxSalary, setDesMaxSalary] = useState(120000);
  const [desSubmitting, setDesSubmitting] = useState(false);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) return;
    setDeptSubmitting(true);
    try {
      await api.createDepartment({
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
        headName: deptHeadName.trim(),
        description: deptDescription.trim(),
      });
      showToast?.({ title: 'Department Created', message: `${deptName} (${deptCode}) has been registered.`, type: 'success' });
      setAddDeptModalOpen(false);
      setDeptName(''); setDeptCode(''); setDeptDescription('');
      onRefresh();
    } catch (err) { console.error(err); }
    finally { setDeptSubmitting(false); }
  };

  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desTitle.trim()) return;
    setDesSubmitting(true);
    try {
      await api.createDesignation({ title: desTitle.trim(), departmentId: desDeptId, minSalary: Number(desMinSalary), maxSalary: Number(desMaxSalary) });
      showToast?.({ title: 'Designation Added', message: `${desTitle} has been registered.`, type: 'success' });
      setAddDesModalOpen(false); setDesTitle('');
      onRefresh();
    } catch (err) { console.error(err); }
    finally { setDesSubmitting(false); }
  };

  const totalEmployees = employees?.length || 0;
  const totalDepts = departments.length;
  const totalDesignations = designations.length;
  const totalLocations = locations.length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto select-none">
      {/* ── Page Header + Tab Bar ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </span>
            About Organisation
          </h1>
          <p className="text-xs text-slate-500 mt-1 ml-10">Company profile, structure & corporate identity</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200/70 shadow-sm overflow-x-auto [scrollbar-width:none]">
          {[
            { key: 'about', label: 'Overview', icon: Sparkles },
            { key: 'departments', label: `Departments (${departments.length})`, icon: Layers },
            ...(portalMode === 'admin' ? [{ key: 'designations', label: `Designations (${designations.length})`, icon: Briefcase }] : []),
            { key: 'hierarchy', label: 'Hierarchy', icon: Network },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              id={`tab-btn-${key}`}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === key
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          TAB: ABOUT / OVERVIEW
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'about' && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* ── Hero Banner ─────────────────────────────────── */}
          <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #1a1065 100%)' }}>
            {/* Glow blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)', transform: 'translate(30%, -40%)' }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)', transform: 'translate(-30%, 40%)' }} />
            <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)', transform: 'translate(-50%, -50%)' }} />

            <div className="relative z-10 p-8 sm:p-10">
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                {/* Company logo area */}
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center font-black text-white text-4xl shadow-2xl border border-white/20"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}>
                      P
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ Verified Enterprise
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        Est. 2021
                      </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                      Paneliya Technology
                    </h2>
                    <p className="text-indigo-300 text-sm font-semibold mt-1">
                      Enterprise Software & Cloud Solutions
                    </p>
                    <p className="text-indigo-400/80 text-xs mt-2 max-w-lg leading-relaxed">
                      Pioneering modern workforce management, cloud infrastructure & enterprise SaaS solutions that empower teams to achieve digital excellence.
                    </p>
                  </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:ml-auto shrink-0">
                  {[
                    { label: 'Total Workforce', value: `${totalEmployees}`, sub: 'Active Staff', icon: Users, color: 'text-blue-300' },
                    { label: 'Departments', value: `${totalDepts}`, sub: 'Core Divisions', icon: Layers, color: 'text-violet-300' },
                    { label: 'Designations', value: `${totalDesignations}`, sub: 'Job Titles', icon: Briefcase, color: 'text-emerald-300' },
                    { label: 'Locations', value: `${totalLocations || 1}`, sub: 'Offices', icon: MapPin, color: 'text-amber-300' },
                  ].map(({ label, value, sub, icon: Icon, color }) => (
                    <div key={label} className="relative p-4 rounded-2xl overflow-hidden transition-transform hover:scale-105 cursor-default"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                      <Icon className={`w-4 h-4 ${color} mb-2`} />
                      <div className="text-2xl font-black text-white">{value}</div>
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
              <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316, #ef4444)' }} />
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Founder & Leadership</h3>
                    <p className="text-[11px] text-slate-400">Executive management profile</p>
                  </div>
                  <span className="ml-auto px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black border border-amber-200 uppercase tracking-wide">
                    Owner
                  </span>
                </div>

                {/* Executive Leadership Profile */}
                <div className="p-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-emerald-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0"
                      style={{ background: 'linear-gradient(135deg, #059669, #064e3b)' }}>
                      EX
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-black text-slate-900">Executive Management</h4>
                      <p className="text-xs font-bold text-emerald-700">Company Board & Managing Director</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Corporate Headquarters</p>
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border-l-4 border-indigo-400 text-xs text-slate-600 leading-relaxed italic">
                  "At Paneliya Technology, our core foundation is our people. We believe in crafting reliable, high-performance software while creating an inspiring environment where every team member can achieve their full potential."
                </div>

                {/* Contact Grid */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                      <Mail className="w-3 h-3" /> Direct Email
                    </div>
                    <p className="text-xs font-bold text-emerald-700 truncate select-all">contact@paneliya.com</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3 h-3" /> Location
                    </div>
                    <p className="text-xs font-bold text-slate-800">Surat HQ, Gujarat</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Corporate Identity Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)' }} />
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Corporate Identity</h3>
                    <p className="text-[11px] text-slate-400">Official enterprise registration details</p>
                  </div>
                  <span className="ml-auto px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-200 uppercase tracking-wide">
                    Official
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { icon: Shield, label: 'Legal Name', value: 'Paneliya Technology Inc.', mono: false },
                    { icon: Sparkles, label: 'Industry', value: 'Information Technology & SaaS', mono: false },
                    { icon: FileText, label: 'Tax / EIN ID', value: 'PT-2021-GJ-001', mono: true },
                    { icon: Mail, label: 'Support Email', value: 'support@paneliya.com', mono: false },
                    { icon: Users, label: 'HR Desk', value: 'hr@paneliya.com', mono: false },
                    { icon: Globe, label: 'Website', value: 'https://paneliya.tech', mono: false },
                    { icon: Phone, label: 'Office Phone', value: '+91 98765 43210', mono: false },
                  ].map(({ icon: Icon, label, value, mono }) => (
                    <div key={label} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-indigo-50/40 hover:border-indigo-100 transition-colors group">
                      <div className="flex items-center gap-2.5 text-xs text-slate-500">
                        <Icon className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                        <span className="font-medium">{label}</span>
                      </div>
                      <span className={`text-xs font-bold text-slate-800 ${mono ? 'font-mono' : ''} max-w-[180px] truncate text-right`}>{value}</span>
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
                color: 'from-blue-500 to-cyan-500',
                bg: 'bg-blue-50',
                iconColor: 'text-blue-600',
                body: 'Paneliya Technology Tower, Ring Road, Surat, Gujarat — 395002, India',
                footer: '🏢 Mon–Fri • 09:00 AM – 06:00 PM IST',
              },
              {
                icon: Target,
                title: 'Mission & Vision',
                color: 'from-emerald-500 to-teal-500',
                bg: 'bg-emerald-50',
                iconColor: 'text-emerald-600',
                body: 'Empowering modern enterprises with state-of-the-art software that simplifies complex operations.',
                footer: '🎯 To be the most trusted tech engineering partner globally',
              },
              {
                icon: Heart,
                title: 'Culture & Values',
                color: 'from-rose-500 to-pink-500',
                bg: 'bg-rose-50',
                iconColor: 'text-rose-600',
                body: 'We believe in transparency, continuous learning, respect, and recognizing every individual\'s contribution.',
                footer: '🌟 Supportive environment • Career growth • Wellness',
              },
            ].map(({ icon: Icon, title, color, bg, iconColor, body, footer }) => (
              <div key={title} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                <div className={`h-1.5 w-full bg-gradient-to-r ${color}`} />
                <div className="p-5">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mb-2">{title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">{footer}</div>
                </div>
              </div>
            ))}
          </div>

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
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
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
                    return (
                      <div
                        key={dept.id}
                        onClick={() => setActiveTab('departments')}
                        className={`p-4 rounded-2xl border ${c.border} ${c.light} hover:shadow-md transition-all cursor-pointer group`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.badge}`}>
                            {dept.code}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                            <Users className="w-2.5 h-2.5" /> {dept.employeeCount || 0}
                          </span>
                        </div>
                        <h5 className={`text-sm font-bold text-slate-900 group-hover:${c.text} transition-colors`}>
                          {dept.name}
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                          {dept.headName || 'Unassigned'}
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

      {/* ═══════════════════════════════════════════════════════
          TAB: DEPARTMENTS
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'departments' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">{departments.length} departments registered</p>
            {portalMode === 'admin' && (
              <button
                id="btn-add-dept-modal"
                onClick={() => setAddDeptModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition-all active:scale-95 hover:opacity-90 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Add Department
              </button>
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
                return (
                  <div key={dept.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                    <div className={`h-1.5 bg-gradient-to-r ${c.bg}`} />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${c.badge} border ${c.border}`}>
                          {dept.code}
                        </span>
                        <span className={`text-xs flex items-center gap-1 font-semibold ${c.text}`}>
                          <Users className="w-3.5 h-3.5" /> {dept.employeeCount || 0} members
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">{dept.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 flex-1">
                        {dept.description || 'Core business division of the organisation.'}
                      </p>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Dept. Head</p>
                          <p className="text-xs font-bold text-slate-800">{dept.headName || 'Unassigned'}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB: DESIGNATIONS
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'designations' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Job Titles & Compensation Bands</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{designations.length} designations registered</p>
              </div>
              {portalMode === 'admin' && (
                <button
                  id="btn-add-des-modal"
                  onClick={() => setAddDesModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition-all active:scale-95 hover:opacity-90 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Designation
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">Title</th>
                    <th className="py-3 px-5">Department</th>
                    <th className="py-3 px-5">Salary Range (Annual)</th>
                    <th className="py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {designations.map((des, idx) => (
                    <tr key={des.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `hsl(${(idx * 47) % 360}, 70%, 95%)` }}>
                            <Briefcase className="w-3.5 h-3.5" style={{ color: `hsl(${(idx * 47) % 360}, 60%, 45%)` }} />
                          </div>
                          {des.title}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{des.departmentName || '—'}</td>
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {des.minSalary > 0
                          ? `₹${des.minSalary.toLocaleString()} – ₹${des.maxSalary.toLocaleString()}`
                          : <span className="text-slate-400 font-sans font-normal">Standard Band</span>}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {designations.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">No designations added yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB: HIERARCHY
      ═══════════════════════════════════════════════════════ */}
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
                style={{ background: 'linear-gradient(135deg, #1e1b4b, #3730a3)' }}>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">Executive Leadership</div>
                <div className="text-base font-black">Company Director</div>
                <div className="text-xs text-indigo-300 mt-0.5">Managing Director & HR Head</div>
                <div className="text-[10px] text-indigo-400 mt-1">Executive Board</div>
              </div>
            </div>

            {/* Connector */}
            <div className="flex justify-center mb-4">
              <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-400 to-slate-200"></div>
            </div>

            {/* Dept grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {departments.map((dept, idx) => {
                const c = DEPT_COLORS[idx % DEPT_COLORS.length];
                return (
                  <div key={dept.id} className={`p-4 rounded-2xl border ${c.border} ${c.light}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.badge}`}>{dept.code}</span>
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3" /> {dept.employeeCount || 0}
                      </span>
                    </div>
                    <h5 className={`font-bold text-sm text-slate-900`}>{dept.name}</h5>
                    <p className={`text-[11px] ${c.text} mt-0.5 font-medium`}>Head: {dept.headName || 'Unassigned'}</p>
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

      {/* ═══════════════════════════════════════════════════════
          MODAL: Add Department
      ═══════════════════════════════════════════════════════ */}
      {addDeptModalOpen && (
        <div
          id="add-department-modal"
          onClick={(e) => { if (e.target === e.currentTarget) setAddDeptModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Department</h3>
              </div>
              <button onClick={() => setAddDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDepartment} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Department Name *</label>
                <input id="input-dept-name" type="text" required value={deptName} onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Code *</label>
                  <input id="input-dept-code" type="text" required value={deptCode} onChange={(e) => setDeptCode(e.target.value)}
                    placeholder="e.g. AI"
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Dept. Head</label>
                  <input id="input-dept-head" type="text" value={deptHeadName} onChange={(e) => setDeptHeadName(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Description</label>
                <textarea id="input-dept-desc" rows={2} value={deptDescription} onChange={(e) => setDeptDescription(e.target.value)}
                  placeholder="Brief summary of department focus..."
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition resize-none" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setAddDeptModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                  Cancel
                </button>
                <button id="btn-submit-add-dept" type="submit" disabled={deptSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm disabled:opacity-50 transition active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {deptSubmitting ? 'Creating…' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: Add Designation
      ═══════════════════════════════════════════════════════ */}
      {addDesModalOpen && (
        <div
          id="add-designation-modal"
          onClick={(e) => { if (e.target === e.currentTarget) setAddDesModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Designation</h3>
              </div>
              <button onClick={() => setAddDesModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDesignation} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Designation Title *</label>
                <input id="input-des-title" type="text" required value={desTitle} onChange={(e) => setDesTitle(e.target.value)}
                  placeholder="e.g. Senior Staff Engineer"
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Department</label>
                <select id="select-des-dept" value={desDeptId} onChange={(e) => setDesDeptId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition">
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Min Salary (Annual)</label>
                  <input id="input-des-min-salary" type="number" value={desMinSalary} onChange={(e) => setDesMinSalary(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Max Salary (Annual)</label>
                  <input id="input-des-max-salary" type="number" value={desMaxSalary} onChange={(e) => setDesMaxSalary(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setAddDesModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                  Cancel
                </button>
                <button id="btn-submit-add-des" type="submit" disabled={desSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm disabled:opacity-50 transition active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {desSubmitting ? 'Saving…' : 'Add Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
