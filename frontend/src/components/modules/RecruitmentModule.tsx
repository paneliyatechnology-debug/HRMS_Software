'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Briefcase,
  Plus,
  Calendar,
  Clock,
  ArrowRight,
  UserPlus,
  X,
  MoreVertical,
} from 'lucide-react';
import { JobOpening, Candidate, CandidateStatus } from '../../types/hrms';
import { api } from '../../lib/api';

interface RecruitmentModuleProps {
  jobs: JobOpening[];
  candidates: Candidate[];
  onRefresh: () => void;
}

export const RecruitmentModule: React.FC<RecruitmentModuleProps> = ({
  jobs,
  candidates,
  onRefresh,
}) => {
  const [selectedJob, setSelectedJob] = useState<string>('ALL');

  const pipelineStages: { stage: CandidateStatus; label: string; count: number }[] = [
    { stage: 'Applied', label: 'Applied', count: 4 },
    { stage: 'Screening', label: 'Screening', count: 3 },
    { stage: 'Interview', label: 'Interview', count: 2 },
    { stage: 'Shortlisted', label: 'Shortlisted', count: 2 },
    { stage: 'Offer', label: 'Offer Sent', count: 1 },
    { stage: 'Hired', label: 'Hired', count: 1 },
  ];

  const defaultMockCandidates = [
    {
      id: 'c-1',
      name: 'Elena Rostova',
      role: 'Staff Product Designer',
      stage: 'Interview' as CandidateStatus,
      experience: '6 Yrs',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80',
      appliedDate: '2 days ago',
    },
    {
      id: 'c-2',
      name: 'Marcus Vance',
      role: 'Senior Backend Engineer (Go/Nest)',
      stage: 'Offer' as CandidateStatus,
      experience: '5 Yrs',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',
      appliedDate: '1 week ago',
    },
    {
      id: 'c-3',
      name: 'Pooja Agarwal',
      role: 'Senior Full Stack Engineer',
      stage: 'Screening' as CandidateStatus,
      experience: '4 Yrs',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
      appliedDate: '3 days ago',
    },
    {
      id: 'c-4',
      name: 'Kaden Alvarado',
      role: 'DevOps / Site Reliability',
      stage: 'Applied' as CandidateStatus,
      experience: '3 Yrs',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80',
      appliedDate: 'Today',
    },
  ];

  const handleHire = (candidateName: string) => {
    alert(`Candidate ${candidateName} has been converted into an Active Employee with onboarding records created!`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Recruitment & Pipeline (ATS)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage job requisitions, track candidates across stages, and 1-click hire conversion
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="px-3 py-1.5 rounded-full border border-slate-200/80 text-xs text-slate-700 bg-white focus:outline-hidden"
          >
            <option value="ALL">All Requisitions ({jobs.length || 3})</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => alert('New Job Requisition dialog')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Job</span>
          </button>
        </div>
      </div>

      {/* Published Requisitions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
              Product Design
            </span>
            <span className="text-xs font-bold text-slate-900">$120k - $140k</span>
          </div>
          <h4 className="font-bold text-sm text-slate-900 mt-3">Staff Product Designer</h4>
          <p className="text-xs text-slate-400 mt-1">San Francisco, CA • Senior Level</p>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>6 Candidates</span>
            <span className="text-blue-600 font-semibold cursor-pointer">View Pipeline →</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              Engineering
            </span>
            <span className="text-xs font-bold text-slate-900">$140k - $175k</span>
          </div>
          <h4 className="font-bold text-sm text-slate-900 mt-3">Senior Backend Engineer</h4>
          <p className="text-xs text-slate-400 mt-1">Remote • Full-time</p>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>12 Candidates</span>
            <span className="text-blue-600 font-semibold cursor-pointer">View Pipeline →</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
              Operations
            </span>
            <span className="text-xs font-bold text-slate-900">$90k - $110k</span>
          </div>
          <h4 className="font-bold text-sm text-slate-900 mt-3">HR Operations Specialist</h4>
          <p className="text-xs text-slate-400 mt-1">New York, NY • Mid Level</p>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>4 Candidates</span>
            <span className="text-blue-600 font-semibold cursor-pointer">View Pipeline →</span>
          </div>
        </div>
      </div>

      {/* Candidate Pipeline Kanban */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Applicant Tracking Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {pipelineStages.slice(0, 4).map((col) => (
            <div key={col.stage} className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-800">{col.label}</span>
                <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                  {col.count}
                </span>
              </div>

              <div className="space-y-2.5">
                {defaultMockCandidates
                  .filter((c) => c.stage === col.stage || (col.stage === 'Applied' && c.stage === 'Applied'))
                  .map((cand) => (
                    <div
                      key={cand.id}
                      className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs hover:shadow-xs transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{cand.name}</p>
                          <p className="text-[10px] text-slate-400">{cand.role}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{cand.experience}</span>
                        <button
                          onClick={() => handleHire(cand.name)}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Hire →
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
