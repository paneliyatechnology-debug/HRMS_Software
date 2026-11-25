'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Bell,
  Plus,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  Building2,
  Sparkles,
  X,
  Send,
  Loader2,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { Employee } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { canManageNotices } from '../../lib/rolePermissions';

interface AnnouncementsModuleProps {
  employees?: Employee[];
  portalMode?: 'employee' | 'admin';
}

interface NoticeBoardItem {
  id: string;
  title: string;
  content: string;
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW' | string;
  targetAudience?: string;
  departmentName?: string;
  targetEmployeeId?: string;
  createdAt?: string;
  authorName?: string;
  authorRole?: string;
}

interface UserNoticeAlert {
  id: string;
  kind?: string;
  title: string;
  message: string;
  module?: string;
  createdAt?: string;
}

export const AnnouncementsModule: React.FC<AnnouncementsModuleProps> = ({
  employees = [],
  portalMode = 'admin',
}) => {
  const { user } = useAuth();
  const userRole = (user?.role || 'EMPLOYEE').toUpperCase();
  const canPublish = canManageNotices(user);

  const [activeTab, setActiveTab] = useState<'board' | 'alerts'>('board');
  const [boardNotices, setBoardNotices] = useState<NoticeBoardItem[]>([]);
  const [userAlerts, setUserAlerts] = useState<UserNoticeAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Create Notice Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Notice form
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState<'NORMAL' | 'HIGH' | 'URGENT' | 'LOW'>('NORMAL');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'DEPARTMENT' | 'SPECIFIC'>('ALL');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [targetEmployeeId, setTargetEmployeeId] = useState('');

  // Fetch real notices from backend
  const loadNotices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [boardRes, alertsRes] = await Promise.allSettled([
        api.getAnnouncements(),
        api.listNotices(),
      ]);

      if (boardRes.status === 'fulfilled') {
        const rawBoard = Array.isArray(boardRes.value) ? boardRes.value : [];
        const formattedBoard: NoticeBoardItem[] = rawBoard.map((item: any) => ({
          id: String(item.id || item._id || Math.random()),
          title: item.title || 'Untitled Notice',
          content: item.content || item.message || item.description || '',
          priority: (item.priority || 'NORMAL').toUpperCase(),
          targetAudience: item.targetAudience || 'ALL',
          departmentName: item.departmentName || item.department || '',
          targetEmployeeId: item.targetEmployeeId || '',
          createdAt: item.createdAt || item.date || new Date().toISOString(),
          authorName: item.authorName || item.createdBy || (userRole === 'ADMIN' ? 'Company Administration' : 'Management'),
          authorRole: item.authorRole || 'Official Bulletin',
        }));
        setBoardNotices(formattedBoard);
      } else {
        setBoardNotices([]);
      }

      if (alertsRes.status === 'fulfilled') {
        const rawAlerts = Array.isArray(alertsRes.value) ? alertsRes.value : [];
        setUserAlerts(rawAlerts);
      } else {
        setUserAlerts([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load notices from server.');
    } finally {
      setIsLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  // Handle Create Notice Submit
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim()) {
      setSubmitError('Notice title is required.');
      return;
    }
    if (!noticeContent.trim()) {
      setSubmitError('Notice content is required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await api.createAnnouncement({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        priority: noticePriority,
        targetAudience,
        departmentName: targetAudience === 'DEPARTMENT' ? targetDepartment : undefined,
        targetEmployeeId: targetAudience === 'SPECIFIC' ? targetEmployeeId : undefined,
      });

      setSuccessToast('Notice published successfully to the company board!');
      setTimeout(() => setSuccessToast(null), 4000);
      setIsCreateModalOpen(false);
      setNoticeTitle('');
      setNoticeContent('');
      setNoticePriority('NORMAL');
      setTargetAudience('ALL');
      setTargetDepartment('');
      setTargetEmployeeId('');
      await loadNotices();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to publish notice. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Board Notice
  const handleDeleteNotice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this notice from the board?')) return;
    try {
      await api.deleteAnnouncement(id);
      setSuccessToast('Notice removed from the board.');
      setTimeout(() => setSuccessToast(null), 3000);
      setBoardNotices((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Could not delete notice.');
    }
  };

  // Handle Dismiss Personal Notice
  const handleDismissNotice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.dismissNotice(id);
      setUserAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Could not dismiss notice.');
    }
  };

  // Handle Clear All Alerts
  const handleClearAllAlerts = async () => {
    if (!window.confirm('Clear all your system notices?')) return;
    try {
      await api.clearNotices();
      setUserAlerts([]);
      setSuccessToast('All personal notices cleared.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Could not clear notices.');
    }
  };

  // Filtered Board Notices
  const filteredBoardNotices = boardNotices.filter((notice) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || notice.title.toLowerCase().includes(q) || notice.content.toLowerCase().includes(q);
    const matchesPriority = selectedPriority === 'ALL' || notice.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  const getPriorityBadge = (priority?: string) => {
    const p = (priority || 'NORMAL').toUpperCase();
    if (p === 'URGENT') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
          Urgent
        </span>
      );
    }
    if (p === 'HIGH') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          High Priority
        </span>
      );
    }
    if (p === 'LOW') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          Low Priority
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Standard Bulletin
      </span>
    );
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Recently';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 w-full max-w-6xl mx-auto select-none">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-900 text-white shadow-xl flex items-center gap-3 border border-emerald-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* Top Header Card (Fixed) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#52b788] to-[#2d6a4f] text-white flex items-center justify-center shadow-md shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Notice Board &amp; Announcements</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {boardNotices.length} Live {boardNotices.length === 1 ? 'Notice' : 'Notices'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Company circulars, administrative alerts, and workforce bulletins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={loadNotices}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              title="Refresh Notices"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {canPublish && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Notice</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector & Filter Bar */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('board')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'board'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Company Board ({boardNotices.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'alerts'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Personal Alerts ({userAlerts.length})</span>
            </button>
          </div>

          {activeTab === 'board' && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search notices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent Only</option>
                <option value="HIGH">High Priority</option>
                <option value="NORMAL">Standard</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          )}

          {activeTab === 'alerts' && userAlerts.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllAlerts}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area (Scrollable List Only) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-4 [scrollbar-width:thin]">
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <Loader2 className="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">Loading company notices...</p>
          <p className="text-[11px] text-slate-400">Fetching latest bulletins from organization server</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 text-rose-800 space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-600 mx-auto" />
          <p className="text-xs font-bold">{error}</p>
          <button
            type="button"
            onClick={loadNotices}
            className="px-4 py-2 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold hover:bg-rose-200 transition cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      ) : activeTab === 'board' ? (
        filteredBoardNotices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">No Bulletins on the Board</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedPriority !== 'ALL'
                  ? 'No notices match your current filters. Try resetting the search query.'
                  : 'There are currently no active announcements published for your organization.'}
              </p>
            </div>
            {canPublish && !searchQuery && selectedPriority === 'ALL' && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Post First Notice</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBoardNotices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(notice.priority)}
                      {notice.targetAudience && notice.targetAudience !== 'ALL' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {notice.targetAudience}
                        </span>
                      )}
                    </div>

                    {canPublish && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotice(notice.id, e)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {notice.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">
                      {notice.content}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{notice.authorName || 'Administration'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(notice.createdAt)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Alerts & Personal System Notifications Tab */
        userAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">All Caught Up!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You do not have any pending personal notifications or administrative notices right now.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {userAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{alert.title}</h4>
                      {alert.module && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 uppercase">
                          {alert.module}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {alert.message}
                    </p>
                    {alert.createdAt && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDate(alert.createdAt)}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDismissNotice(alert.id, e)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      )}
      </div>

      {/* Publish Notice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Publish New Notice</h3>
                  <p className="text-[11px] text-slate-400">Post an announcement to the workforce board</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="p-6 space-y-4 overflow-y-auto">
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quarterly All-Hands Meeting or Office Maintenance Notice"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Message / Details *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter the full announcement text, instructions, and meeting or deadline details..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={noticePriority}
                    onChange={(e) => setNoticePriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="NORMAL">Standard Bulletin</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Action Required</option>
                    <option value="LOW">Low / Information</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="ALL">All Company Staff</option>
                    <option value="DEPARTMENT">Specific Department</option>
                    <option value="SPECIFIC">Single Employee</option>
                  </select>
                </div>
              </div>

              {targetAudience === 'DEPARTMENT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering, Sales, Human Resources"
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              )}

              {targetAudience === 'SPECIFIC' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Employee</label>
                  <select
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="">Select Employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Notice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
