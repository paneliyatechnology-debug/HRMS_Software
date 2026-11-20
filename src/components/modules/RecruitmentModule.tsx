'use client';

import React, { useState, useEffect } from 'react';
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
  FileSpreadsheet,
  Mail,
  Phone,
  Building2,
  Search,
  Award,
  FileText,
  Users,
} from 'lucide-react';
import { JobOpening, Candidate, CandidateStatus, Department } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { BulkCandidateImportModal } from '../modals/BulkCandidateImportModal';

interface RecruitmentModuleProps {
  jobs: JobOpening[];
  candidates: Candidate[];
  departments?: Department[];
  onRefresh: () => void;
  onImportCandidates?: (newCandidates: Candidate[]) => void;
}

export const RecruitmentModule: React.FC<RecruitmentModuleProps> = ({
  jobs,
  candidates,
  departments = [],
  onRefresh,
  onImportCandidates,
}) => {
  const { showToast } = useSocket();
  const [selectedJob, setSelectedJob] = useState<string>('ALL');

  // Modals state
  const [createJobModalOpen, setCreateJobModalOpen] = useState(false);
  const [addCandidateModalOpen, setAddCandidateModalOpen] = useState(false);
  const [importCandidatesModalOpen, setImportCandidatesModalOpen] = useState(false);
  const [interviewModalCand, setInterviewModalCand] = useState<Candidate | null>(null);

  // In-memory session candidates for frontend-only bulk import
  const [sessionImportedCandidates, setSessionImportedCandidates] = useState<Candidate[]>([]);

  // Combined candidates (existing backend candidates + session imported candidates)
  const allCandidates = React.useMemo(() => {
    const propIds = new Set(candidates.map((c) => c.id));
    const uniqueSession = sessionImportedCandidates.filter((c) => !propIds.has(c.id));
    return [...candidates, ...uniqueSession];
  }, [candidates, sessionImportedCandidates]);

  useEffect(() => {
    const isAnyOpen =
      createJobModalOpen || addCandidateModalOpen || importCandidatesModalOpen || !!interviewModalCand;
    if (!isAnyOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (createJobModalOpen) setCreateJobModalOpen(false);
        if (addCandidateModalOpen) setAddCandidateModalOpen(false);
        if (importCandidatesModalOpen) setImportCandidatesModalOpen(false);
        if (interviewModalCand) setInterviewModalCand(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [createJobModalOpen, addCandidateModalOpen, importCandidatesModalOpen, interviewModalCand]);


  // New Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDepartment, setJobDepartment] = useState('Engineering & Technology');
  const [jobLocation, setJobLocation] = useState('Surat, Gujarat (Hybrid)');
  const [jobOpeningsCount, setJobOpeningsCount] = useState(1);
  const [jobSalaryRange, setJobSalaryRange] = useState('â‚¹10,00,000 - â‚¹15,00,000');
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
  const [interviewerName, setInterviewerName] = useState('Technical Hiring Lead');
  const [interviewScheduledAt, setInterviewScheduledAt] = useState('2026-10-25 10:00 AM IST');
  const [interviewSubmitting, setInterviewSubmitting] = useState(false);

  // Convert to employee loading
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Active Stage Filter for candidate list
  const [selectedStage, setSelectedStage] = useState<CandidateStatus | 'ALL'>('ALL');
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');

  const stageCardsConfig: {
    stage: CandidateStatus | 'ALL';
    label: string;
    description: string;
    icon: any;
    color: string;
    bgLight: string;
    borderClass: string;
    textColor: string;
  }[] = [
    {
      stage: 'ALL',
      label: 'All Candidates',
      description: 'Total active applicants',
      icon: Users,
      color: '#2d6a4f',
      bgLight: 'bg-[#d8f3dc]',
      borderClass: 'border-[#95d5b2]',
      textColor: 'text-[#1b4332]',
    },
    {
      stage: 'Applied',
      label: 'Applied',
      description: 'New applications received',
      icon: FileText,
      color: '#0284c7',
      bgLight: 'bg-sky-50',
      borderClass: 'border-sky-200',
      textColor: 'text-sky-700',
    },
    {
      stage: 'Screening',
      label: 'Screening',
      description: 'Profile & resume review',
      icon: Search,
      color: '#d97706',
      bgLight: 'bg-amber-50',
      borderClass: 'border-amber-200',
      textColor: 'text-amber-700',
    },
    {
      stage: 'Interview',
      label: 'Interview',
      description: 'Rounds in progress',
      icon: Calendar,
      color: '#7c3aed',
      bgLight: 'bg-purple-50',
      borderClass: 'border-purple-200',
      textColor: 'text-purple-700',
    },
    {
      stage: 'Offer',
      label: 'Offer Sent',
      description: 'Formal employment offers',
      icon: Award,
      color: '#ea580c',
      bgLight: 'bg-orange-50',
      borderClass: 'border-orange-200',
      textColor: 'text-orange-700',
    },
    {
      stage: 'Hired',
      label: 'Hired & Onboarded',
      description: 'Staff roster converted',
      icon: CheckCircle2,
      color: '#16a34a',
      bgLight: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      textColor: 'text-emerald-700',
    },
  ];

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    setJobSubmitting(true);
    try {
      const matchedDept = departments.find(
        (d) => d.name === jobDepartment || d.id === jobDepartment
      );
      await api.createJob({
        title: jobTitle,
        departmentId: matchedDept?.id,
        departmentName: matchedDept?.name || jobDepartment,
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
    // If it's a session-imported candidate, update directly in session memory
    const isSessionCand = sessionImportedCandidates.some((c) => c.id === candidateId);
    if (isSessionCand) {
      setSessionImportedCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: newStage } : c))
      );
      showToast?.({
        title: 'Pipeline Updated',
        message: `Candidate moved to ${newStage} stage.`,
        type: 'info',
      });
      return;
    }

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
      await api.convertCandidateToEmployee(candidate.id, 'HR Administration');
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

  const handleImportSuccess = (
    newCandidates: Candidate[],
    summary: { importedCount: number; skippedCount: number; failedCount: number }
  ) => {
    setSessionImportedCandidates((prev) => [...prev, ...newCandidates]);
    onImportCandidates?.(newCandidates);
    showToast?.({
      title: 'Candidates Imported Successfully',
      message: `Imported ${summary.importedCount} candidates into Applied stage. ${summary.skippedCount} skipped, ${summary.failedCount} failed.`,
      type: 'success',
    });
  };

  const filteredCandidates = allCandidates.filter((c) => {
    if (selectedJob !== 'ALL' && c.jobId !== selectedJob) return false;
    return true;
  });

  // Filtered candidates for the bottom roster list
  const displayedCandidates = React.useMemo(() => {
    return filteredCandidates.filter((c) => {
      // 1. Stage filter
      if (selectedStage !== 'ALL' && c.status !== selectedStage) {
        return false;
      }
      // 2. Search query filter
      if (candidateSearchQuery.trim()) {
        const q = candidateSearchQuery.toLowerCase().trim();
        const matchName = (c.fullName || '').toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        const matchJob = (c.jobTitle || '').toLowerCase().includes(q);
        const matchCompany = (c.currentCompany || '').toLowerCase().includes(q);
        const matchSkills = (c.skills || []).some((s) => s.toLowerCase().includes(q));
        if (!matchName && !matchEmail && !matchPhone && !matchJob && !matchCompany && !matchSkills) {
          return false;
        }
      }
      return true;
    });
  }, [filteredCandidates, selectedStage, candidateSearchQuery]);

  return (
    <div className="space-y-5 w-full select-none animate-in fade-in">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
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
            id="btn-import-candidates-modal"
            type="button"
            onClick={() => setImportCandidatesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#d8f3dc] text-[#343a40] hover:text-[#1b4332] border border-[#dee2e6] hover:border-[#95d5b2] text-xs font-bold transition shadow-2xs cursor-pointer"
            title="Import multiple candidates from Excel (.xlsx) or CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2d6a4f]" />
            <span>Import Candidates</span>
          </button>

          <button
            id="btn-add-candidate-modal"
            type="button"
            onClick={() => setAddCandidateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f8f9fa] hover:bg-[#d8f3dc] text-[#343a40] hover:text-[#1b4332] border border-[#dee2e6] hover:border-[#95d5b2] text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#2d6a4f]" />
            <span>Add Candidate</span>
          </button>

          <button
            id="btn-create-job-modal"
            onClick={() => setCreateJobModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Job Opening</span>
          </button>
        </div>

      {/* Published Requisitions Cards */}
      {jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center text-slate-400 text-xs">
          No job openings posted yet. Click &quot;Post Job Opening&quot; to create a new hiring requisition.
        </div>
      ) : (
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
                {job.location} â€¢ {job.experienceLevel} â€¢ {job.openingsCount} Openings
              </p>
              <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                {job.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{job.applicantCount || 0} Applicants</span>
              <button
                onClick={() => setSelectedJob(job.id)}
                className="text-xs font-bold text-[#2d6a4f] hover:text-[#1b4332] hover:underline cursor-pointer"
              >
                View Pipeline &rarr;
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* =========================================================================
          TOP STAGE OVERVIEW CARDS (CLICK TO FILTER CANDIDATES BELOW)
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2d6a4f]" />
              <span>Candidate Pipeline Stages</span>
            </h2>
            <p className="text-xs text-slate-500">
              Click any stage card below to filter candidates in the roster.
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#1b4332] bg-[#d8f3dc] px-2.5 py-0.5 rounded-full border border-[#95d5b2]">
            Active Filter: {selectedStage === 'ALL' ? 'All Candidates' : selectedStage} (
            {
              selectedStage === 'ALL'
                ? filteredCandidates.length
                : filteredCandidates.filter((c) => c.status === selectedStage).length
            }
            )
          </span>
        </div>

        {/* 6 Stage Summary Cards (NO candidates inside; clicking filters list below) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stageCardsConfig.map((cfg) => {
            const isSelected = selectedStage === cfg.stage;
            const count =
              cfg.stage === 'ALL'
                ? filteredCandidates.length
                : filteredCandidates.filter((c) => c.status === cfg.stage).length;
            const totalCount = filteredCandidates.length;
            const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            const Icon = cfg.icon;

            return (
              <div
                key={cfg.stage}
                onClick={() => setSelectedStage(cfg.stage)}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group select-none ${
                  isSelected
                    ? 'border-[#1b4332] bg-[#d8f3dc]/40 ring-2 ring-[#2d6a4f]/25 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-[#95d5b2] hover:bg-[#d8f3dc]/15 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bgLight} ${cfg.borderClass} ${cfg.textColor}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected ? (
                    <span className="w-2 h-2 rounded-full bg-[#2d6a4f] ring-4 ring-[#2d6a4f]/20" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">
                      {percentage}%
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                    {cfg.label}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-xl sm:text-2xl font-semibold tracking-tight ${
                        isSelected ? 'text-[#081c15]' : 'text-slate-800'
                      }`}
                    >
                      {count}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">candidates</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-medium truncate">{cfg.description}</span>
                  {isSelected && (
                    <span className="text-[9px] font-bold text-[#1b4332] bg-white px-1.5 py-0.5 rounded border border-[#95d5b2] shrink-0">
                      Selected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          BOTTOM CANDIDATE LIST (DYNAMICALLY FILTERED BY CLICKED CARD)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        {/* Section Header: Title, Active Filter Badge & Search Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1b4332] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-5 h-5 text-[#95d5b2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {selectedStage === 'ALL'
                    ? 'All Pipeline Candidates'
                    : `${selectedStage} Candidates`}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#d8f3dc] text-[#1b4332] border border-[#95d5b2]">
                  {displayedCandidates.length}{' '}
                  {displayedCandidates.length === 1 ? 'Applicant' : 'Applicants'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedStage === 'ALL'
                  ? 'Complete list of all candidate records across all stages.'
                  : `Showing candidates currently in the ${selectedStage} stage. Click any stage card above to change.`}
              </p>
            </div>
          </div>

          {/* Search & Reset Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search candidate name, email, skills..."
                value={candidateSearchQuery}
                onChange={(e) => setCandidateSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 text-xs bg-[#f8f9fa] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2d6a4f] focus:outline-hidden"
              />
              {candidateSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCandidateSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Clear Stage Filter if not ALL */}
            {selectedStage !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedStage('ALL')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-[#f8f9fa] hover:bg-white text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>View All Stages</span>
              </button>
            )}
          </div>
        </div>

        {/* Candidate List Container */}
        {displayedCandidates.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl bg-slate-50 border border-slate-100">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-800">
              No candidates found in {selectedStage === 'ALL' ? 'pipeline' : `"${selectedStage}" stage`}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {candidateSearchQuery
                ? 'No candidates match your search query. Try clearing the search.'
                : selectedStage === 'ALL'
                  ? 'No candidates have been registered yet. Click "Add Candidate" or "Import Candidates" above to add applicants.'
                  : `There are currently no candidates at the ${selectedStage} stage. Click "All Candidates" above to view all records.`}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {selectedStage !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedStage('ALL')}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-white cursor-pointer"
                >
                  View All Candidates
                </button>
              )}
              {candidateSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCandidateSearchQuery('')}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-white cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedCandidates.map((cand) => (
              <div
                key={cand.id}
                className="p-4 sm:p-4.5 rounded-2xl border border-slate-200/90 hover:border-[#95d5b2] hover:bg-[#d8f3dc]/10 transition-all bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs"
              >
                {/* Left: Avatar, Name, Job Title, Contact, Skills */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#d8f3dc] border border-[#95d5b2] text-[#1b4332] flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                    {cand.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'CD'}
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 truncate">
                        {cand.fullName}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <Briefcase className="w-3 h-3 text-slate-500" />
                        <span>{cand.jobTitle}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {cand.experienceYears}y exp
                      </span>
                      {cand.source && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          {cand.source}
                        </span>
                      )}
                    </div>

                    {/* Contact & Company Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      {cand.email && (
                        <a
                          href={`mailto:${cand.email}`}
                          className="flex items-center gap-1 hover:text-[#1b4332] hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cand.email}</span>
                        </a>
                      )}
                      {cand.phone && (
                        <a
                          href={`tel:${cand.phone}`}
                          className="flex items-center gap-1 hover:text-[#1b4332] hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cand.phone}</span>
                        </a>
                      )}
                      {cand.currentCompany && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cand.currentCompany}</span>
                        </span>
                      )}
                      {cand.appliedDate && (
                        <span className="text-[11px] text-slate-400">
                          Applied: {cand.appliedDate}
                        </span>
                      )}
                    </div>

                    {/* Skills pills */}
                    {cand.skills && cand.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {cand.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-[#f8f9fa] text-slate-700 border border-slate-200/80 text-[10px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Stage Switcher & Context Action Buttons */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  {/* Stage Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">Stage:</span>
                    <select
                      value={cand.status}
                      onChange={(e) =>
                        handleStageChange(cand.id, e.target.value as CandidateStatus)
                      }
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer focus:outline-hidden ${
                        cand.status === 'Applied'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : cand.status === 'Screening'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : cand.status === 'Interview'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : cand.status === 'Offer'
                                ? 'bg-orange-50 text-orange-800 border-orange-200'
                                : cand.status === 'Hired'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Screening">Screening</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Hired">Hired</option>
                    </select>
                  </div>

                  {/* Stage Context Actions */}
                  {cand.status === 'Interview' && (
                    <button
                      id={`btn-schedule-interview-${cand.id}`}
                      type="button"
                      onClick={() => setInterviewModalCand(cand)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule Interview</span>
                    </button>
                  )}

                  {(cand.status === 'Offer' || cand.status === 'Hired') && (
                    <button
                      id={`btn-hire-${cand.id}`}
                      type="button"
                      disabled={convertingId === cand.id}
                      onClick={() => handleHireToEmployee(cand)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {convertingId === cand.id ? 'Converting...' : 'Convert to Staff'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE JOB MODAL */}
      {createJobModalOpen && (
        <div
          id="create-job-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateJobModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  >
                    {departments.length > 0 ? (
                      departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Engineering & Technology">Engineering & Technology</option>
                        <option value="Product & UX Design">Product & UX Design</option>
                        <option value="Administration & Management">Administration</option>
                      </>
                    )}
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
                  className="px-4 py-2 text-xs font-bold text-white bg-[#2d6a4f] hover:bg-[#1b4332] rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
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
                  className="px-4 py-2 text-xs font-bold text-white bg-[#2d6a4f] hover:bg-[#1b4332] rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
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
                  className="px-4 py-2 text-xs font-bold text-white bg-[#2d6a4f] hover:bg-[#1b4332] rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {interviewSubmitting ? 'Booking...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Candidate Import Modal (Frontend SheetJS Excel/CSV) */}
      <BulkCandidateImportModal
        isOpen={importCandidatesModalOpen}
        onClose={() => setImportCandidatesModalOpen(false)}
        existingCandidates={allCandidates}
        availableJobs={jobs}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};
