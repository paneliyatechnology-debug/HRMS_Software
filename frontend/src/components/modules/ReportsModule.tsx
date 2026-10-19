'use client';

import React, { useState } from 'react';
import { BarChart3, Download, Printer, Filter, Calendar, TrendingUp } from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const [reportType, setReportType] = useState('headcount');

  const handleExport = () => {
    const csvContent =
      'Metric,Engineering,Product Design,HR,Marketing,Sales,Finance,Total\nHeadcount,8,5,4,4,4,3,28\nAvg Salary,125000,98000,92000,88000,95000,105000,100500\nAttrition %,2.1%,0%,0%,1.5%,3.0%,0%,1.1%\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enterprise_hrms_report_${reportType}.csv`;
    a.click();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Executive Analytics & Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data insights on headcount growth, department payroll costs, attendance ratios, and attrition trends
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
          >
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'headcount', label: 'Headcount & Diversity' },
          { id: 'attendance', label: 'Attendance & Overtime' },
          { id: 'leaves', label: 'Leave Utilization' },
          { id: 'payroll', label: 'Payroll & Compensation' },
          { id: 'attrition', label: 'Attrition & Turnover' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition ${
              reportType === t.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Report Table Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            {reportType.toUpperCase()} Statistical Breakdown (H2 2026)
          </h3>
          <span className="text-xs text-slate-400">Currency: USD ($) • ISO Verified</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Headcount</th>
                <th className="py-3 px-4">Present Ratio</th>
                <th className="py-3 px-4">Avg Monthly Cost</th>
                <th className="py-3 px-4">Annual Budget</th>
                <th className="py-3 px-4">Turnover %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { dept: 'Engineering', count: 8, ratio: '96.2%', cost: '$98,400', budget: '$1,200,000', turn: '1.2%' },
                { dept: 'Product Design', count: 5, ratio: '94.8%', cost: '$58,200', budget: '$720,000', turn: '0.0%' },
                { dept: 'Human Resources', count: 4, ratio: '97.5%', cost: '$38,600', budget: '$480,000', turn: '0.0%' },
                { dept: 'Marketing & Growth', count: 4, ratio: '93.0%', cost: '$42,500', budget: '$540,000', turn: '2.0%' },
                { dept: 'Sales & Business Dev', count: 4, ratio: '95.1%', cost: '$46,000', budget: '$600,000', turn: '2.5%' },
                { dept: 'Finance & Operations', count: 3, ratio: '98.0%', cost: '$36,800', budget: '$450,000', turn: '0.0%' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{row.dept}</td>
                  <td className="py-3.5 px-4 font-semibold text-blue-600">{row.count} Staff</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-600">{row.ratio}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-700">{row.cost}</td>
                  <td className="py-3.5 px-4 text-slate-500">{row.budget}</td>
                  <td className="py-3.5 px-4 text-slate-500">{row.turn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
