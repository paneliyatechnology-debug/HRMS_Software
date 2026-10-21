'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Calendar,
  Trash2,
  X,
  Send,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  Megaphone,
} from 'lucide-react';
import { Announcement, Employee } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';

interface AnnouncementsModuleProps {
  employees?: Employee[];
  portalMode?: 'employee' | 'admin';
}

export const AnnouncementsModule: React.FC<AnnouncementsModuleProps> = ({
  employees = [],
  portalMode = 'admin',
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAudience, setFilterAudience] = useState<'All' | 'Company' | 'Personal'>('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [audienceType, setAudienceType] = useState<'All' | 'Individual'>('All');
  const [targetEmployeeId, setTargetEmployeeId] = useState(employees[0]?.id || 'emp-2');
  const [submitting, setSubmitting] = useState(false);

  const loadAnnouncements = async () => {
    try {
      const data = await api.getAnnouncements(
        portalMode === 'employee' ? user.employeeId || 'emp-2' : undefined
      );
      if (data) {
        setAnnouncements(data);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    const handleUpdate = () => loadAnnouncements();
    window.addEventListener('hrms_announcements_updated', handleUpdate);
    return () => window.removeEventListener('hrms_announcements_updated', handleUpdate);
  }, [portalMode, user.employeeId]);

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast({
        type: 'warning',
        title: 'Missing Details',
        message: 'Please provide both title and content for the notice.',
      });
      return;
    }

    setSubmitting(true);
    try {
      let selectedEmpName: string | undefined = undefined;
      let selectedDept: string | undefined = undefined;

      if (audienceType === 'Individual') {
        const found = employees.find((emp) => emp.id === targetEmployeeId);
        if (found) {
          selectedEmpName = `${found.firstName} ${found.lastName}`;
          selectedDept = found.departmentName;
        }
      }

      await api.createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        priority,
        targetAudience: audienceType,
        targetEmployeeId: audienceType === 'Individual' ? targetEmployeeId : undefined,
        targetEmployeeName: selectedEmpName,
        departmentName: selectedDept,
        authorName: `${user.firstName || 'Keyur'} ${user.lastName || 'Sangani'} (HR & Admin)`,
        authorRole: 'Administration',
      });

      showToast({
        type: 'success',
        title: 'Notice Published',
        message:
          audienceType === 'Individual'
            ? `Notice sent directly to ${selectedEmpName || 'employee'}.`
            : 'Company-wide notice broadcast successfully.',
      });

      setModalOpen(false);
      setTitle('');
      setContent('');
      setPriority('Medium');
      setAudienceType('All');
      loadAnnouncements();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Publish Error',
        message: err.message || 'Could not publish notice.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string, noticeTitle: string) => {
    const confirmed = confirm(`Are you sure you want to remove the notice "${noticeTitle}"?`);
    if (!confirmed) return;

    try {
      await api.deleteAnnouncement(id);
      showToast({
        type: 'success',
        title: 'Notice Deleted',
        message: 'The notice has been removed from the board.',
      });
      loadAnnouncements();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete notice.',
      });
    }
  };

  const filteredNotices = announcements.filter((a) => {
    if (filterAudience === 'Company') return a.targetAudience === 'All';
    if (filterAudience === 'Personal') return a.targetAudience === 'Individual';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-600" />
            <span>Notice Board & Circulars</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official staff broadcasts, policy notifications, and personal employee circulars
          </p>
        </div>

        {portalMode === 'admin' && (
          <button
            id="btn-new-notice-modal"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Send New Notice</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setFilterAudience('All')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterAudience === 'All'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Notices ({announcements.length})
          </button>
          <button
            onClick={() => setFilterAudience('Company')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterAudience === 'Company'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Company-Wide ({announcements.filter((a) => a.targetAudience === 'All').length})
          </button>
          <button
            onClick={() => setFilterAudience('Personal')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterAudience === 'Personal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Personal Circulars ({announcements.filter((a) => a.targetAudience === 'Individual').length})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredNotices.length} active bulletin{filteredNotices.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {filteredNotices.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No notices published matching this filter.
          </div>
        ) : (
          filteredNotices.map((anc) => {
            const isPersonalToMe =
              anc.targetAudience === 'Individual' &&
              (anc.targetEmployeeId === user.employeeId ||
                anc.targetEmployeeName?.toLowerCase().includes((user.firstName || '').toLowerCase()));

            return (
              <div
                key={anc.id}
                className={`p-5 rounded-2xl bg-white border shadow-xs space-y-3 transition-colors ${
                  isPersonalToMe
                    ? 'border-indigo-300 ring-2 ring-indigo-50 bg-indigo-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        anc.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                          : anc.priority === 'High'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : anc.priority === 'Medium'
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {anc.priority} Priority
                    </span>

                    {anc.targetAudience === 'Individual' ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>
                          {isPersonalToMe
                            ? 'Personal Notice to You'
                            : `Individual: ${anc.targetEmployeeName || 'Staff Member'}`}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Company Broadcast (All Staff)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Published {anc.publishDate}
                    </span>

                    {portalMode === 'admin' && (
                      <button
                        id={`btn-delete-notice-${anc.id}`}
                        onClick={() => handleDeleteNotice(anc.id, anc.title)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {anc.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {anc.content}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Author: <strong className="text-slate-700">{anc.authorName}</strong>
                  </span>
                  <span className="font-semibold text-slate-500">
                    Audience: {anc.targetAudience}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modern In-App Send Notice / Broadcast Modal */}
      {modalOpen && (
        <div
          id="publish-notice-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Publish New Notice</h3>
                  <p className="text-[11px] text-slate-500">Broadcast or send targeted circular</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishNotice} className="space-y-3 text-xs">
              {/* Audience selection */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Target Recipient
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAudienceType('All')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-colors ${
                      audienceType === 'All'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Broadcast to All Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudienceType('Individual')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-colors ${
                      audienceType === 'Individual'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Specific Employee
                  </button>
                </div>
              </div>

              {/* If Individual: select employee */}
              {audienceType === 'Individual' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Select Employee
                  </label>
                  <select
                    id="select-notice-employee"
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode} &bull; {emp.departmentName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Notice Title / Subject
                </label>
                <input
                  id="input-bulletin-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mandatory System Maintenance / Performance Review Update..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Urgency / Priority
                </label>
                <select
                  id="select-bulletin-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Notice</option>
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Notice Content / Instructions
                </label>
                <textarea
                  id="textarea-bulletin-content"
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the full notice announcement text here..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  id="btn-publish-bulletin"
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Publishing...' : 'Publish Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
