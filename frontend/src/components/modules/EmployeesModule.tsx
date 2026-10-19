'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  Grid,
  List,
  MoreVertical,
  Mail,
  Phone,
  Building,
  UserCheck,
} from 'lucide-react';
import { Employee, Department } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';

interface EmployeesModuleProps {
  employees: Employee[];
  departments: Department[];
  onSelectEmployee: (emp: Employee) => void;
  onOpenAddModal: () => void;
}

export const EmployeesModule: React.FC<EmployeesModuleProps> = ({
  employees,
  departments,
  onSelectEmployee,
  onOpenAddModal,
}) => {
  const { hasPermission } = useAuth();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      emp.designationTitle.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || emp.departmentId === selectedDept;
    const matchesStatus = selectedStatus === 'ALL' || emp.status === selectedStatus;
    const matchesType = selectedType === 'ALL' || emp.employmentType === selectedType;

    return matchesSearch && matchesDept && matchesStatus && matchesType;
  });

  const handleExportCSV = () => {
    const headers = 'Employee Code,Name,Email,Department,Designation,Employment Type,Status,Joining Date,Basic Salary\n';
    const rows = filtered
      .map(
        (e) =>
          `"${e.employeeCode}","${e.firstName} ${e.lastName}","${e.email}","${e.departmentName}","${e.designationTitle}","${e.employmentType}","${e.status}","${e.joiningDate}","${e.salary.basic}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Employee Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage complete workforce profiles, employment statuses, and documentation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200/80 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          {hasPermission('MANAGE_EMPLOYEES') && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, code, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full border border-slate-200/80 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-full border border-slate-200/80 bg-slate-50/60 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-full border border-slate-200/80 bg-slate-50/60 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="On Notice">On Notice</option>
            <option value="Resigned">Resigned</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-full border border-slate-200/80 bg-slate-50/60 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Remote">Remote</option>
            <option value="Part-time">Part-time</option>
            <option value="Contractual">Contractual</option>
            <option value="Hourly">Hourly</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 border border-slate-200/80 rounded-full p-0.5 bg-slate-50">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-full transition ${
              viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-full transition ${
              viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Mode */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" className="rounded text-blue-600 border-slate-300" />
                  </th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp)}
                    className="hover:bg-slate-50/70 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded text-blue-600 border-slate-300" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatarUrl}
                          alt={emp.firstName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {emp.employeeCode} • {emp.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {emp.departmentName}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {emp.designationTitle}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          emp.employmentType === 'Full-time'
                            ? 'text-blue-600'
                            : emp.employmentType === 'Remote'
                            ? 'text-amber-600'
                            : emp.employmentType === 'Part-time'
                            ? 'text-emerald-600'
                            : 'text-purple-600'
                        }`}
                      >
                        {emp.employmentType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                          emp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-600'
                            : emp.status === 'Probation'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {emp.joiningDate}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEmployee(emp);
                        }}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              onClick={() => onSelectEmployee(emp)}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatarUrl}
                      alt={emp.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {emp.firstName} {emp.lastName}
                      </h4>
                      <p className="text-xs text-slate-400">{emp.designationTitle}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                      emp.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-600'
                        : emp.status === 'Probation'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {emp.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.departmentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-slate-400">
                  {emp.employmentType}
                </span>
                <span className="text-blue-600 font-semibold group-hover:underline">
                  View Profile →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
