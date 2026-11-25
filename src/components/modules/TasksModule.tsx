'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Edit2,
  Eye,
  Loader2,
  ChevronDown,
  Layers,
  Sparkles,
  X,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { canManageTasks } from '../../lib/rolePermissions';
import { Employee, Department } from '../../types/hrms';

interface TasksModuleProps {
  employees?: Employee[];
  departments?: Department[];
  portalMode?: 'employee' | 'admin';
  onRefresh?: () => void;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  teamId?: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
  };
  team?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  LOW: { label: 'Low', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  MEDIUM: { label: 'Medium', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  HIGH: { label: 'High', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  URGENT: { label: 'Urgent', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  TODO: { label: 'To Do', bg: 'bg-slate-100', text: 'text-slate-700' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-sky-100', text: 'text-sky-800' },
  IN_REVIEW: { label: 'In Review', bg: 'bg-amber-100', text: 'text-amber-800' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-800' },
};

export const TasksModule: React.FC<TasksModuleProps> = ({
  employees = [],
  departments = [],
  portalMode = 'admin',
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Teams list for selection
  const [teams, setTeams] = useState<any[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState<TaskItem | null>(null);
  const [viewTaskData, setViewTaskData] = useState<TaskItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Create/Edit form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [formStatus, setFormStatus] = useState('TODO');
  const [formAssigneeId, setFormAssigneeId] = useState('');
  const [formTeamId, setFormTeamId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listTasks();
      const list = Array.isArray(res) ? res : res?.data || [];
      setTasks(list);
    } catch (err: any) {
      console.warn('Could not fetch tasks:', err);
      setError(err.message || 'Failed to connect to tasks backend service.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.listTeams();
        const list = Array.isArray(res) ? res : res?.data || [];
        setTeams(list);
      } catch (err) {
        console.warn('Could not fetch teams for task form:', err);
      }
    };
    fetchTeams();
    fetchTasks();
  }, [fetchTasks]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormTitle('');
    setFormDescription('');
    setFormPriority('MEDIUM');
    setFormStatus('TODO');
    setFormAssigneeId('');
    setFormTeamId(teams[0]?.id || '');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (task: TaskItem) => {
    setEditTaskData(task);
    setFormTitle(task.title || '');
    setFormDescription(task.description || '');
    setFormPriority(task.priority || 'MEDIUM');
    setFormStatus(task.status || 'TODO');
    setFormAssigneeId(task.assigneeId || (task.assignee as any)?.id || '');
    setFormTeamId(task.teamId || (task.team as any)?.id || '');
    setFormStartDate(task.startDate ? task.startDate.split('T')[0] : '');
    setFormEndDate(task.endDate ? task.endDate.split('T')[0] : (task.dueDate ? task.dueDate.split('T')[0] : ''));
  };

  // Open View Modal (calls GET /tasks/:id)
  const handleOpenViewModal = async (task: TaskItem) => {
    setViewTaskData(task);
    setLoadingDetail(true);
    try {
      const detailed = await api.getTask(task.id);
      if (detailed) setViewTaskData(detailed);
    } catch (err) {
      console.warn('Could not load detailed task from backend:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Team Leader presence check for task submission (Prevents 400 Bad Request)
  const selectedFormTeam = teams.find((t) => String(t.id) === String(formTeamId));
  const assigneeOptions = (Array.isArray(selectedFormTeam?.members) ? selectedFormTeam.members : []).filter(
    (member: any) => String(member.status || 'Active') === 'Active',
  );
  const teamHasLeader = selectedFormTeam
    ? Boolean(
        selectedFormTeam.leader ||
        selectedFormTeam.leaderId ||
        selectedFormTeam.leaderUserId ||
        selectedFormTeam.teamLeaderId ||
        selectedFormTeam.leadId ||
        (Array.isArray(selectedFormTeam.members) && selectedFormTeam.members.some((m: any) => m.isLeader || m.role === 'LEADER' || m.role === 'MANAGER'))
      )
    : true;

  useEffect(() => {
    if (!assigneeOptions.length) return;
    if (!assigneeOptions.some((member: any) => member.id === formAssigneeId)) {
      setFormAssigneeId(assigneeOptions[0].id);
    }
  }, [formTeamId, formAssigneeId, assigneeOptions]);

  const assigneeReady = () => {
    if (!formTeamId || !formAssigneeId || !assigneeOptions.some((member: any) => member.id === formAssigneeId)) {
      showToast?.({
        type: 'warning',
        title: 'Team member required',
        message: 'Choose a person who is already on this team.',
      });
      return false;
    }
    return true;
  };

  // Submit Create Task (calls POST /tasks)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    if (!assigneeReady()) return;

    if (selectedFormTeam && !teamHasLeader) {
      showToast?.({
        type: 'warning',
        title: 'Team Leader Required',
        message: 'આ ટીમમાં àª¹àªœà« Team Leader સેટ નથી. કૃપા કરીને પહેલા Organization > Teams માં જઈને લીડર અસાઇન કરો.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.createTask({
        title: formTitle.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        status: formStatus,
        assigneeId: formAssigneeId || undefined,
        teamId: formTeamId || undefined,
        startDate: formStartDate || undefined,
        dueDate: formEndDate || undefined,
        endDate: formEndDate || undefined,
      });
      showToast?.({
        type: 'success',
        title: 'Task Created',
        message: `"${formTitle}" has been scheduled.`,
      });
      setCreateModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'Task Creation Failed',
        message: err.message || 'Could not save task.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Task (calls PATCH /tasks/:id)
  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTaskData || !formTitle.trim()) return;
    if (!assigneeReady()) return;

    if (selectedFormTeam && !teamHasLeader) {
      showToast?.({
        type: 'warning',
        title: 'Team Leader Required',
        message: 'આ ટીમમાં àª¹àªœà« Team Leader સેટ નથી. કૃપા કરીને પહેલા Organization > Teams માં જઈને લીડર અસાઇન કરો.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.editTask(editTaskData.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        status: formStatus,
        assigneeId: formAssigneeId || undefined,
        teamId: formTeamId || undefined,
        startDate: formStartDate || undefined,
        dueDate: formEndDate || undefined,
        endDate: formEndDate || undefined,
      });
      showToast?.({
        type: 'success',
        title: 'Task Updated',
        message: 'Changes saved successfully.',
      });
      setEditTaskData(null);
      fetchTasks();
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update task.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Task (calls DELETE /tasks/:id)
  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    setSubmitting(true);
    try {
      await api.deleteTask(deletingTaskId);
      showToast?.({
        type: 'success',
        title: 'Task Deleted',
        message: 'Task removed from workspace.',
      });
      setDeletingTaskId(null);
      fetchTasks();
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete task.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Inline Quick Status Change
  const handleQuickStatusChange = async (task: TaskItem, newStatus: string) => {
    try {
      await api.editTask(task.id, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
      showToast?.({
        type: 'success',
        title: 'Status Updated',
        message: `Task moved to ${newStatus}.`,
      });
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'Status Update Failed',
        message: err.message || 'Could not update status.',
      });
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !searchQuery ||
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'TODO').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      inReview: tasks.filter((t) => t.status === 'IN_REVIEW').length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    };
  }, [tasks]);

  return (
    <div className="space-y-5 w-full select-none">
      {/* ── Top Header Controls ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
            <span>Tasks &amp; Project Deliverables</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize team workload, assign project tasks, and track real-time delivery status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTasks}
            disabled={loading}
            className="p-2 rounded-xl bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs hover:bg-slate-50 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Refresh tasks from server"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canManageTasks(user) && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition active:scale-95 hover:opacity-90 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #2d6a4f, #1b4332)' }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Tasks</span>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{stats.total}</div>
          <span className="text-[10px] text-slate-500 font-normal">All logged work items</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">In Progress</span>
          <div className="text-2xl font-semibold text-sky-700 mt-1">{stats.inProgress}</div>
          <span className="text-[10px] text-slate-500 font-normal">Currently active sprints</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Pending Review</span>
          <div className="text-2xl font-semibold text-amber-700 mt-1">{stats.inReview + stats.todo}</div>
          <span className="text-[10px] text-slate-500 font-normal">To-do &amp; Review queue</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Completed</span>
          <div className="text-2xl font-semibold text-emerald-700 mt-1">{stats.completed}</div>
          <span className="text-[10px] text-slate-500 font-normal">Verified deliverables</span>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ───────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search task title or description..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchTasks}
            className="px-3 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[11px] transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Tasks Table / Cards ───────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Loading tasks from backend database...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 sm:p-16 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
            <CheckSquare className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            {tasks.length === 0 ? 'No Tasks Created Yet' : 'No tasks found'}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'Try adjusting your search query or filters to find what you are looking for.'
              : 'Create the first task deliverable for your team using the button below.'}
          </p>
          {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            </div>
          ) : canManageTasks(user) ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Task</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Task Deliverable</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const pBadge = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.MEDIUM;
                  const sBadge = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;

                  const matchedEmp = employees.find((e) => e.id === task.assigneeId);
                  const assigneeName =
                    task.assignee?.fullName ||
                    (task.assignee?.firstName ? `${task.assignee.firstName} ${task.assignee.lastName || ''}`.trim() : null) ||
                    (matchedEmp ? `${matchedEmp.firstName} ${matchedEmp.lastName}`.trim() : null) ||
                    'Unassigned';

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="font-bold text-slate-900 line-clamp-1">{task.title}</div>
                        {task.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        )}
                        {task.team?.name && (
                          <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                            Team: {task.team.name}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-full border border-slate-200 cursor-pointer ${sBadge.bg} ${sBadge.text} focus:outline-hidden`}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${pBadge.bg} ${pBadge.text} ${pBadge.border}`}>
                          {pBadge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-black shrink-0">
                            {assigneeName[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className="truncate max-w-[120px]">{assigneeName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {(task.startDate || task.endDate || task.dueDate) ? (
                          <div className="flex flex-col gap-0.5 text-[11px]">
                            {task.startDate && (
                              <div className="flex items-center gap-1 text-slate-600">
                                <span className="text-[10px] text-slate-400 font-bold">Start:</span>
                                <span>{new Date(task.startDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {(task.endDate || task.dueDate) && (
                              <div className="flex items-center gap-1 text-slate-500">
                                <span className="text-[10px] text-slate-400 font-bold">End:</span>
                                <span>{new Date(task.endDate || task.dueDate!).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No timeline</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {canManageTasks(user) && (
                            <button
                              type="button"
                              onClick={() => setDeletingTaskId(task.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          CREATE / EDIT TASK MODAL
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {(createModalOpen || Boolean(editTaskData)) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            setCreateModalOpen(false);
            setEditTaskData(null);
          }}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editTaskData ? 'Edit Task' : 'Create New Task'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editTaskData ? 'Update deliverable parameters and assignment' : 'Log a new actionable work deliverable'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditTaskData(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={editTaskData ? handleEditTask : handleCreateTask}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Task Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Implement employee payroll calculation module"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Description &amp; Deliverables
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Provide acceptance criteria and task context..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Priority Level
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Initial Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Assignee
                    </label>
                    <select
                      value={formAssigneeId}
                      onChange={(e) => setFormAssigneeId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="">Select a team member</option>
                      {assigneeOptions.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Associated Team
                    </label>
                    <select
                      value={formTeamId}
                      onChange={(e) => setFormTeamId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="">No Team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Team Leader Validation Notice (Prevents 400 Bad Request) */}
                {selectedFormTeam && !teamHasLeader && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-amber-900">આ ટીમમાં àª¹àªœà« Team Leader સેટ નથી</p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        âš ï¸ કૃપા કરીને પહેલા <span className="font-semibold underline">Organization &gt; Teams</span> માં જઈને લીડર અસાઇન કરો, àª…àª¨à«àª¯àª¥àª¾ àªŸàª¾àª¸à«àª• સબમિટ કરવા પર 400 Bad Request આવશે.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Starting Date
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition text-slate-700 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Ending Date
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      min={formStartDate || undefined}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:bg-white transition text-slate-700 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setEditTaskData(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || Boolean(selectedFormTeam && !teamHasLeader)}
                  title={selectedFormTeam && !teamHasLeader ? 'આ ટીમમાં Team Leader સેટ નથી' : undefined}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 hover:opacity-90 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #2d6a4f, #1b4332)' }}
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editTaskData ? 'Save Changes' : 'Create Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          VIEW TASK DETAILS MODAL (calls GET /tasks/:id)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {Boolean(viewTaskData) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewTaskData(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Task Information</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewTaskData(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              {loadingDetail ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
                  <p className="text-slate-500 font-medium">Fetching real-time task data...</p>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Title</span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">{viewTaskData?.title}</h4>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</span>
                    <p className="text-slate-600 leading-relaxed mt-0.5 whitespace-pre-wrap">
                      {viewTaskData?.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                      <p className="font-bold text-slate-800 mt-0.5">{viewTaskData?.status}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority</span>
                      <p className="font-bold text-slate-800 mt-0.5">{viewTaskData?.priority}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Starting Date</span>
                      <p className="font-medium text-slate-700 mt-0.5">
                        {viewTaskData?.startDate ? new Date(viewTaskData.startDate).toLocaleDateString() : 'Not Set'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ending Date</span>
                      <p className="font-medium text-slate-700 mt-0.5">
                        {(viewTaskData?.endDate || viewTaskData?.dueDate) ? new Date(viewTaskData.endDate || viewTaskData.dueDate!).toLocaleDateString() : 'Not Set'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setViewTaskData(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          DELETE CONFIRMATION MODAL (calls DELETE /tasks/:id)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {Boolean(deletingTaskId) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDeletingTaskId(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-y-auto my-auto p-6 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Task</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingTaskId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteTask}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
