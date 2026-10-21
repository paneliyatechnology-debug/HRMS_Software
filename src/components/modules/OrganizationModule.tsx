'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Users, MapPin, Network, Plus, ChevronRight, Briefcase } from 'lucide-react';
import { Department, Designation, Location } from '../../types/hrms';

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
  const [activeTab, setActiveTab] = useState<'departments' | 'designations' | 'hierarchy'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'departments'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('designations')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'designations'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Designations ({designations.length})
          </button>
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'hierarchy'
                ? 'bg-white text-indigo-700 shadow-xs'
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
              onClick={() => alert('New Department creation modal')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
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
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {dept.code}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                      <Users className="w-3.5 h-3.5" /> {dept.employeeCount} Members
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
                  <button
                    onClick={() => alert(`Department details: ${dept.name}`)}
                    className="p-1 text-indigo-600 hover:text-indigo-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
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
              onClick={() => alert('New Designation creation modal')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
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
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{des.title}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {des.departmentName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      {des.minSalary > 0
                        ? `$${des.minSalary.toLocaleString()} - $${des.maxSalary.toLocaleString()}`
                        : 'Standard Enterprise Band'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        Executive & Admin
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
          <div className="inline-block p-5 rounded-2xl bg-[#09203F] text-white shadow-xl max-w-sm text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Executive Leadership</span>
            <h4 className="text-base font-black mt-1">Keyur Sangani</h4>
            <p className="text-xs text-slate-300">App Administrator & Organization Lead</p>
            <p className="text-[11px] text-slate-400 mt-1">EMP-1 • keyur.sangani1234@gmail.com</p>
          </div>

          <div className="w-0.5 h-6 bg-slate-300 mx-auto" />

          {/* Department Branch Connectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {dept.code}
                  </span>
                  <span className="text-[11px] text-slate-500 font-bold">{dept.employeeCount} Member</span>
                </div>
                <h5 className="font-bold text-xs text-slate-900 mt-2">{dept.name}</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">Head: {dept.headName || 'Keyur Sangani'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
