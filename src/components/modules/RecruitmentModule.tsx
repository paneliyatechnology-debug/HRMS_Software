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
  CheckCircle2,
  DollarSign,
  MapPin,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { JobOpening, Candidate, CandidateStatus } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';

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
  const { showToast } = useSocket();
  const [selectedJob, setSelectedJob] = useState<string>('ALL');

  // Modals state
  const [createJobModalOpen, setCreateJobModalOpen] = useState(false);
  const [addCandidateModalOpen, setAddCandidateModalOpen] = useState(false);
  const [interviewModalCand, setInterviewModalCand] = useState<Candidate | null>(null);

  // New Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDepartment, setJobDepartment] = useState('Engineering & Technology');
  const [jobLocation, setJobLocation] = useState('Surat, Gujarat (Hybrid)');
  const [jobOpeningsCount, setJobOpeningsCount] = useState(1);
  const [jobSalaryRange, setJobSalaryRange] = useState('₹10,00,000 - ₹15,00,000');
  const [jobDescription, setJobDescription] = useState('');
  const [jobSubmitting, setJobSubmitting] = useState(false);

  // New Candidate Form State
  const [candFullName, setCandFullName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [candExperience, setCandExperience] = useState(3);
  const [candCurrentCompany, setCandCurrentCompany] = useState('');
  const [candSkills, setCandSkills] = useState('React, TypeScript, Node.js');
  const [candJobId, setCandJobId] = useState(jobs[0]?.id || 'job-1');
  const [candSubmitting, setCandSubmitting] = useState(false);

  // Interview Form State
  const [interviewRound, setInterviewRound] = useState('Technical Architecture Round');
  const [interviewerName, setInterviewerName] = useState('Keyur Sangani (Lead Architect)');
  const [interviewScheduledAt, setInterviewScheduledAt] = useState('2026-10-25 10:00 AM IST');
  const [interviewSubmitting, setInterviewSubmitting] = useState(false);

  // Convert to employee loading
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const pipelineStages: { stage: CandidateStatus; label: string }[] = [
    { stage: 'Applied', label: 'Applied' },
    { stage: 'Screening', label: 'Screening' },
    { stage: 'Interview', label: 'Interview' },
    { stage: 'Offer', label: 'Offer Sent' },
    { stage: 'Hired', label: 'Hired' },
  ];

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    setJobSubmitting(true);
    try {
      await api.createJob({
        title: jobTitle,
        departmentName: jobDepartment,
        location: jobLocation,
        openingsCount: Number(jobOpeningsCount),
        salaryRange: jobSalaryRange,
        description: jobDescription,
      });
      showToast?.({
        title: 'Job Opening Published',
        message: `${jobTitle} has been published to the careers roster.`,
        type: 'success',
      });
      setCreateJobModalOpen(false);
      setJobTitle('');
      setJobDescription('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setJobSubmitting(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candFullName.trim() || !candEmail.trim()) return;

    setCandSubmitting(true);
    try {
      const selectedJobObj = jobs.find((j) => j.id === candJobId) || jobs[0];
      await api.createCandidate({
        jobId: candJobId,
        jobTitle: selectedJobObj?.title || 'Software Engineer',
        fullName: candFullName,
        email: candEmail,
        phone: candPhone,
        experienceYears: Number(candExperience),
        currentCompany: candCurrentCompany,
        skills: candSkills.split(',').map((s) => s.trim()),
      });
      showToast?.({
        title: 'Candidate Profile Added',
        message: `${candFullName} has entered the talent pipeline.`,
        type: 'success',
      });
      setAddCandidateModalOpen(false);
      setCandFullName('');
      setCandEmail('');
      setCandPhone('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCandSubmitting(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewModalCand) return;

    setInterviewSubmitting(true);
    try {
      await api.scheduleInterview(interviewModalCand.id, {
        round: interviewRound,
        interviewerName,
        scheduledAt: interviewScheduledAt,
      });
      showToast?.({
        title: 'Interview Scheduled',
        message: `${interviewRound} scheduled for ${interviewModalCand.fullName}.`,
        type: 'success',
      });
      setInterviewModalCand(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setInterviewSubmitting(false);
    }
  };

  const handleStageChange = async (candidateId: string, newStage: CandidateStatus) => {
    try {
      await api.updateCandidateStatus(candidateId, newStage);
      showToast?.({
        title: 'Pipeline Updated',
        message: `Candidate moved to ${newStage} stage.`,
        type: 'info',
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleHireToEmployee = async (candidate: Candidate) => {
    setConvertingId(candidate.id);
    try {
      await api.convertCandidateToEmployee(candidate.id, 'Keyur Sangani');
      showToast?.({
        title: 'Hired & Onboarded!',
        message: `${candidate.fullName} has been converted into an active employee roster.`,
        type: 'success',
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setConvertingId(null);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (selectedJob !== 'ALL' && c.jobId !== selectedJob) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Recruitment & Talent Pipeline (ATS)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Published job requisitions, candidate pipeline tracking, interview scheduling, and 1-click onboarding
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            id="select-job-requisition-filter"
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none shadow-2xs"
          >
            <option value="ALL">All Requisitions ({jobs.length})</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>

          <button
            id="btn-add-candidate-modal"
            onClick={() => setAddCandidateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Candidate</span>
          </button>

          <button
            id="btn-create-job-modal"
            onClick={() => setCreateJobModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Job Opening</span>
          </button>
        </div>
      </div>

      {/* Published Requisitions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                  {job.departmentName}
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {job.salaryRange}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 mt-2.5">{job.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {job.location} • {job.experienceLevel} • {job.openingsCount} Openings
              </p>
              <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                {job.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{job.applicantCount || 0} Applicants</span>
              <button
                onClick={() => setSelectedJob(job.id)}
                className="text-xs font-bold text-slate-900 hover:underline"
              >
                View Pipeline →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Pipeline Kanban */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Candidate Evaluation Stages ({filteredCandidates.length} Active Applicants)
          </h2>
          <span className="text-xs text-slate-500 font-medium">Drag or select stage to advance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {pipelineStages.map((col) => {
            const stageCandidates = filteredCandidates.filter((c) => c.status === col.stage);

            return (
              <div
                key={col.stage}
                className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 flex flex-col min-h-[300px]"
              >
                <div className="flex items-center justify-between mb-2.5 px-1 pb-2 border-b border-slate-200/60">
                  <span className="text-xs font-bold text-slate-800">{col.label}</span>
                  <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                    {stageCandidates.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto [scrollbar-width:thin]">
                  {stageCandidates.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-center text-[11px] text-slate-400">
                      No candidates in {col.label}
                    </div>
                  ) : (
                    stageCandidates.map((cand) => (
                      <div
                        key={cand.id}
                        className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {cand.fullName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{cand.jobTitle}</p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold text-slate-700">
                            {cand.experienceYears}y exp
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {cand.skills?.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/60 text-[9px] font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          {col.stage === 'Interview' ? (
                            <button
                              id={`btn-schedule-interview-${cand.id}`}
                              onClick={() => setInterviewModalCand(cand)}
                              className="text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-1"
                            >
                              <Calendar className="w-3 h-3" />
                              Schedule
                            </button>
                          ) : col.stage === 'Offer' || col.stage === 'Hired' ? (
                            <button
                              id={`btn-hire-${cand.id}`}
                              onClick={() => handleHireToEmployee(cand)}
                              disabled={convertingId === cand.id}
                              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {convertingId === cand.id ? 'Hiring...' : 'Convert to Staff'}
                            </button>
                          ) : (
                            <select
                              value={cand.status}
                              onChange={(e) =>
                                handleStageChange(cand.id, e.target.value as CandidateStatus)
                              }
                              className="text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                            >
                              <option value="Applied">Applied</option>
                              <option value="Screening">Screening</option>
                              <option value="Interview">Interview</option>
                              <option value="Offer">Offer</option>
                              <option value="Hired">Hired</option>
                            </select>
                          )}

                          <select
                            value={cand.status}
                            onChange={(e) =>
                              handleStageChange(cand.id, e.target.value as CandidateStatus)
                            }
                            className="text-[10px] text-slate-500 bg-transparent hover:text-slate-800 cursor-pointer font-medium"
                            title="Move candidate stage"
                          >
                            <option value="">Move...</option>
                            <option value="Screening">Screening</option>
                            <option value="Interview">Interview</option>
                            <option value="Offer">Offer</option>
                            <option value="Hired">Hired</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE JOB MODAL */}
      {createJobModalOpen && (
        <div
          id="create-job-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateJobModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Publish New Job Opening</h3>
              </div>
              <button
                onClick={() => setCreateJobModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Job Title *
                </label>
                <input
                  id="input-job-title"
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior AI Engineer"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Department
                  </label>
                  <select
                    id="select-job-department"
                    value={jobDepartment}
                    onChange={(e) => setJobDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="Engineering & Technology">Engineering & Technology</option>
                    <option value="Product & UX Design">Product & UX Design</option>
                    <option value="Administration & Management">Administration</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Openings Count
                  </label>
                  <input
                    id="input-job-openings"
                    type="number"
                    min="1"
                    value={jobOpeningsCount}
                    onChange={(e) => setJobOpeningsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Location
                  </label>
                  <input
                    id="input-job-location"
                    type="text"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Salary Band
                  </label>
                  <input
                    id="input-job-salary"
                    type="text"
                    value={jobSalaryRange}
                    onChange={(e) => setJobSalaryRange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description & Requirements
                </label>
                <textarea
                  id="input-job-description"
                  rows={3}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Outline responsibilities and key requirements..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateJobModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-create-job"
                  type="submit"
                  disabled={jobSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {jobSubmitting ? 'Publishing...' : 'Publish Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CANDIDATE MODAL */}
      {addCandidateModalOpen && (
        <div
          id="add-candidate-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddCandidateModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add Candidate to Pipeline</h3>
              </div>
              <button
                onClick={() => setAddCandidateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Job Opening
                </label>
                <select
                  value={candJobId}
                  onChange={(e) => setCandJobId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name *
                </label>
                <input
                  id="input-cand-fullname"
                  type="text"
                  required
                  value={candFullName}
                  onChange={(e) => setCandFullName(e.target.value)}
                  placeholder="e.g. Lucas Scott"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email *</label>
                  <input
                    id="input-cand-email"
                    type="email"
                    required
                    value={candEmail}
                    onChange={(e) => setCandEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    id="input-cand-phone"
                    type="text"
                    value={candPhone}
                    onChange={(e) => setCandPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={candExperience}
                    onChange={(e) => setCandExperience(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Current Company
                  </label>
                  <input
                    type="text"
                    value={candCurrentCompany}
                    onChange={(e) => setCandCurrentCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Skills</label>
                <input
                  type="text"
                  value={candSkills}
                  onChange={(e) => setCandSkills(e.target.value)}
                  placeholder="Comma-separated (e.g. React, NestJS, TypeScript)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddCandidateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-add-candidate"
                  type="submit"
                  disabled={candSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {candSubmitting ? 'Adding...' : 'Add to Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {interviewModalCand && (
        <div
          id="schedule-interview-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInterviewModalCand(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Schedule Interview Round</h3>
                <p className="text-xs text-slate-500">Candidate: {interviewModalCand.fullName}</p>
              </div>
              <button
                onClick={() => setInterviewModalCand(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleInterview} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Interview Round
                </label>
                <input
                  id="input-interview-round"
                  type="text"
                  required
                  value={interviewRound}
                  onChange={(e) => setInterviewRound(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Interviewer Name & Role
                </label>
                <input
                  id="input-interviewer-name"
                  type="text"
                  required
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Scheduled Date & Time
                </label>
                <input
                  id="input-interview-time"
                  type="text"
                  required
                  value={interviewScheduledAt}
                  onChange={(e) => setInterviewScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInterviewModalCand(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-schedule-interview"
                  type="submit"
                  disabled={interviewSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {interviewSubmitting ? 'Booking...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
