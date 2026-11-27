'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Bell, CheckCircle2, AlertCircle, Info, X, MessageSquare } from 'lucide-react';
import { getSocketBaseUrl } from '../lib/config';
import { clearApiCache, api } from '../lib/api';
import { getCookie } from '../lib/cookies';
import { useAuth } from './AuthContext';
import {
  receiveIncomingSocketMessage,
  receiveIncomingSocketEdit,
  receiveIncomingSocketDelete,
  applyReadReceipt,
} from '../lib/chatService';

export interface AppNotice {
  id: string;
  kind: 'message' | 'leave' | 'task';
  title: string;
  message: string;
  module: string;
  createdAt: string;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  module?: string;
  timestamp: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  emitChatMessage: (message: any) => void;
  emitChatEdit: (payload: any) => void;
  emitChatDelete: (payload: any) => void;
  emitChatTyping: (payload: any) => void;
  emitChatRead: (payload: any) => void;
  joinTeamChat: (teamId: string) => void;
  emitTeamChat: (payload: { teamId: string; text: string }) => void;
  emitTeamChatTyping: (teamId: string) => void;
  emitLeaveApplied: (leaveData: any) => void;
  emitLeaveStatusUpdated: (payload: any) => void;
  notices: AppNotice[];
  readNoticeIds: string[];
  unreadNoticesCount: number;
  markNoticeRead: (id: string) => void;
  markAllNoticesRead: () => void;
  dismissNotice: (id: string) => void;
  clearNotices: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  toasts: [],
  showToast: () => { },
  removeToast: () => { },
  emitChatMessage: () => { },
  emitChatEdit: () => { },
  emitChatDelete: () => { },
  emitChatTyping: () => { },
  emitChatRead: () => { },
  joinTeamChat: () => { },
  emitTeamChat: () => { },
  emitTeamChatTyping: () => { },
  emitLeaveApplied: () => { },
  emitLeaveStatusUpdated: () => { },
  notices: [],
  readNoticeIds: [],
  unreadNoticesCount: 0,
  markNoticeRead: () => { },
  markAllNoticesRead: () => { },
  dismissNotice: () => { },
  clearNotices: () => { },
});

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, role, planStatus } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notices, setNotices] = useState<AppNotice[]>([]);
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>([]);

  const unreadNoticesCount = notices.filter((n) => !readNoticeIds.includes(n.id)).length;

  const markNoticeRead = (id: string) => {
    setReadNoticeIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const markAllNoticesRead = () => {
    setReadNoticeIds(notices.map((n) => n.id));
  };

  const dismissNotice = (id: string) => {
    setNotices((prev) => prev.filter((item) => item.id !== id));
    setReadNoticeIds((prev) => prev.filter((rid) => rid !== id));
    api.dismissNotice(id).catch(() => {});
  };

  const clearNotices = () => {
    setNotices([]);
    setReadNoticeIds([]);
    api.clearNotices().catch(() => {});
  };

  useEffect(() => {
    const roleUpper = String(user?.role || '').toUpperCase();
    if (!isAuthenticated || !user?.id || (roleUpper !== 'SUPER_ADMIN' && (!planStatus.checked || !planStatus.premium))) {
      setNotices([]);
      return;
    }
    let live = true;
    api.listNotices()
      .then((rows) => {
        if (!live) return;
        setNotices((prev) => {
          const ids = new Set(((rows as any[]) || []).map((row: any) => row.id));
          return [...prev.filter((item) => !ids.has(item.id)), ...((rows as any[]) || [])].slice(0, 40);
        });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [isAuthenticated, user?.id, user?.role, planStatus.checked, planStatus.premium]);

  const showToast = (item: Omit<ToastItem, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = {
      ...item,
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const emitChatMessage = (message: any) => {
    if (socket && isConnected) {
      socket.emit('chat_send_message', message);
    }
  };

  const emitChatEdit = (payload: any) => {
    if (socket && isConnected) {
      socket.emit('chat_edit_message', payload);
    }
  };

  const emitChatDelete = (payload: any) => {
    if (socket && isConnected) {
      socket.emit('chat_delete_message', payload);
    }
  };

  const emitChatTyping = (payload: any) => {
    if (socket && isConnected) {
      socket.emit('chat_typing', payload);
    }
  };

  const emitChatRead = (payload: any) => {
    if (socket && isConnected) {
      socket.emit('chat_read', payload);
    }
  };

  const joinTeamChat = (teamId: string) => {
    if (socket && isConnected && teamId) socket.emit('team_chat_join', { teamId });
  };

  const emitTeamChat = (payload: { teamId: string; text: string }) => {
    if (socket && isConnected && payload?.teamId) socket.emit('team_chat_send', payload);
  };

  const emitTeamChatTyping = (teamId: string) => {
    if (socket && isConnected && teamId) socket.emit('team_chat_typing', { teamId });
  };

  const emitLeaveApplied = (leaveData: any) => {
    // 1. Cross-tab instant local broadcast (0ms tab synchronization)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const localBc = new BroadcastChannel('hrms_realtime_sync');
        localBc.postMessage({ type: 'HRMS_LEAVE_APPLIED', payload: leaveData });
        localBc.close();
      } catch (_) { }
    }

    // 2. WebSocket gateway emit to backend
    if (socket && isConnected) {
      socket.emit('leave_applied', leaveData);
      socket.emit('leave_request', leaveData);
      socket.emit('new_leave_applied', leaveData);
      socket.emit('new_leave_request', leaveData);
      socket.emit('leave_request_submitted', leaveData);
      socket.emit('create_leave', leaveData);
      socket.emit('apply_leave', leaveData);
      socket.emit('notification', {
        module: 'leaves',
        type: 'info',
        title: `📋 New Leave Request: ${leaveData?.employeeName || 'Staff Member'}`,
        message: `${leaveData?.leaveType || 'Leave'} applied (${leaveData?.startDate || ''} to ${leaveData?.endDate || ''}). Reason: ${leaveData?.reason || 'No reason provided'}`,
        data: leaveData,
      });
    }
  };

  const emitLeaveStatusUpdated = (payload: any) => {
    // 1. Cross-tab instant local broadcast (0ms tab synchronization)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const localBc = new BroadcastChannel('hrms_realtime_sync');
        localBc.postMessage({ type: 'HRMS_LEAVE_STATUS_UPDATED', payload });
        localBc.close();
      } catch (_) { }
    }

    // 2. WebSocket gateway emit to backend
    if (socket && isConnected) {
      socket.emit('leave_status_updated', payload);
      socket.emit('leave_updated', payload);
      if (payload.status === 'Approved') {
        socket.emit('leave_approved', payload);
      } else if (payload.status === 'Rejected') {
        socket.emit('leave_rejected', payload);
      }
      socket.emit('notification', {
        module: 'leaves',
        type: payload.status === 'Approved' ? 'success' : 'warning',
        title: `Leave ${payload.status || 'Updated'}: ${payload.employeeName || 'Staff'}`,
        message: `Leave request for ${payload.leaveType || 'period'} has been ${payload.status?.toLowerCase() || 'updated'}.`,
        data: payload,
      });
    }
  };

  useEffect(() => {
    // Check if user is authenticated (from context state or cookie)
    const isAuth =
      isAuthenticated ||
      (typeof window !== 'undefined' && getCookie('hrms_is_authenticated') === 'true');

    if (!isAuth || !user?.id) {
      if (socket) {
        (socket as any).disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // BroadcastChannel for instant cross-tab / cross-window sync on same browser
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('hrms_realtime_sync');
      } catch (_) {
        bc = null;
      }
    }

    // Dynamically connect to WebSocket Gateway using URL from .env
    const socketUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:4000`
      : getSocketBaseUrl();
    const currentUserId = user.id;
    const currentRole = user.role || role || '';

    const s = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: {
        userId: currentUserId,
        employeeId: user.employeeId || currentUserId,
        role: currentRole,
        companyId: (user as any)?.companyId,
      },
      query: {
        userId: currentUserId,
        employeeId: user.employeeId || currentUserId,
        role: currentRole,
      },
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    const registerPayload = {
      userId: currentUserId,
      id: currentUserId,
      employeeId: user?.employeeId || currentUserId,
      companyId: (user as any)?.companyId || null,
      companyCode: (user as any)?.companyCode || null,
      role: currentRole,
      isSuperAdmin: String(currentRole || '').toUpperCase() === 'SUPER_ADMIN',
    };

    s.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Connected to Paneliya Enterprise WebSocket Gateway');

      // Gateway drops direct messages until this identity is stored on the socket.
      s.emit('register', registerPayload);
      s.emit('authenticate', registerPayload);

      // Join rooms for targeted updates
      if (currentUserId) {
        s.emit('join', currentUserId);
        s.emit('join_user', currentUserId);
        s.emit('join_room', currentUserId);
      }
      if ((user as any)?.companyId) {
        s.emit('join', `company_${(user as any).companyId}`);
        s.emit('join_room', `company_${(user as any).companyId}`);
      }

      const normRole = String(currentRole || '').toUpperCase();
      if (
        normRole === 'SUPER_ADMIN' ||
        normRole === 'ADMIN' ||
        normRole === 'HR_ADMIN' ||
        normRole === 'HR' ||
        normRole === 'COMPANY_ADMIN'
      ) {
        s.emit('join', 'admin_room');
        s.emit('join', 'admins');
        s.emit('join', 'hr');
        s.emit('join_room', 'admin_room');
        s.emit('join_room', 'admins');
      }

      s.emit('user_connected', {
        userId: currentUserId,
        employeeId: user?.employeeId || currentUserId,
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        role: currentRole,
      });
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket Gateway');
    });

    s.on('notification', (payload: any) => {
      showToast({
        title: payload.title || 'System Notification',
        message: payload.message || '',
        type: payload.type || 'info',
        module: payload.module,
      });

      const mod = String(payload.module || '').toLowerCase();
      if (
        mod === 'leave' ||
        mod === 'leaves' ||
        (payload.title && String(payload.title).toLowerCase().includes('leave'))
      ) {
        window.dispatchEvent(new CustomEvent('hrms_leaves_updated', { detail: payload }));
      }
    });

    // Real-Time Leave Socket Listeners (Instant Admin Sync)
    const handleIncomingLeaveRequest = (payload: any) => {
      console.log('⚡ [Socket] New leave request event received:', payload);
      window.dispatchEvent(new CustomEvent('hrms_leaves_updated', { detail: payload }));

      try {
        const rawUser = getCookie('hrms_auth_user');
        const currentUser = rawUser ? JSON.parse(rawUser) : user;
        const uRole = (currentUser?.role || currentRole || '').toUpperCase();
        const isAdmin =
          uRole === 'SUPER_ADMIN' ||
          uRole === 'ADMIN' ||
          uRole === 'HR_ADMIN' ||
          uRole === 'HR' ||
          uRole === 'COMPANY_ADMIN';

        if (isAdmin) {
          showToast({
            title: `📋 New Leave Request: ${payload?.employeeName || payload?.name || 'Staff Member'}`,
            message: `${payload?.leaveType || 'Leave'} applied (${payload?.startDate || ''} to ${payload?.endDate || ''}). Reason: ${payload?.reason || 'No reason provided'}`,
            type: 'info',
            module: 'leaves',
          });
        }
      } catch (_) { }
    };

    s.on('leave_applied', handleIncomingLeaveRequest);
    s.on('leave_request', handleIncomingLeaveRequest);
    s.on('new_leave_applied', handleIncomingLeaveRequest);
    s.on('new_leave_request', handleIncomingLeaveRequest);
    s.on('leave_request_submitted', handleIncomingLeaveRequest);
    s.on('new_leave', handleIncomingLeaveRequest);
    s.on('leave_created', handleIncomingLeaveRequest);
    s.on('apply_leave', handleIncomingLeaveRequest);

    const handleIncomingLeaveStatus = (payload: any) => {
      console.log('⚡ [Socket] Leave status update event received:', payload);
      window.dispatchEvent(new CustomEvent('hrms_leaves_updated', { detail: payload }));

      try {
        const rawUser = getCookie('hrms_auth_user');
        const currentUser = rawUser ? JSON.parse(rawUser) : user;
        const myEmpId = currentUser?.employeeId || currentUser?.id || currentUserId;
        const targetEmpId = payload?.employeeId || payload?.userId;

        if (!targetEmpId || !myEmpId || targetEmpId === myEmpId) {
          const isApproved = payload?.status === 'Approved';
          showToast({
            title: `Leave ${payload?.status || 'Updated'}`,
            message: `Your ${payload?.leaveType || 'leave'} request has been ${payload?.status?.toLowerCase() || 'updated'}.`,
            type: isApproved ? 'success' : 'warning',
            module: 'leaves',
          });
        }
      } catch (_) { }
    };

    s.on('leave_status_updated', handleIncomingLeaveStatus);

    const handleAttendanceLive = (payload?: any) => {
      clearApiCache('attendance');
      clearApiCache('/dashboard');
      clearApiCache('work');
      window.dispatchEvent(new CustomEvent('hrms_attendance_live', { detail: payload || null }));
      window.dispatchEvent(new CustomEvent('hrms_work_status_updated'));
    };
    s.on('attendance_live', handleAttendanceLive);
    s.on('attendance_updated', handleAttendanceLive);
    s.on('attendance_punched', handleAttendanceLive);
    s.on('attendance_tick', (payload: { serverNow?: string }) => {
      if (!payload?.serverNow) return;
      window.dispatchEvent(new CustomEvent('hrms_attendance_tick', { detail: payload }));
    });
    s.on('leave_updated', handleIncomingLeaveStatus);
    s.on('leave_approved', handleIncomingLeaveStatus);
    s.on('leave_rejected', handleIncomingLeaveStatus);

    // Explicitly handled events set to prevent duplicate invocations in wildcard
    const explicitLeaveEvents = new Set([
      'leave_applied',
      'leave_request',
      'new_leave_applied',
      'new_leave_request',
      'leave_request_submitted',
      'new_leave',
      'leave_created',
      'apply_leave',
      'leave_status_updated',
      'leave_updated',
      'leave_approved',
      'leave_rejected',
    ]);

    // Wildcard event interceptor for unknown/alternate backend leave event names
    s.onAny((event: string, ...args: any[]) => {
      const ev = String(event || '').toLowerCase();
      if (explicitLeaveEvents.has(ev)) return; // Already handled by specific s.on listener

      const payload = args[0];
      if (
        ev.includes('leave') ||
        (payload && typeof payload === 'object' && (payload.module === 'leaves' || payload.module === 'leave'))
      ) {
        console.log(`⚡ [Socket onAny] Caught alternate leave event: "${event}"`, payload);
        if (
          ev.includes('status') ||
          ev.includes('approved') ||
          ev.includes('rejected') ||
          (payload && payload.status && payload.status !== 'Pending')
        ) {
          handleIncomingLeaveStatus(payload);
        } else {
          handleIncomingLeaveRequest(payload);
        }
      }
    });

    // Listen on BroadcastChannel for multi-tab sync
    if (bc) {
      (bc as any).onmessage = (event: any) => {
        if (!event?.data) return;
        const { type, payload } = event.data;
        if (type === 'HRMS_LEAVE_APPLIED') {
          handleIncomingLeaveRequest(payload);
        } else if (type === 'HRMS_LEAVE_STATUS_UPDATED') {
          handleIncomingLeaveStatus(payload);
        }
      };
    }

    // Real-Time Socket Chat Listeners
    const viewerId = ['SUPER_ADMIN', 'ADMIN', 'HR', 'HR_ADMIN', 'COMPANY_ADMIN'].includes(
      String(currentRole || '').toUpperCase(),
    )
      ? 'company-admin'
      : (user?.employeeId || currentUserId || undefined);

    const pushNotice = (notice: AppNotice) => {
      if (!notice?.id || !notice.title) return;
      setNotices((prev) => (prev.some((item) => item.id === notice.id) ? prev : [notice, ...prev].slice(0, 40)));
      showToast({ title: notice.title, message: notice.message, type: 'info', module: notice.module });
    };

    s.on('company_data', (payload: { scope?: string; companyId?: string }) => {
      const detail = payload || { scope: 'all' };
      const scope = detail.scope || 'all';
      const fire = (name: string) => window.dispatchEvent(new CustomEvent(name, { detail }));
      window.dispatchEvent(new CustomEvent('hrms_company_data', { detail }));
      if (scope === 'employees' || scope === 'all') fire('hrms_employees_updated');
      if (scope === 'attendance' || scope === 'all') {
        fire('hrms_attendance_updated');
        fire('hrms_work_status_updated');
      }
      if (scope === 'leaves' || scope === 'all') {
        fire('hrms_leaves_updated');
        fire('hrms_leave_types_updated');
      }
      if (scope === 'payroll' || scope === 'all') fire('hrms_payroll_updated');
      if (scope === 'settings' || scope === 'all') {
        fire('hrms_settings_updated');
        fire('hrms_companies_updated');
        fire('hrms_schedule_updated');
      }
      if (scope === 'tasks' || scope === 'all') fire('hrms_tasks_updated');
    });

    s.on('app_notification', (payload: AppNotice) => {
      pushNotice(payload);
      if (payload?.module === 'leaves') window.dispatchEvent(new CustomEvent('hrms_leaves_updated', { detail: payload }));
      if (payload?.module === 'tasks') window.dispatchEvent(new CustomEvent('hrms_tasks_updated', { detail: payload }));
    });

    s.on('group_chat_message', (incomingMessage: any) => {
      window.dispatchEvent(new CustomEvent('hrms_group_chat_message', { detail: incomingMessage }));
    });

    s.on('group_chat_list', (payload: any) => {
      window.dispatchEvent(new CustomEvent('hrms_group_chat_list', { detail: payload }));
    });

    s.on('direct_chat_message', (incomingMessage: any) => {
      window.dispatchEvent(new CustomEvent('hrms_direct_chat_message', { detail: incomingMessage }));
    });

    s.on('direct_chat_read', (payload: any) => {
      window.dispatchEvent(new CustomEvent('hrms_direct_chat_read', { detail: payload }));
    });

    s.on('staff_chat_read', (payload: any) => {
      window.dispatchEvent(new CustomEvent('hrms_staff_chat_read', { detail: payload }));
    });

    s.on('staff_chat_message', (incomingMessage: any) => {
      window.dispatchEvent(new CustomEvent('hrms_staff_chat_message', { detail: incomingMessage }));
    });

    s.on('team_chat_message', (incomingMessage: any) => {
      window.dispatchEvent(new CustomEvent('hrms_team_chat_message', { detail: incomingMessage }));
    });

    s.on('team_chat_typing', (payload: any) => {
      window.dispatchEvent(new CustomEvent('hrms_team_chat_typing', { detail: payload }));
    });

    s.on('chat_message_received', (incomingMessage: any) => {
      receiveIncomingSocketMessage(incomingMessage, viewerId || undefined);
      window.dispatchEvent(new CustomEvent('hrms_chat_socket_message', { detail: incomingMessage }));
      window.dispatchEvent(new CustomEvent('hrms_chat_updated'));
    });

    s.on('chat_message_edited', (payload: any) => {
      receiveIncomingSocketEdit(payload);
      window.dispatchEvent(new CustomEvent('hrms_chat_socket_edited', { detail: payload }));
      window.dispatchEvent(new CustomEvent('hrms_chat_updated'));
    });

    s.on('chat_message_deleted', (payload: any) => {
      receiveIncomingSocketDelete(payload);
      window.dispatchEvent(new CustomEvent('hrms_chat_socket_deleted', { detail: payload }));
      window.dispatchEvent(new CustomEvent('hrms_chat_updated'));
    });

    s.on('chat_typing_update', (payload: any) => {
      window.dispatchEvent(new CustomEvent('hrms_chat_socket_typing', { detail: payload }));
    });

    s.on('chat_messages_read', (payload: any) => {
      applyReadReceipt(payload);
      window.dispatchEvent(new CustomEvent('hrms_chat_updated'));
    });

    s.on('chat_notification', (payload: any) => {
      try {
        const rawUser = getCookie('hrms_auth_user');
        const currentUser = rawUser ? JSON.parse(rawUser) : null;
        const currentUserId = currentUser?.employeeId || currentUser?.id;
        const role = String(currentUser?.role || '').toUpperCase();
        const isAdminViewer = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'HR' || role === 'HR_ADMIN' || role === 'COMPANY_ADMIN';
        const addressedToMe =
          payload.recipientId === 'all' ||
          payload.recipientId === currentUserId ||
          payload.recipientId === currentUser?.id ||
          payload.recipientId === currentUser?.employeeId ||
          (isAdminViewer && payload.recipientId === 'company-admin');
        if (currentUserId && addressedToMe) {
          showToast({
            title: `💬 New Message: ${payload.senderName || 'Staff Member'}`,
            message: payload.content || 'Sent an attachment',
            type: 'info',
            module: 'chat',
          });
        }
      } catch (err) {
        // Ignore
      }
    });

    setSocket(s);

    return () => {
      if (bc) {
        bc.close();
      }
      s.disconnect();
    };
  }, [isAuthenticated, user?.id, user?.employeeId, user?.role, (user as any)?.companyId]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        toasts,
        showToast,
        removeToast,
        emitChatMessage,
        emitChatEdit,
        emitChatDelete,
        emitChatTyping,
        emitChatRead,
        joinTeamChat,
        emitTeamChat,
        emitTeamChatTyping,
        emitLeaveApplied,
        emitLeaveStatusUpdated,
        notices,
        readNoticeIds,
        unreadNoticesCount,
        markNoticeRead,
        markAllNoticesRead,
        dismissNotice,
        clearNotices,
      }}
    >
      {children}

      {/* Floating Real-Time Toast Notifications Container (Compact Glassmorphic Top-Right) */}
      <div className="fixed top-[72px] sm:top-[76px] right-4 z-50 flex flex-col gap-2 max-w-[300px] w-[calc(100vw-2rem)] pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto pl-3 pr-2.5 py-2.5 rounded-xl bg-white/60 backdrop-blur-xl shadow-[0_8px_24px_-6px_rgba(6,45,31,0.18)] border border-white/70 ring-1 ring-black/5 border-l-4 animate-in slide-in-from-top-3 transition-all duration-200 flex items-start gap-2.5 ${isSuccess
                ? 'border-l-emerald-600'
                : isWarning
                  ? 'border-l-amber-500'
                  : isError
                    ? 'border-l-rose-600'
                    : 'border-l-emerald-600'
                }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isSuccess
                  ? 'bg-emerald-500/15 text-emerald-700'
                  : isWarning
                    ? 'bg-amber-500/15 text-amber-700'
                    : isError
                      ? 'bg-rose-500/15 text-rose-700'
                      : 'bg-emerald-500/15 text-emerald-700'
                  }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isWarning ? (
                  <AlertCircle className="w-4 h-4" />
                ) : isError ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-xs font-semibold text-[#212529] truncate leading-tight">
                    {toast.title}
                  </h5>
                  <span className="text-[10px] text-slate-500 shrink-0">{toast.timestamp}</span>
                </div>
                <p className="text-[11px] font-normal mt-0.5 leading-snug line-clamp-2 text-slate-700">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-black/5 transition shrink-0 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
