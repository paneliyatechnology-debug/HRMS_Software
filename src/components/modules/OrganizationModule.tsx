'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  MapPin,
  Network,
  Plus,
  ChevronRight,
  Briefcase,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Department, Designation, Location } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';

interface OrganizationModuleProps {
  departments: Department[];
  designations: Designation[];
  locations: Location[];
  initialTab?: 'departments' | 'designations' | 'hierarchy';
  onRefresh: () => void;
}

export const OrganizationModule: React.FC<OrganizationModuleProps> = ({
  departments,
  designations,
  locations,
  initialTab = 'departments',
  onRefresh,
}) => {
  const { showToast } = useSocket();
  const [activeTab, setActiveTab] = useState<'departments' | 'designations' | 'hierarchy'>(initialTab);

  // Modals state
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  const [addDesModalOpen, setAddDesModalOpen] = useState(false);

  // Department form state
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHeadName, setDeptHeadName] = useState('Keyur Sangani');
  const [deptDescription, setDeptDescription] = useState('');
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  // Designation form state
  const [desTitle, setDesTitle] = useState('');
  const [desDeptId, setDesDeptId] = useState(departments[0]?.id || 'dept-1');
  const [desMinSalary, setDesMinSalary] = useState(60000);
  const [desMaxSalary, setDesMaxSalary] = useState(120000);
  const [desSubmitting, setDesSubmitting] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
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
      showToast?.({
        title: 'Department Created',
        message: `${deptName} (${deptCode}) has been registered in the organization roster.`,
        type: 'success',
      });
      setAddDeptModalOpen(false);
      setDeptName('');
      setDeptCode('');
      setDeptDescription('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setDeptSubmitting(false);
    }
  };

  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desTitle.trim()) return;

    setDesSubmitting(true);
    try {
      await api.createDesignation({
        title: desTitle.trim(),
        departmentId: desDeptId,
        minSalary: Number(desMinSalary),
        maxSalary: Number(desMaxSalary),
      });
      showToast?.({
        title: 'Designation Added',
        message: `${desTitle} has been registered with standard salary pay-band.`,
        type: 'success',
      });
      setAddDesModalOpen(false);
      setDesTitle('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setDesSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto select-none animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Organization & Hierarchy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Department structure, designation salary bands, office locations, and visual corporate reporting tree
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 text-xs font-bold border border-slate-200/60 shadow-2xs">
          <button
            id="tab-btn-departments"
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'departments'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            id="tab-btn-designations"
            onClick={() => setActiveTab('designations')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'designations'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Designations ({designations.length})
          </button>
          <button
            id="tab-btn-hierarchy"
            onClick={() => setActiveTab('hierarchy')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'hierarchy'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visual Org Chart
          </button>
        </div>
      </div>

      {/* Tab 1: Departments */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              id="btn-add-dept-modal"
              onClick={() => setAddDeptModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      {dept.code}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                      <Users className="w-3.5 h-3.5" /> {dept.employeeCount || 1} Members
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-3">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {dept.description || 'Core business division'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Department Head</span>
                    <span className="font-bold text-slate-800">
                      {dept.headName || 'Keyur Sangani'}
                    </span>
                  </div>
                  <span className="text-slate-400 font-medium">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Designations */}
      {activeTab === 'designations' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Job Titles & Compensation Bands
            </h3>
            <button
              id="btn-add-des-modal"
              onClick={() => setAddDesModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Designation</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Salary Range (Annual)</th>
                  <th className="py-3 px-4">Standard Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {designations.map((des) => (
                  <tr key={des.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                      <span>{des.title}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {des.departmentName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {des.minSalary > 0
                        ? `₹${des.minSalary.toLocaleString()} - ₹${des.maxSalary.toLocaleString()}`
                        : 'Standard Enterprise Band'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        Corporate Roster
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Visual Org Chart */}
      {activeTab === 'hierarchy' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center space-y-6">
          <h3 className="text-base font-bold text-slate-900">
            Company Executive Hierarchy
          </h3>

          {/* Root VP Node */}
          <div className="inline-block p-5 rounded-2xl bg-slate-900 text-white shadow-xl max-w-sm text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Executive Leadership</span>
            <h4 className="text-base font-black mt-1">Keyur Sangani</h4>
            <p className="text-xs text-slate-300">Super Administrator & Technical Lead</p>
            <p className="text-[11px] text-slate-400 mt-1">EMP-1 • keyur.sangani1234@gmail.com</p>
          </div>

          <div className="w-0.5 h-6 bg-slate-300 mx-auto" />

          {/* Department Branch Connectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    {dept.code}
                  </span>
                  <span className="text-[11px] text-slate-500 font-bold">{dept.employeeCount || 1} Member</span>
                </div>
                <h5 className="font-bold text-xs text-slate-900 mt-2">{dept.name}</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">Head: {dept.headName || 'Keyur Sangani'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE DEPARTMENT MODAL */}
      {addDeptModalOpen && (
        <div
          id="add-department-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddDeptModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Department</h3>
              </div>
              <button
                onClick={() => setAddDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Department Name *
                </label>
                <input
                  id="input-dept-name"
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Department Code *
                  </label>
                  <input
                    id="input-dept-code"
                    type="text"
                    required
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    placeholder="e.g. AI"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Department Head
                  </label>
                  <input
                    id="input-dept-head"
                    type="text"
                    value={deptHeadName}
                    onChange={(e) => setDeptHeadName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description
                </label>
                <textarea
                  id="input-dept-desc"
                  rows={2}
                  value={deptDescription}
                  onChange={(e) => setDeptDescription(e.target.value)}
                  placeholder="Brief summary of department focus..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddDeptModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-add-dept"
                  type="submit"
                  disabled={deptSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {deptSubmitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DESIGNATION MODAL */}
      {addDesModalOpen && (
        <div
          id="add-designation-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddDesModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Designation</h3>
              </div>
              <button
                onClick={() => setAddDesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDesignation} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Designation Title *
                </label>
                <input
                  id="input-des-title"
                  type="text"
                  required
                  value={desTitle}
                  onChange={(e) => setDesTitle(e.target.value)}
                  placeholder="e.g. Senior Staff Engineer"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Department
                </label>
                <select
                  id="select-des-dept"
                  value={desDeptId}
                  onChange={(e) => setDesDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Min Salary (Annual)
                  </label>
                  <input
                    id="input-des-min-salary"
                    type="number"
                    value={desMinSalary}
                    onChange={(e) => setDesMinSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Max Salary (Annual)
                  </label>
                  <input
                    id="input-des-max-salary"
                    type="number"
                    value={desMaxSalary}
                    onChange={(e) => setDesMaxSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddDesModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-add-des"
                  type="submit"
                  disabled={desSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {desSubmitting ? 'Saving...' : 'Add Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
