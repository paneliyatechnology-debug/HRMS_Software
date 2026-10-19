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
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  employees,
  onSelectEmployee,
  onNavigateModule,
}) => {
  const [query, setQuery] = useState('');

  // Handle Ctrl+K shortcut globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const matchedEmployees = query.trim()
    ? employees.filter(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
          e.departmentName.toLowerCase().includes(query.toLowerCase()) ||
          e.designationTitle.toLowerCase().includes(query.toLowerCase()) ||
          e.employeeCode.toLowerCase().includes(query.toLowerCase())
      )
    : employees.slice(0, 4);

  const modules = [
    { id: 'attendance', name: 'Attendance & Punch Clock', icon: Calendar },
    { id: 'leaves', name: 'Leave Applications & Balances', icon: Calendar },
    { id: 'payroll', name: 'Payroll & Payslips', icon: Briefcase },
    { id: 'recruitment', name: 'Recruitment & Job Openings', icon: User },
    { id: 'organization', name: 'Organization Hierarchy & Departments', icon: Building },
    { id: 'documents', name: 'Employee Documents', icon: FileText },
  ].filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in flex items-start justify-center pt-24 p-4 cursor-pointer"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden cursor-default">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees, roles, departments, documents..."
            className="flex-1 bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {/* Matched Modules */}
          {modules.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Quick Navigation
              </p>
              <div className="space-y-1">
                {modules.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onNavigateModule(m.id);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <Icon className="w-4 h-4 text-blue-600" />
                      <span>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Employees */}
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Employees Directory
            </p>
            <div className="space-y-1">
              {matchedEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => {
                    onSelectEmployee(emp);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatarUrl}
                      alt={emp.firstName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {emp.designationTitle} • {emp.departmentName}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {emp.employeeCode}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
