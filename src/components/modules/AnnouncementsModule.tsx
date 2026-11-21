'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Users,
  UserCheck,
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    if (!modalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalOpen]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [audienceType, setAudienceType] = useState<'All' | 'Department' | 'Management'>('All');
  const [targetEmployeeId, setTargetEmployeeId] = useState(employees[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);

  const loadAnnouncements = async () => {
    try {
      const data = await api.getAnnouncements(
        portalMode === 'employee' ? user.employeeId || user.id || '' : undefined
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

      if (audienceType === 'Management') {
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
        targetAudience: audienceType === 'Management' ? 'Individual' : audienceType,
        targetEmployeeId: audienceType === 'Management' ? targetEmployeeId : undefined,
        targetEmployeeName: selectedEmpName,
        departmentName: selectedDept,
        authorName: `${user.firstName || 'HR'} ${user.lastName || 'Admin'} (HR & Admin)`,
        authorRole: 'Administration',
      });

      showToast({
        type: 'success',
        title: 'Notice Published',
        message:
          audienceType === 'Management'
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
    if (filterAudience === 'Personal') return a.targetAudience === 'Management';
    return true;
  });

  return (
    <div className="space-y-5 w-full select-none">
      {/* Top Action (Admin) */}
      {portalMode === 'admin' && (
        <div className="flex justify-end pb-3 border-b border-slate-200">
          <button
            id="btn-new-notice-modal"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Send New Notice</span>
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#f8f9fa] border border-[#dee2e6] text-xs font-semibold">
          <button
            onClick={() => setFilterAudience('All')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filterAudience === 'All'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-[#495057] hover:bg-[#d8f3dc] hover:text-[#1b4332]'
              }`}
          >
            All Notices ({announcements.length})
          </button>
          <button
            onClick={() => setFilterAudience('Company')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filterAudience === 'Company'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-[#495057] hover:bg-[#d8f3dc] hover:text-[#1b4332]'
              }`}
          >
            Company-Wide ({announcements.filter((a) => a.targetAudience === 'All').length})
          </button>
          <button
            onClick={() => setFilterAudience('Personal')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filterAudience === 'Personal'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-[#495057] hover:bg-[#d8f3dc] hover:text-[#1b4332]'
              }`}
          >
            Personal Circulars ({announcements.filter((a) => a.targetAudience === 'Management').length})
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
              anc.targetAudience === 'Management' &&
              (anc.targetEmployeeId === user.employeeId ||
                anc.targetEmployeeName?.toLowerCase().includes((user.firstName || '').toLowerCase()));

            return (
              <div
                key={anc.id}
                className={`p-5 rounded-2xl bg-white border shadow-xs space-y-3 transition-colors ${isPersonalToMe
                    ? 'border-indigo-300 ring-2 ring-indigo-50 bg-indigo-50/20'
                    : 'border-slate-200'
                  }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${anc.priority === 'Urgent'
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

                    {anc.targetAudience === 'Management' ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>
                          {isPersonalToMe
                            ? 'Personal Notice to You'
                            : `Management: ${anc.targetEmployeeName || 'Staff Member'}`}
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
      {mounted && modalOpen && typeof document !== 'undefined' && createPortal(
        <div
          id="publish-notice-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
                  <Megaphone className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Send New Notice
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                      Official
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Broadcast corporate circular or target specific employee
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishNotice} className="mt-4 space-y-4 text-xs">
              {/* Audience selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">
                  Target Recipient
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAudienceType('All')}
                    className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${audienceType === 'All'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Broadcast to All Staff</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudienceType('Management')}
                    className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${audienceType === 'Management'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Specific Employee</span>
                  </button>
                </div>
              </div>

              {/* If Management: select employee */}
              {audienceType === 'Management' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5 text-xs">
                    Select Target Employee *
                  </label>
                  <select
                    id="select-notice-employee"
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium cursor-pointer"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode} • {emp.departmentName || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">
                  Notice Subject / Title *
                </label>
                <input
                  id="input-bulletin-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mandatory System Maintenance / Holiday Policy Update..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium placeholder:text-slate-400"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">
                  Urgency / Priority Level
                </label>
                <select
                  id="select-bulletin-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium cursor-pointer"
                >
                  <option value="Low">🟢 Low Priority (General Notice)</option>
                  <option value="Medium">🔵 Medium Priority (Standard Notice)</option>
                  <option value="High">🔴 High Priority (Action Required)</option>
                  <option value="Urgent">⚠️ Urgent Notice (Immediate Attention)</option>
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">
                  Notice Body &amp; Instructions *
                </label>
                <textarea
                  id="textarea-bulletin-content"
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the full notice announcement instructions here..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium placeholder:text-slate-400 resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-publish-bulletin"
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#2d6a4f] hover:bg-[#1b4332] rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Publishing Notice...' : 'Send Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
