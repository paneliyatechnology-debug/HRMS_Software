'use client';

import React, { useMemo, useState } from 'react';
import { ClipboardList, Calendar, User, Pencil, X } from 'lucide-react';

export interface EmployeeTask {
  id: string;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  assignedByName: string;
}

// Temporary UI preview. Replace with the tasks API when it is available.
const STATIC_TASKS: EmployeeTask[] = [
  {
    id: 'task-1',
    title: 'Submit this week attendance correction',
    description: 'Review yesterday’s punch and send the correction note to HR.',
    status: 'Pending',
    priority: 'High',
    dueDate: '21 Nov 2026',
    assignedByName: 'HR Admin',
  },
  {
    id: 'task-2',
    title: 'Update emergency contact details',
    description: 'Open your profile and confirm the emergency phone number.',
    status: 'In Progress',
    priority: 'Medium',
    dueDate: '22 Nov 2026',
    assignedByName: 'HR Admin',
  },
  {
    id: 'task-3',
    title: 'Read the holiday notice',
    description: 'Check the notice board for the upcoming holiday list.',
    status: 'Pending',
    priority: 'Low',
    dueDate: '24 Nov 2026',
    assignedByName: 'HR Admin',
  },
  {
    id: 'task-4',
    title: 'Upload ID proof in documents',
    description: 'Add a clear copy of your ID in the documents section.',
    status: 'Completed',
    priority: 'Medium',
    dueDate: '18 Nov 2026',
    assignedByName: 'HR Admin',
  },
];

const FILTERS = ['All', 'Pending', 'In Progress', 'Completed'] as const;

function statusClass(status: EmployeeTask['status']) {
  if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'In Progress') return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function priorityClass(priority: EmployeeTask['priority']) {
  if (priority === 'High') return 'text-rose-700 bg-rose-50 border-rose-200';
  if (priority === 'Medium') return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-slate-600 bg-slate-50 border-slate-200';
}

export const TasksModule: React.FC = () => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [tasks, setTasks] = useState<EmployeeTask[]>(STATIC_TASKS);
  const [editing, setEditing] = useState<EmployeeTask | null>(null);
  const [savedNote, setSavedNote] = useState('');

  const saveTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || !editing.title.trim()) return;
    setTasks((current) => current.map((task) => (task.id === editing.id ? { ...editing, title: editing.title.trim() } : task)));
    setSavedNote(`Updated “${editing.title.trim()}”.`);
    setEditing(null);
  };

  const visible = useMemo(
    () => (filter === 'All' ? tasks : tasks.filter((task) => task.status === filter)),
    [filter, tasks]
  );
  const openCount = tasks.filter((task) => task.status !== 'Completed').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase">Open</span>
          <p className="text-xl font-semibold text-slate-800 mt-1">{openCount}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase">In Progress</span>
          <p className="text-xl font-semibold text-sky-700 mt-1">
            {tasks.filter((task) => task.status === 'In Progress').length}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase">Completed</span>
          <p className="text-xl font-semibold text-emerald-700 mt-1">
            {tasks.filter((task) => task.status === 'Completed').length}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">My Tasks</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Static preview
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Sample tasks shown until the tasks API is connected</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                  filter === item
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <ClipboardList className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No {filter.toLowerCase()} tasks</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((task) => (
              <div key={task.id} className="px-4 py-3.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900">{task.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {task.assignedByName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due {task.dueDate}
                    </span>
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass(task.status)}`}>
                    {task.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSavedNote('');
                      setEditing(task);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {savedNote ? (
        <p className="text-xs font-semibold text-emerald-700">{savedNote}</p>
      ) : null}

      {editing ? (
        <form onSubmit={saveTask} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Update task</h4>
            <button type="button" onClick={() => setEditing(null)} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            Title
            <input
              value={editing.title}
              onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Details
            <textarea
              value={editing.description || ''}
              onChange={(event) => setEditing({ ...editing, description: event.target.value })}
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900"
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block text-xs font-semibold text-slate-600">
              Status
              <select
                value={editing.status}
                onChange={(event) => setEditing({ ...editing, status: event.target.value as EmployeeTask['status'] })}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900"
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Priority
              <select
                value={editing.priority}
                onChange={(event) => setEditing({ ...editing, priority: event.target.value as EmployeeTask['priority'] })}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Due date
              <input
                value={editing.dueDate}
                onChange={(event) => setEditing({ ...editing, dueDate: event.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900"
              />
            </label>
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer">
            Save update
          </button>
        </form>
      ) : null}
    </div>
  );
};
