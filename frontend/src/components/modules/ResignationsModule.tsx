'use client';

import React, { useState } from 'react';
import { LogOut, CheckCircle, Clock, Check, FileText } from 'lucide-react';
import { Resignation } from '../../types/hrms';

export const ResignationsModule: React.FC = () => {
  const [resignations, setResignations] = useState<Resignation[]>([
    {
      id: 'res-1',
      employeeId: 'emp-20',
      employeeName: 'Sophia Martinez',
      employeeCode: 'PAN-020',
      departmentName: 'Finance & Operations',
      resignationDate: '2026-10-01',
      lastWorkingDay: '2026-11-15',
      noticePeriodDays: 45,
      reason: 'Relocating to another state for family commitments',
      status: 'In Clearance',
      managerApproval: {
        status: 'Approved',
        approvedAt: '2026-10-03',
      },
      clearance: {
        departmentClearance: true,
        assetReturned: false,
        financeSettlement: false,
        exitInterviewCompleted: true,
      },
      exitFeedback: 'Enjoyed working with Paneliya Technology. Great work culture.',
    },
  ]);

  const toggleClearance = (id: string, key: keyof Resignation['clearance']) => {
    setResignations((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updatedClearance = { ...r.clearance, [key]: !r.clearance[key] };
          const allDone =
            updatedClearance.departmentClearance &&
            updatedClearance.assetReturned &&
            updatedClearance.financeSettlement &&
            updatedClearance.exitInterviewCompleted;
          return {
            ...r,
            clearance: updatedClearance,
            status: allDone ? 'Completed' : 'In Clearance',
          };
        }
        return r;
      })
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Resignation & Exit Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Notice period tracking, multi-department clearances, exit interview surveys, and relieving letter generation
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {resignations.map((res) => (
          <div
            key={res.id}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-xs space-y-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
                  {res.status}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                  {res.employeeName} ({res.employeeCode})
                </h3>
                <p className="text-xs text-slate-400">
                  {res.departmentName} • Resigned on {res.resignationDate}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Last Working Day</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {res.lastWorkingDay}
                </span>
                <span className="text-xs text-blue-600 block">Notice: {res.noticePeriodDays} Days</span>
              </div>
            </div>

            {/* Reason */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold block text-slate-800 dark:text-slate-200 mb-0.5">Stated Exit Reason:</span>
              <p>{res.reason}</p>
            </div>

            {/* Clearance Checklist */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                Exit Clearance Workflow Checklist
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { key: 'departmentClearance' as const, label: '1. Department Handover' },
                  { key: 'assetReturned' as const, label: '2. IT Asset Return' },
                  { key: 'financeSettlement' as const, label: '3. Finance Settlement' },
                  { key: 'exitInterviewCompleted' as const, label: '4. Exit Interview' },
                ].map(({ key, label }) => {
                  const done = res.clearance[key];
                  return (
                    <button
                      key={key}
                      onClick={() => toggleClearance(res.id, key)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                        done
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold">{label}</span>
                      {done ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Relieving Letter action if clearance done */}
            {res.status === 'Completed' && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                    Clearance Completed Successfully
                  </h5>
                  <p className="text-[11px] text-emerald-700/80">Employee marked as Resigned.</p>
                </div>
                <button
                  onClick={() => alert(`Generated Relieving & Experience Letter for ${res.employeeName}`)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" /> Issue Relieving Letter
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
