'use client';

import React, { useState } from 'react';
import { Building2, Users, MapPin, Network, Plus, ChevronRight } from 'lucide-react';
import { Department, Designation, Location } from '../../types/hrms';

interface OrganizationModuleProps {
  departments: Department[];
  designations: Designation[];
  locations: Location[];
  onRefresh: () => void;
}

export const OrganizationModule: React.FC<OrganizationModuleProps> = ({
  departments,
  designations,
  locations,
}) => {
  const [activeTab, setActiveTab] = useState<'departments' | 'designations' | 'hierarchy'>('departments');

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Organization & Hierarchy
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Department structure, designation salary bands, office locations, and visual corporate reporting tree
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 text-xs font-bold">
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'departments'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('designations')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'designations'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Designations ({designations.length})
          </button>
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'hierarchy'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Visual Org Chart
          </button>
        </div>
      </div>

      {/* Tab 1: Departments */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {dept.code}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5" /> {dept.employeeCount} Members
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-3">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {dept.description || 'Core business division'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Department Head</span>
                  <span className="font-bold text-slate-800">
                    {dept.headName || 'Alex Mercer'}
                  </span>
                </div>
                <button
                  onClick={() => alert(`Opening ${dept.name} settings`)}
                  className="p-1 text-blue-600 hover:text-blue-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Designations */}
      {activeTab === 'designations' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Job Titles & Compensation Bands
          </h3>

          <div className="overflow-x-auto">
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
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {des.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {des.departmentName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      ${des.minSalary.toLocaleString()} - ${des.maxSalary.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-[10px]">
                        Enterprise Band
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
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 text-center">
          <h3 className="text-base font-bold text-slate-900 mb-8">
            Company Executive Hierarchy
          </h3>

          {/* Root VP Node */}
          <div className="inline-block p-4 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 max-w-xs text-left mb-8">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Executive Leadership</span>
            <h4 className="text-sm font-extrabold mt-1">John Deo</h4>
            <p className="text-xs text-blue-100">VP of Engineering & Interim CEO</p>
          </div>

          {/* Department Branch Connectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {departments.slice(0, 3).map((dept) => (
              <div
                key={dept.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {dept.code}
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">{dept.employeeCount} Staff</span>
                </div>
                <h5 className="font-bold text-xs text-slate-900 mt-2">{dept.name}</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">Lead: {dept.headName}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
