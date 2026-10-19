'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Briefcase,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  Star,
  ArrowRight,
  UserPlus,
  X,
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
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [interviewData, setInterviewData] = useState({
    round: 'Technical Architecture Round',
    interviewerName: 'Alex Mercer',
    scheduledAt: '2026-10-22T14:00',
  });

  const pipelineStages: { stage: CandidateStatus; label: string; color: string }[] = [
    { stage: 'Applied', label: 'Applied', color: 'border-blue-400 bg-blue-50/40 text-blue-700' },
    { stage: 'Screening', label: 'Screening', color: 'border-purple-400 bg-purple-50/40 text-purple-700' },
    { stage: 'Interview', label: 'Interview', color: 'border-amber-400 bg-amber-50/40 text-amber-700' },
    { stage: 'Shortlisted', label: 'Shortlisted', color: 'border-indigo-400 bg-indigo-50/40 text-indigo-700' },
    { stage: 'Offer', label: 'Offer Sent', color: 'border-teal-400 bg-teal-50/40 text-teal-700' },
    { stage: 'Hired', label: 'Hired', color: 'border-emerald-500 bg-emerald-50/40 text-emerald-700' },
  ];

  const filteredCandidates =
    selectedJob === 'ALL'
      ? candidates
      : candidates.filter((c) => c.jobId === selectedJob);

  const handleMoveStage = async (candidateId: string, newStage: CandidateStatus) => {
    try {
      await api.updateCandidateStatus(candidateId, newStage);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to move candidate');
    }
  };

  const handleConvertToEmployee = async (candidate: Candidate) => {
    const confirmHire = confirm(
      `Convert ${candidate.fullName} into an active employee in Paneliya HRMS?`
    );
    if (!confirmHire) return;

    try {
      const res = await api.convertCandidateToEmployee(candidate.id);
      alert(res.message || 'Candidate converted to employee successfully!');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Conversion failed');
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    try {
      await api.updateCandidateStatus(selectedCandidate.id, 'Interview');
      alert(`Interview scheduled for ${selectedCandidate.fullName}!`);
      setScheduleModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Recruitment & Applicant Tracking (ATS)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage open job requisitions, candidate Kanban pipelines, interview stages, and 1-click employee conversion
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
          >
            <option value="ALL">All Requisitions ({jobs.length})</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} ({job.applicantCount || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Published Requisitions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {jobs.slice(0, 3).map((job) => (
          <div
            key={job.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  {job.departmentName}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {job.salaryRange}
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">
                {job.title}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">{job.location} • {job.experienceLevel}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">
                {job.applicantCount || 24} Candidates
              </span>
              <span className="text-[11px] font-bold text-emerald-600">Active Pipeline</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Kanban Pipeline */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-xs p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
          <UserCheck className="w-5 h-5 text-blue-600" /> Candidate Pipeline Stages
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {pipelineStages.map(({ stage, label, color }) => {
            const candidatesInStage = filteredCandidates.filter((c) => c.status === stage);

            return (
              <div
                key={stage}
                className="bg-slate-50/60 dark:bg-slate-850 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/40 flex flex-col min-h-[360px]"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {label}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    {candidatesInStage.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {candidatesInStage.map((cand) => (
                    <div
                      key={cand.id}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <h5 className="font-bold text-slate-900 dark:text-white">
                          {cand.fullName}
                        </h5>
                        <div className="flex items-center text-amber-500 font-bold text-[10px]">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{cand.rating || 4.5}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                        {cand.jobTitle}
                      </p>

                      <p className="text-[10px] text-slate-400">
                        {cand.experienceYears} yrs exp • {cand.currentCompany || 'Startup'}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {cand.skills?.slice(0, 2).map((s) => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Stage Action Controls */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1 text-[10px]">
                        {stage === 'Interview' ? (
                          <button
                            onClick={() => {
                              setSelectedCandidate(cand);
                              setScheduleModalOpen(true);
                            }}
                            className="px-2 py-1 rounded bg-blue-50 text-blue-600 font-bold hover:bg-blue-100"
                          >
                            Schedule
                          </button>
                        ) : stage === 'Offer' ? (
                          <button
                            onClick={() => handleConvertToEmployee(cand)}
                            className="w-full py-1 rounded bg-emerald-600 text-white font-bold flex items-center justify-center gap-1 hover:bg-emerald-700"
                          >
                            <UserPlus className="w-3 h-3" /> Hire & Onboard
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const nextStages: Record<CandidateStatus, CandidateStatus> = {
                                Applied: 'Screening',
                                Screening: 'Interview',
                                Interview: 'Shortlisted',
                                Shortlisted: 'Offer',
                                Offer: 'Hired',
                                Hired: 'Hired',
                                Selected: 'Offer',
                                Rejected: 'Applied',
                              };
                              handleMoveStage(cand.id, nextStages[stage]);
                            }}
                            className="ml-auto text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
                          >
                            Next <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {scheduleModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative">
            <button
              onClick={() => setScheduleModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Interview</h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              For {selectedCandidate.fullName} ({selectedCandidate.jobTitle})
            </p>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Interview Round</label>
                <input
                  type="text"
                  value={interviewData.round}
                  onChange={(e) => setInterviewData({ ...interviewData, round: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Interviewer Name</label>
                <input
                  type="text"
                  value={interviewData.interviewerName}
                  onChange={(e) => setInterviewData({ ...interviewData, interviewerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={interviewData.scheduledAt}
                  onChange={(e) => setInterviewData({ ...interviewData, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Confirm & Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
