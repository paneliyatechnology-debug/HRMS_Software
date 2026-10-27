'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Bell, CheckCircle2, AlertCircle, Info, X, MessageSquare } from 'lucide-react';
import { getSocketBaseUrl } from '../lib/config';
import {
  receiveIncomingSocketMessage,
  receiveIncomingSocketEdit,
  receiveIncomingSocketDelete,
} from '../lib/chatService';

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
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  toasts: [],
  showToast: () => {},
  removeToast: () => {},
  emitChatMessage: () => {},
  emitChatEdit: () => {},
  emitChatDelete: () => {},
  emitChatTyping: () => {},
});

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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

  useEffect(() => {
    // Only attempt socket connection if the user is logged in
    const isAuth = typeof window !== 'undefined' && localStorage.getItem('hrms_is_authenticated') === 'true';
    if (!isAuth) {
      return;
    }

    // Dynamically connect to WebSocket Gateway using URL from .env
    const socketUrl = getSocketBaseUrl();
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 2,
      reconnectionDelay: 2000,
      timeout: 3000,
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Connected to Paneliya Enterprise WebSocket Gateway');
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
    });

    // Real-Time Socket Chat Listeners
    s.on('chat_message_received', (incomingMessage: any) => {
      receiveIncomingSocketMessage(incomingMessage);
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

    s.on('chat_notification', (payload: any) => {
      try {
        const rawUser = localStorage.getItem('hrms_auth_user');
        const currentUser = rawUser ? JSON.parse(rawUser) : null;
        const currentUserId = currentUser?.employeeId || currentUser?.id;
        if (currentUserId && (payload.recipientId === currentUserId || payload.recipientId === 'all')) {
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
      s.disconnect();
    };
  }, []);

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
      }}
    >
      {children}

      {/* Floating Real-Time Toast Notifications Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-2xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-bottom-5 transition-all duration-300 flex items-start gap-3.5 ${
                isSuccess
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-white'
                  : isWarning
                  ? 'bg-amber-950/90 border-amber-500/30 text-white'
                  : isError
                  ? 'bg-rose-950/90 border-rose-500/30 text-white'
                  : 'bg-slate-900/90 border-slate-700/50 text-white'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isSuccess
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isWarning
                    ? 'bg-amber-500/20 text-amber-400'
                    : isError
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isWarning ? (
                  <AlertCircle className="w-5 h-5" />
                ) : isError ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {toast.title}
                  </h5>
                  <span className="text-[10px] text-slate-400">{toast.timestamp}</span>
                </div>
                <p className="text-sm font-medium mt-0.5 leading-snug line-clamp-2 text-slate-100">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
