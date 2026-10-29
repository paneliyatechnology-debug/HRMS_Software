'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, User, Briefcase, FileText, Calendar, Building } from 'lucide-react';
import { Employee } from '../../types/hrms';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onSelectEmployee: (emp: Employee) => void;
  onNavigateModule: (moduleName: string) => void;
  portalMode?: 'employee' | 'admin';
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  employees,
  onSelectEmployee,
  onNavigateModule,
  portalMode = 'admin',
}) => {
  const [query, setQuery] = useState('');

  // Handle keyboard shortcuts (Escape to close, Ctrl+K to toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const allModules = [
    { id: 'dashboard', name: 'Dashboard Overview & Analytics', icon: Briefcase, allowed: true },
    { id: 'employees', name: 'Staff Directory & Employee Profiles', icon: User, allowed: portalMode === 'admin' },
    { id: 'attendance', name: 'Attendance & Punch Clock', icon: Calendar, allowed: true },
    { id: 'leaves', name: 'Leave Applications & Balances', icon: Calendar, allowed: true },
    { id: 'payroll', name: 'Payroll & Payslips', icon: Briefcase, allowed: true },
    { id: 'documents', name: 'Employee Documents & Vault', icon: FileText, allowed: true },
    { id: 'chat', name: 'Team Messenger & Chat', icon: Briefcase, allowed: true },
    { id: 'organization', name: 'Organization Hierarchy & Departments', icon: Building, allowed: portalMode === 'admin' },
    { id: 'recruitment', name: 'Recruitment & Job Openings', icon: User, allowed: portalMode === 'admin' },
    { id: 'assets', name: 'Hardware & IT Assets Inventory', icon: Briefcase, allowed: portalMode === 'admin' },
    { id: 'announcements', name: 'Company Announcements & Notices', icon: FileText, allowed: true },
    { id: 'reports', name: 'Reports & Analytics', icon: Briefcase, allowed: portalMode === 'admin' },
    { id: 'audit-logs', name: 'Security & Compliance Audit Trail', icon: FileText, allowed: portalMode === 'admin' },
    { id: 'settings', name: 'System & Company Settings', icon: Building, allowed: true },
  ];

  const matchedModules = allModules
    .filter((m) => m.allowed)
    .filter((m) => !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));

  const matchedEmployees = q
    ? employees.filter((e) => {
        const name = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase();
        const dept = (e.departmentName || '').toLowerCase();
        const desig = (e.designationTitle || '').toLowerCase();
        const code = (e.employeeCode || '').toLowerCase();
        const email = (e.email || '').toLowerCase();
        return (
          name.includes(q) ||
          dept.includes(q) ||
          desig.includes(q) ||
          code.includes(q) ||
          email.includes(q)
        );
      })
    : employees.slice(0, 5);

  const hasResults = matchedModules.length > 0 || matchedEmployees.length > 0;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-modal-backdrop flex items-start justify-center pt-20 p-4 cursor-pointer"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden cursor-default animate-modal-zoom">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-[#4f5fe8] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, staff directory, employee code..."
            className="flex-1 bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[420px] overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
          {!hasResults && (
            <div className="py-10 text-center text-slate-400 text-xs">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-1" />
              <p className="font-semibold text-slate-700">No results found</p>
              <p className="text-slate-400 mt-0.5">No modules or employees matched &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {/* Matched Modules */}
          {matchedModules.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                HRMS Modules ({matchedModules.length})
              </p>
              <div className="space-y-1">
                {matchedModules.slice(0, 8).map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onNavigateModule(m.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#eef2ff] text-left transition-colors text-xs font-semibold text-slate-800 hover:text-[#3446bd] group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#4f5fe8] group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{m.name}</span>
                      </div>
                      <span className="text-[10px] font-normal text-slate-400 group-hover:text-[#4f5fe8]">Jump to module &rarr;</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Employees */}
          {matchedEmployees.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Employees Directory ({matchedEmployees.length})
              </p>
              <div className="space-y-1">
                {matchedEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      onSelectEmployee(emp);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#f8fafc] text-left transition-colors text-xs group border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      {emp.avatarUrl ? (
                        <img
                          src={emp.avatarUrl}
                          alt={emp.firstName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#e8ecff] text-[#3446bd] font-bold text-xs flex items-center justify-center shrink-0 border border-[#dce4f7]">
                          {emp.firstName?.[0] || 'E'}{emp.lastName?.[0] || ''}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-[#4f5fe8] transition-colors">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {emp.designationTitle || 'Staff'} {emp.departmentName ? `• ${emp.departmentName}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                        {emp.employeeCode}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Search staff by name, code, department or role</span>
          <span>Paneliya HRMS</span>
        </div>
      </div>
    </div>
  );
};
