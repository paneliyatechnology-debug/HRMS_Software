'use client';

import React, { useState } from 'react';
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
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [selectedJoining, setSelectedJoining] = useState('Any');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      selectedStatus === 'All' || emp.status?.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="space-y-4 max-w-7xl mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employees</h1>
          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
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
            type="text"
            placeholder="Search name, email or employee ID /"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
            /
          </span>
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
              <option value="Active">Active</option>
              <option value="All">All Statuses</option>
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
        <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-500 font-medium">
          1–{filtered.length} of {filtered.length}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-bold">EMPLOYEE ID</th>
                <th className="py-3 px-4 font-bold">NAME</th>
                <th className="py-3 px-4 font-bold">EMAIL</th>
                <th className="py-3 px-4 font-bold">USER ROLE</th>
                <th className="py-3 px-4 font-bold">REPORTING TO</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((emp) => {
                const isCurrentUser =
                  emp.email === (user.email || 'keyur.sangani1234@gmail.com') ||
                  emp.firstName === 'Keyur';
                const isSelected = selectedRows.includes(emp.id);

                return (
                  <tr
                    key={emp.id}
                    className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-50/30' : ''
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
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {emp.employeeCode || 'EMP-1'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center shrink-0">
                          {emp.firstName[0]}
                          {emp.lastName ? emp.lastName[0] : ''}
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
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                            New Hire
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {emp.email}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <div className="flex items-center gap-1">
                        <span>{emp.designationTitle || 'App Administrator'}</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {emp.reportingManagerName || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Active</span>
                      </span>
                    </td>
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
    </div>
  );
};
