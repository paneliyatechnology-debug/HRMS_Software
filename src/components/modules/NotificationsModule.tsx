'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CalendarOff,
  CheckSquare,
  CircleDollarSign,
  FileText,
  MessageSquare,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { AppNotice, useSocket } from '../../context/SocketContext';

interface NotificationsModuleProps {
  onNavigateModule?: (module: string) => void;
}

type FilterTab = 'All' | 'Unread' | 'Leave' | 'Tasks' | 'Chat' | 'Other';

function formatRelativeTime(isoOrDate?: string): string {
  if (!isoOrDate) return 'Just now';
  const ts = Date.parse(isoOrDate);
  if (Number.isNaN(ts)) return isoOrDate;
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 30) return `${diffDay} days ago`;
  return new Date(ts).toLocaleDateString();
}

function resolveNoticeCategory(notice: AppNotice): 'Leave' | 'Tasks' | 'Chat' | 'Other' {
  const mod = (notice.module || '').toLowerCase();
  if (notice.kind === 'leave' || mod.includes('leave')) return 'Leave';
  if (notice.kind === 'task' || mod.includes('task')) return 'Tasks';
  if (notice.kind === 'message' || mod.includes('chat')) return 'Chat';
  return 'Other';
}

function getNoticeIcon(notice: AppNotice) {
  const mod = (notice.module || '').toLowerCase();
  if (notice.kind === 'leave' || mod.includes('leave')) {
    return <CalendarOff className="w-4 h-4 text-[#2d6a4f]" />;
  }
  if (notice.kind === 'message' || mod.includes('chat')) {
    return <MessageSquare className="w-4 h-4 text-[#2d6a4f]" />;
  }
  if (notice.kind === 'task' || mod.includes('task')) {
    return <CheckSquare className="w-4 h-4 text-[#2d6a4f]" />;
  }
  if (mod.includes('payroll') || mod.includes('payslip')) {
    return <CircleDollarSign className="w-4 h-4 text-[#2d6a4f]" />;
  }
  if (mod.includes('recruit')) {
    return <UserCheck className="w-4 h-4 text-[#2d6a4f]" />;
  }
  if (mod.includes('announce') || mod.includes('document')) {
    return <FileText className="w-4 h-4 text-[#2d6a4f]" />;
  }
  return <Bell className="w-4 h-4 text-[#2d6a4f]" />;
}

export const NotificationsModule: React.FC<NotificationsModuleProps> = ({
  onNavigateModule,
}) => {
  const {
    notices,
    noticesLoading,
    noticesError,
    readNoticeIds,
    unreadNoticesCount,
    markNoticeRead,
    markAllNoticesRead,
    dismissNotice,
    clearNotices,
    fcmPermission,
    fcmConfigured,
    fcmEnabled,
    fcmBusy,
    fcmError,
    enablePushNotifications,
    disablePushNotifications,
  } = useSocket();
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  useEffect(() => {
    if (unreadNoticesCount > 0) {
      markAllNoticesRead();
    }
  }, [unreadNoticesCount, markAllNoticesRead]);

  const tabs: Array<{ id: FilterTab; label: string }> = [
    { id: 'All', label: 'All' },
    { id: 'Unread', label: 'Unread' },
    { id: 'Leave', label: 'Leave' },
    { id: 'Tasks', label: 'Tasks' },
    { id: 'Chat', label: 'Chat' },
  ];

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      const isRead = readNoticeIds.includes(notice.id);
      if (activeTab === 'Unread') return !isRead;
      if (activeTab === 'All') return true;
      return resolveNoticeCategory(notice) === activeTab;
    });
  }, [notices, readNoticeIds, activeTab]);

  const handleViewNotice = (notice: AppNotice) => {
    markNoticeRead(notice.id);
    dismissNotice(notice.id);
    if (notice.module) {
      onNavigateModule?.(notice.module);
    }
  };

  return (
    <div className="space-y-4 w-full animate-in fade-in select-none">
      {/* Push Notification Settings Bar */}
      <div className="bg-white rounded-2xl border border-[#dee2e6] p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${fcmEnabled && fcmPermission === 'granted' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900">
              Browser Push Notifications ({fcmEnabled && fcmPermission === 'granted' ? 'Enabled' : fcmPermission === 'denied' ? 'Blocked in Browser' : fcmPermission === 'unsupported' ? 'Unsupported' : 'Disabled'})
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {fcmError
                ? fcmError
                : !fcmConfigured
                  ? 'Firebase Web credentials are not configured in .env.local yet.'
                  : fcmPermission === 'denied'
                    ? 'Notifications are blocked in your browser site settings.'
                    : fcmEnabled && fcmPermission === 'granted'
                      ? 'You will receive real-time push alerts even when this tab is in the background.'
                      : 'Click Enable Notifications to receive push alerts on this device.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {fcmEnabled && fcmPermission === 'granted' ? (
            <button
              type="button"
              disabled={fcmBusy}
              onClick={() => void disablePushNotifications()}
              className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs cursor-pointer disabled:opacity-50"
            >
              {fcmBusy ? 'Updating...' : 'Disable Notifications'}
            </button>
          ) : (
            <button
              type="button"
              disabled={fcmBusy || fcmPermission === 'unsupported' || fcmPermission === 'denied' || !fcmConfigured}
              onClick={() => void enablePushNotifications()}
              className="px-3.5 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fcmBusy ? 'Enabling...' : 'Enable Notifications'}
            </button>
          )}
        </div>
      </div>

      {/* Top Right: Mark all Read */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Filter Tabs */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80 shadow-2xs overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${isActive
                  ? 'bg-[#2d6a4f] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
              >
                <span>{tab.label}</span>
                {tab.id === 'Unread' && unreadNoticesCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight ${isActive ? 'bg-white/20 text-white' : 'bg-[#d8f3dc] text-[#1b4332]'
                      }`}
                  >
                    {unreadNoticesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {unreadNoticesCount > 0 && (
            <button
              type="button"
              onClick={markAllNoticesRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#dee2e6] bg-white hover:bg-[#f8f9fa] text-slate-700 font-semibold text-xs shadow-2xs transition cursor-pointer"
            >
              <span>Mark all read</span>
            </button>
          )}
          <button
            type="button"
            onClick={clearNotices}
            disabled={notices.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#dee2e6] bg-white hover:bg-[#f8f9fa] text-slate-700 font-semibold text-xs shadow-2xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#2d6a4f]" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Notifications List Card */}
      <div className="bg-white rounded-2xl border border-[#dee2e6] shadow-2xs overflow-hidden">
        {noticesLoading && notices.length === 0 ? (
          <div className="py-16 px-4 text-center text-xs text-slate-500">Loading notifications...</div>
        ) : noticesError ? (
          <div className="py-16 px-4 text-center text-xs text-rose-600">{noticesError}</div>
        ) : filteredNotices.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#d8f3dc]/60 border border-[#b7e4c7] text-[#2d6a4f] flex items-center justify-center mx-auto mb-3">
              <Bell className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {activeTab === 'All' ? 'No new notifications' : `No ${activeTab.toLowerCase()} notifications`}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'All'
                ? "You're all caught up with your workspace updates."
                : 'Try switching to the All tab to view all notifications.'}
            </p>
            {activeTab !== 'All' && notices.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('All')}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#d8f3dc] text-[#1b4332] text-xs font-semibold hover:bg-[#b7e4c7] transition cursor-pointer"
              >
                View All Notifications
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotices.map((notice) => {
              const isUnread = !readNoticeIds.includes(notice.id);
              return (
                <div
                  key={notice.id}
                  onClick={() => handleViewNotice(notice)}
                  className={`flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 transition-colors cursor-pointer ${isUnread ? 'bg-[#d8f3dc]/15 hover:bg-[#d8f3dc]/25' : 'bg-white hover:bg-slate-50/80'
                    }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#d8f3dc]/70 border border-[#b7e4c7] flex items-center justify-center shrink-0">
                      {getNoticeIcon(notice)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-[13px] font-semibold text-slate-900 truncate">
                          {notice.title}
                        </p>
                        {isUnread && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#2d6a4f] shrink-0"
                            aria-label="Unread"
                          />
                        )}
                      </div>
                      {notice.message && (
                        <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{notice.message}</p>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                        {formatRelativeTime(notice.createdAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewNotice(notice);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-[#1b4332] hover:bg-[#d8f3dc]/50 transition shrink-0 cursor-pointer"
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
