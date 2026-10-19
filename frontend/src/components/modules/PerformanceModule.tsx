'use client';

import React, { useState } from 'react';
import { TrendingUp, Star, Award, CheckCircle, Target, MessageSquare } from 'lucide-react';
import { PerformanceReview } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';

interface PerformanceModuleProps {
  reviews: PerformanceReview[];
  onRefresh: () => void;
}

export const PerformanceModule: React.FC<PerformanceModuleProps> = ({ reviews, onRefresh }) => {
  const { role } = useAuth();
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  const displayReviews = reviews.length > 0 ? reviews : [
    {
      id: 'pr-rev-1',
      cycleId: 'cyc-1',
      cycleTitle: 'Q3-Q4 2026 Mid-Year Performance & Appraisal Cycle',
      employeeId: 'emp-8',
      employeeName: 'Juan Hogan',
      managerId: 'emp-5',
      managerName: 'Priya Sharma',
      goals: [
        { title: 'Redesign HRMS SaaS Design System', description: 'Deliver complete component token library with 100% responsive coverage', weight: 40, progress: 95 },
        { title: 'Mobile UX Usability Optimization', description: 'Reduce task completion time for mobile clock-in by 30%', weight: 30, progress: 85 },
        { title: 'Mentorship of Junior Designers', description: 'Lead bi-weekly critique sessions and conduct reviews', weight: 30, progress: 90 },
      ],
      selfRating: 4.5,
      selfComments: 'Delivered major design updates ahead of schedule.',
      managerRating: 4.8,
      managerFeedback: 'Juan continues to be a cornerstone of our design team. Outstanding quality.',
      finalRating: 4.7,
      appraisalRecommended: 'Promotion to Lead UI/UX Designer + 15% Merit Increment',
      status: 'Manager Review' as const,
    },
    {
      id: 'pr-rev-2',
      cycleId: 'cyc-1',
      cycleTitle: 'Q3-Q4 2026 Mid-Year Performance & Appraisal Cycle',
      employeeId: 'emp-9',
      employeeName: 'Maci Guerra',
      managerId: 'emp-4',
      managerName: 'Alex Mercer',
      goals: [
        { title: 'Migrate Core Services to NestJS', description: 'Re-architect monolithic endpoints into clean modular Nest.js micro-controllers', weight: 50, progress: 90 },
        { title: 'API Response Time < 80ms', description: 'Implement database indexing and caching', weight: 50, progress: 85 },
      ],
      selfRating: 4.2,
      selfComments: 'Completed backend restructuring and maintained 99.98% uptime.',
      managerRating: 4.5,
      managerFeedback: 'Exceptional architectural rigor and reliability.',
      finalRating: 4.4,
      status: 'Completed' as const,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Performance Management & OKRs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Goal tracking, quarterly appraisal cycles, self-assessment ratings, and manager 360-degree feedback
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
          Cycle: Q3-Q4 2026 Active
        </span>
      </div>

      {/* Review Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayReviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-xs space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {rev.employeeName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Manager: {rev.managerName}</p>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-600 font-black text-xs">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{rev.finalRating || rev.managerRating || 4.5} / 5.0</span>
              </div>
            </div>

            {/* OKR Goals Progress */}
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                Key Objectives & Deliverables (OKRs)
              </p>
              <div className="space-y-3">
                {rev.goals.map((g, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{g.title}</span>
                      <span className="text-blue-600 font-bold">{g.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback box */}
            {rev.managerFeedback && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/40">
                <span className="font-bold block text-slate-800 dark:text-slate-200 mb-1">
                  Manager Appraisal Recommendation:
                </span>
                <p>{rev.managerFeedback}</p>
                {rev.appraisalRecommended && (
                  <p className="mt-2 text-emerald-600 font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> {rev.appraisalRecommended}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
