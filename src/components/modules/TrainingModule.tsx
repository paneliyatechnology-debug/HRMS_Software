'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Award,
  Clock,
  Users,
  CheckCircle,
  BookOpen,
  Plus,
  X,
  TrendingUp,
  UserCheck,
  Search,
  Sliders,
} from 'lucide-react';
import { TrainingProgram, EmployeeTraining, Employee } from '../../types/hrms';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

interface TrainingModuleProps {
  programs?: TrainingProgram[];
  onRefresh?: () => void;
}

export const TrainingModule: React.FC<TrainingModuleProps> = ({ programs: initialPrograms, onRefresh }) => {
  const { user } = useAuth();
  const { showToast } = useSocket();

  const [programs, setPrograms] = useState<TrainingProgram[]>(initialPrograms || []);
  const [enrollments, setEnrollments] = useState<EmployeeTraining[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'programs' | 'enrollments'>('programs');

  // Modal: Add Training Program
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTrainer, setNewTrainer] = useState('');
  const [newSkills, setNewSkills] = useState('');
  const [newStartDate, setNewStartDate] = useState('2026-11-10');
  const [newEndDate, setNewEndDate] = useState('2026-11-20');
  const [newDuration, setNewDuration] = useState(16);

  // Modal: Enroll in Course
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Modal: Update Progress
  const [progressModalEnrollment, setProgressModalEnrollment] = useState<EmployeeTraining | null>(null);
  const [progressVal, setProgressVal] = useState(50);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progs, enrolls, emps] = await Promise.all([
        api.getTrainingPrograms(),
        api.getTrainingEnrollments(),
        api.getEmployees(),
      ]);
      setPrograms(progs);
      setEnrollments(enrolls);
      setEmployees(emps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTrainer.trim()) {
      showToast({ type: 'warning', title: 'Missing details', message: 'Title and trainer name are required.' });
      return;
    }
    try {
      const created = await api.createTrainingProgram({
        title: newTitle.trim(),
        description: newDescription.trim() || 'Professional corporate training course.',
        trainerName: newTrainer.trim(),
        skillsCovered: newSkills.split(',').map((s) => s.trim()).filter(Boolean),
        startDate: newStartDate,
        endDate: newEndDate,
        durationHours: Number(newDuration) || 12,
      });

      setPrograms((prev) => [created, ...prev]);
      showToast({
        type: 'success',
        title: 'Training Program Created',
        message: `Course "${created.title}" is now published.`,
      });
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewTrainer('');
      setNewSkills('');
      onRefresh?.();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message || 'Failed to create training program.' });
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) {
      showToast({ type: 'warning', title: 'Select course', message: 'Please select a training program.' });
      return;
    }
    const empId = selectedEmployeeId || user.employeeId || 'emp-1';
    try {
      const newEnrollment = await api.enrollTraining({
        trainingId: selectedProgramId,
        employeeId: empId,
      });

      setEnrollments((prev) => [newEnrollment, ...prev]);
      // Update local program count
      setPrograms((prev) =>
        prev.map((p) => (p.id === selectedProgramId ? { ...p, enrolledCount: (p.enrolledCount || 0) + 1 } : p))
      );

      showToast({
        type: 'success',
        title: 'Enrolled Successfully',
        message: 'Employee is enrolled in the training course.',
      });
      setIsEnrollOpen(false);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Enrollment Failed', message: err.message || 'Could not enroll.' });
    }
  };

  const handleUpdateProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressModalEnrollment) return;
    try {
      const updated = await api.updateTrainingProgress(progressModalEnrollment.id, progressVal);
      setEnrollments((prev) => prev.map((en) => (en.id === updated.id ? updated : en)));
      showToast({
        type: 'success',
        title: 'Progress Updated',
        message: progressVal >= 100 ? 'Course completed! Certificate issued.' : `Progress updated to ${progressVal}%.`,
      });
      setProgressModalEnrollment(null);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message || 'Could not update progress.' });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Learning & Professional Upskilling
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold">
              {programs.length} Curricula
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Skill development courses, compliance certifications, enrolled cohorts, and progress milestones
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (programs.length > 0) setSelectedProgramId(programs[0].id);
              if (employees.length > 0) setSelectedEmployeeId(employees[0].id);
              setIsEnrollOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Enroll Employee</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Training Course</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('programs')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'programs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 bg-white border border-slate-100 hover:bg-slate-50'
          }`}
        >
          All Programs ({programs.length})
        </button>
        <button
          onClick={() => setActiveTab('enrollments')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'enrollments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 bg-white border border-slate-100 hover:bg-slate-50'
          }`}
        >
          Active Enrollments ({enrollments.length})
        </button>
      </div>

      {/* Tab 1: Programs Grid */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {programs.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-200">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">No training courses found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No active training curricula registered yet. Click &ldquo;Add Training Course&rdquo; to create a new program.
              </p>
            </div>
          ) : (
            programs.map((prog) => (
              <div
                key={prog.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      {prog.status || 'Active'}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {prog.durationHours} Hours
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 mt-3">
                    {prog.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {prog.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(prog.skillsCovered || []).map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Instructor</span>
                    <span className="font-semibold text-slate-800">{prog.trainerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {prog.enrolledCount || 0}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProgramId(prog.id);
                        setIsEnrollOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-bold transition"
                    >
                      Enroll
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Enrollments List */}
      {activeTab === 'enrollments' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Registered Employee Cohorts</h3>
            <span className="text-xs text-slate-400">{enrollments.length} Active Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      No employee enrollments found. Click &ldquo;Enroll Employee&rdquo; to register staff members into courses.
                    </td>
                  </tr>
                ) : (
                  enrollments.map((en) => (
                    <tr key={en.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {en.employeeName}
                        <span className="block text-[10px] text-slate-400 font-normal font-mono">{en.employeeId}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{en.trainingTitle}</td>
                      <td className="py-3.5 px-4">
                        <div className="w-40 space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span>{en.progressPercent}%</span>
                            <span className={en.progressPercent >= 100 ? 'text-emerald-600' : 'text-blue-600'}>
                              {en.progressPercent >= 100 ? 'Certified' : 'In Flight'}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                en.progressPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${Math.min(100, en.progressPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            en.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {en.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setProgressModalEnrollment(en);
                            setProgressVal(en.progressPercent);
                          }}
                          className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                        >
                          Update Progress
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Training Program */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Publish Training Curriculum
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Advanced System Design with NestJS"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Overview of curriculum, learning objectives..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Trainer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Alex Morgan"
                    value={newTrainer}
                    onChange={(e) => setNewTrainer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Skills Covered (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., NestJS, TypeScript, Clean Architecture"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enroll in Training */}
      {isEnrollOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Enroll in Training
              </h3>
              <button
                onClick={() => setIsEnrollOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnroll} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Course</label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.durationHours} hrs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Employee</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEnrollOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Progress */}
      {progressModalEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Update Completion Progress
              </h3>
              <button
                onClick={() => setProgressModalEnrollment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProgressSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <p className="font-bold text-slate-900">{progressModalEnrollment.employeeName}</p>
                <p className="text-[11px] text-slate-400">{progressModalEnrollment.trainingTitle}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-bold text-xs">
                  <span>Current Progress:</span>
                  <span className="text-blue-600 text-sm">{progressVal}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progressVal}
                  onChange={(e) => setProgressVal(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>0% Started</span>
                  <span>50% Mid-way</span>
                  <span>100% Certified</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProgressModalEnrollment(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
