'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Search,
  Paperclip,
  CheckCheck,
  Check,
  MessageSquare,
  Users,
  Building2,
  Clock,
  ArrowLeft,
  X,
  FileText,
  Image as ImageIcon,
  Smile,
  Shield,
  User as UserIcon,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Employee, ChatConversation, ChatMessage, ChatAttachment } from '../../types/hrms';
import {
  getAllConversations,
  getAllMessagesMap,
  getMessagesForConversation,
  incomingUnreadCount,
  sendChatMessage,
  editChatMessage,
  deleteChatMessage,
  clearConversationMessages,
  clearAllChats,
  markConversationAsRead,
  syncConversationsWithEmployees,
  hydrateMessages,
  setActiveChatConversation,
  markOpenConversationRead,
  ADMIN_USER_ID,
  ADMIN_NAME,
} from '../../lib/chatService';
import { api } from '../../lib/api';

interface ChatModuleProps {
  employees?: Employee[];
  initialEmployeeId?: string | null;
  onClearInitialEmployee?: () => void;
  portalMode?: 'admin' | 'employee';
}

export const ChatModule: React.FC<ChatModuleProps> = ({
  employees = [],
  initialEmployeeId,
  onClearInitialEmployee,
  portalMode: propPortalMode,
}) => {
  const { user, portalMode: authPortalMode } = useAuth();
  const portalMode = propPortalMode || authPortalMode || 'admin';
  const { isConnected, emitChatMessage, emitChatEdit, emitChatDelete, emitChatTyping, emitChatRead } = useSocket();

  // Determine current user chat identity
  const currentUserId = portalMode === 'admin' ? ADMIN_USER_ID : user?.employeeId || user?.id || '';
  const currentUserName =
    portalMode === 'admin'
      ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || ADMIN_NAME
      : `${user?.firstName || 'Staff'} ${user?.lastName || 'Member'}`.trim();
  const currentUserRole = portalMode === 'admin' ? ('admin' as const) : ('employee' as const);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'direct' | 'broadcast'>('all');
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  // Real-time socket typing state
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Custom confirmation modal state (replaces native window.confirm)
  const [customConfirmAction, setCustomConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Edit and Delete Message states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  useEffect(() => {
    if (!deletingMessageId) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeletingMessageId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deletingMessageId]);


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInputAccept, setFileInputAccept] = useState<string>('*/*');

  // Load and sync conversations
  const loadConversations = () => {
    const list = syncConversationsWithEmployees(employees);
    const map = getAllMessagesMap();
    const withPreview = list.map((conv) => {
      const thread = map[conv.id];
      if (!thread?.length) {
        return conv.lastMessage ? { ...conv, lastMessage: '' } : conv;
      }
      const last = thread[thread.length - 1];
      return {
        ...conv,
        lastMessage: last.content || (last.attachments?.length ? 'Sent an attachment' : ''),
        lastMessageTimestamp: last.timestamp,
        lastSenderId: last.senderId,
      };
    });
    withPreview.sort((a, b) => {
      if (a.type === b.type) return 0;
      return a.type === 'direct' ? -1 : 1;
    });
    setConversations(withPreview);
  };

  useEffect(() => {
    loadConversations();
    const handleUpdate = () => {
      loadConversations();
    };
    window.addEventListener('hrms_chat_updated', handleUpdate);
    return () => {
      window.removeEventListener('hrms_chat_updated', handleUpdate);
    };
  }, [employees]);

  useEffect(() => {
    let cancelled = false;
    api.getChatMessages()
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return;
        hydrateMessages(rows);
        markOpenConversationRead(currentUserId);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle initial targeted employee chat from directory or dashboard
  useEffect(() => {
    if (initialEmployeeId) {
      const targetConvId = `conv-${ADMIN_USER_ID}-${initialEmployeeId}`;
      const found = conversations.find((c) => c.id === targetConvId);
      if (found) {
        setActiveConversationId(targetConvId);
        setMobileShowThread(true);
      } else {
        // Find employee object to create conversation
        const targetEmp = employees.find((e) => e.id === initialEmployeeId);
        if (targetEmp) {
          syncConversationsWithEmployees(employees);
          setActiveConversationId(targetConvId);
          setMobileShowThread(true);
        }
      }
      if (onClearInitialEmployee) {
        onClearInitialEmployee();
      }
    }
  }, [initialEmployeeId, conversations, employees]);

  // Open the direct HR/staff thread first. General broadcast stays available, but it is not the default inbox.
  useEffect(() => {
    if (conversations.length === 0) return;
    if (activeConversationId && conversations.some((c) => c.id === activeConversationId)) return;
    const directId =
      portalMode === 'employee'
        ? `conv-${ADMIN_USER_ID}-${currentUserId}`
        : conversations.find((c) => c.type === 'direct')?.id;
    const preferred =
      conversations.find((c) => c.id === directId) ||
      conversations.find((c) => c.type === 'direct') ||
      conversations[0];
    setActiveConversationId(preferred.id);
  }, [conversations, activeConversationId, portalMode, currentUserId]);

  const notifyMessagesRead = (conversationId: string) => {
    const conv = getAllConversations().find((item) => item.id === conversationId);
    const otherId =
      conv?.type === 'broadcast'
        ? 'all'
        : conv?.participantIds?.find((id) => id !== currentUserId) || 'all';
    emitChatRead({
      conversationId,
      readerId: currentUserId,
      recipientId: otherId,
    });
    api.markChatRead(conversationId).catch(() => {});
  };

  useEffect(() => {
    setActiveChatConversation(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => () => setActiveChatConversation(''), []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) return;
    const msgs = getMessagesForConversation(activeConversationId);
    setMessages(msgs);
    markConversationAsRead(activeConversationId, currentUserId);
    if (msgs.some((msg) => msg.senderId !== currentUserId)) {
      notifyMessagesRead(activeConversationId);
    }
  }, [activeConversationId, currentUserId, isConnected]);

  // Listen to message updates
  useEffect(() => {
    const handleMessageUpdate = () => {
      if (!activeConversationId) return;
      const hadUnread = markConversationAsRead(activeConversationId, currentUserId);
      setMessages(getMessagesForConversation(activeConversationId));
      if (hadUnread) notifyMessagesRead(activeConversationId);
    };
    window.addEventListener('hrms_chat_updated', handleMessageUpdate);
    return () => {
      window.removeEventListener('hrms_chat_updated', handleMessageUpdate);
    };
  }, [activeConversationId, currentUserId, isConnected]);

  // Auto-scroll to bottom of thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time remote typing indicator via WebSocket
  useEffect(() => {
    const handleRemoteTyping = (e: any) => {
      const data = e.detail;
      if (data && data.conversationId === activeConversationId && data.userId !== currentUserId) {
        if (data.isTyping) {
          setTypingUser(data.userName || 'Staff Member');
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 3000);
        } else {
          setTypingUser(null);
        }
      }
    };

    window.addEventListener('hrms_chat_socket_typing', handleRemoteTyping);
    return () => {
      window.removeEventListener('hrms_chat_socket_typing', handleRemoteTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeConversationId, currentUserId]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Helper to determine the other participant's details in a 1-to-1 chat
  const getOtherParticipantInfo = (conv: ChatConversation) => {
    if (conv.type === 'broadcast') {
      return {
        id: 'all',
        name: conv.title || '📢 General Staff Helpdesk & Broadcast',
        role: 'Broadcast Channel',
        code: 'ALL-STAFF',
        email: 'helpdesk@paneliya.com',
        designation: 'Paneliya Workforce Channel',
        initials: 'GS',
      };
    }

    // Direct 1-to-1 conversation
    // 1. Identify the non-admin participant ID in this conversation
    const nonAdminId = conv.participantIds?.find(
      (id) => id !== ADMIN_USER_ID && id !== 'user-1' && id !== 'admin-keyur' && id !== 'demo-admin-1'
    );

    // If current user is an employee chatting directly with admin
    const isDirectWithAdmin =
      portalMode === 'employee' &&
      (conv.id === `conv-${ADMIN_USER_ID}-${currentUserId}` ||
        (conv.participantIds?.includes(currentUserId) && conv.participantIds?.includes(ADMIN_USER_ID)));

    if (isDirectWithAdmin) {
      const adminName = conv.participantNames?.[ADMIN_USER_ID] || ADMIN_NAME || 'HR Administration';
      return {
        id: ADMIN_USER_ID,
        name: adminName.includes('(Admin)') ? adminName : `${adminName} (Admin)`,
        role: 'Admin',
        code: 'ADM-01',
        email: conv.participantEmails?.[ADMIN_USER_ID] || 'hr@paneliya.com',
        designation: 'Company HR & Management',
        initials: 'HR',
      };
    }

    // Identify target employee ID
    let targetId = nonAdminId;
    if (!targetId) {
      targetId = conv.participantIds?.find((id) => id !== currentUserId) || conv.participantIds?.[0] || '';
    }

    // Match with actual employee from directory
    const matchedEmp = employees.find(
      (e) =>
        e.id === targetId ||
        e.employeeCode === targetId ||
        (conv.id && conv.id.endsWith(e.id))
    );

    let name = '';
    let role = 'Staff Member';
    let code = 'EMP';
    let email = '';
    let designation = 'Staff Member';

    if (matchedEmp) {
      name = `${matchedEmp.firstName || ''} ${matchedEmp.lastName || ''}`.trim();
      code = matchedEmp.employeeCode || 'EMP';
      email = matchedEmp.email || '';
      designation = matchedEmp.designationTitle || 'Staff Member';
      role = 'Staff Member';
    } else if (targetId && conv.participantNames?.[targetId] && conv.participantNames[targetId] !== ADMIN_NAME) {
      name = conv.participantNames[targetId];
      code = conv.participantCodes?.[targetId] || 'EMP';
      email = conv.participantEmails?.[targetId] || '';
      designation = conv.participantDesignations?.[targetId] || 'Staff Member';
      role = conv.participantRoles?.[targetId] || 'Staff Member';
    } else if (conv.title && conv.title !== '📢 General Staff Helpdesk & Broadcast') {
      name = conv.title;
      code = conv.participantCodes?.[targetId] || 'EMP';
      email = conv.participantEmails?.[targetId] || '';
      designation = conv.participantDesignations?.[targetId] || 'Staff Member';
    } else {
      name = 'Staff Member';
    }

    const initials =
      name
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'ST';

    return { id: targetId || conv.id, name, role, code, email, designation, initials };
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !pendingAttachment) return;
    if (!activeConversation) return;

    const other = getOtherParticipantInfo(activeConversation);

    const sent = sendChatMessage({
      conversationId: activeConversation.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      recipientId: other.id,
      recipientName: other.name,
      content: inputText.trim(),
      attachments: pendingAttachment ? [pendingAttachment] : undefined,
    });

    // Persist on the server, then broadcast to the other person.
    api.saveChatMessage(sent).catch(() => {});
    emitChatMessage(sent);
    emitChatTyping({
      conversationId: activeConversation.id,
      userId: currentUserId,
      userName: currentUserName,
      isTyping: false,
    });

    setInputText('');
    setPendingAttachment(null);
    inputRef.current?.focus();
  };

  const handleQuickReply = (text: string) => {
    if (!activeConversation) return;
    const other = getOtherParticipantInfo(activeConversation);

    const sent = sendChatMessage({
      conversationId: activeConversation.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      recipientId: other.id,
      recipientName: other.name,
      content: text,
    });

    api.saveChatMessage(sent).catch(() => {});
    emitChatMessage(sent);
  };

  const handleOpenAttachFile = (accept: string) => {
    setFileInputAccept(accept);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleRealFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImg = file.type.startsWith('image/');
    const sizeKb = Math.round(file.size / 1024);
    const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

    setPendingAttachment({
      id: `att-${Date.now()}`,
      name: file.name,
      size: sizeStr,
      type: isImg ? 'image' : 'pdf',
    });
    e.target.value = '';
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
  };

  const handleSaveEdit = (messageId: string) => {
    if (!activeConversation) return;
    if (!editingText.trim()) return;

    const updated = editChatMessage(activeConversation.id, messageId, editingText, currentUserId);
    if (updated) {
      emitChatEdit({
        conversationId: activeConversation.id,
        messageId,
        content: editingText,
        isEdited: true,
        editedAt: updated.editedAt,
        editorUserId: currentUserId,
      });
    }
    setEditingMessageId(null);
    setEditingText('');
    setMessages(getMessagesForConversation(activeConversation.id));
  };

  const handleConfirmDelete = () => {
    if (!activeConversation || !deletingMessageId) return;

    const success = deleteChatMessage(activeConversation.id, deletingMessageId, currentUserId);
    if (success) {
      emitChatDelete({
        conversationId: activeConversation.id,
        messageId: deletingMessageId,
        deleterUserId: currentUserId,
      });
    }
    setDeletingMessageId(null);
    setMessages(getMessagesForConversation(activeConversation.id));
  };

  const handleClearActiveConversation = () => {
    if (!activeConversation) return;
    setCustomConfirmAction({
      title: 'Clear Conversation?',
      message: 'Are you sure you want to clear all messages in this conversation?',
      onConfirm: () => {
        clearConversationMessages(activeConversation.id);
        setMessages([]);
        loadConversations();
        setCustomConfirmAction(null);
      },
    });
  };

  const handleClearAllChats = () => {
    setCustomConfirmAction({
      title: 'Delete All Chat History?',
      message: 'Are you sure you want to delete all chat history across all conversations? This action cannot be undone.',
      onConfirm: () => {
        clearAllChats();
        setMessages([]);
        loadConversations();
        setCustomConfirmAction(null);
      },
    });
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (
      conv.id?.includes('admin-keyur') ||
      conv.participantIds?.includes('admin-keyur')
    ) {
      return false;
    }

    if (portalMode === 'employee') {
      const mine =
        conv.type === 'broadcast' ||
        conv.participantIds?.includes(currentUserId) ||
        conv.id === `conv-${ADMIN_USER_ID}-${currentUserId}`;
      if (!mine) return false;
    }

    if (filterTab === 'direct' && conv.type !== 'direct') return false;
    if (filterTab === 'broadcast' && conv.type !== 'broadcast') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const other = getOtherParticipantInfo(conv);
    return (
      other.name.toLowerCase().includes(q) ||
      other.code.toLowerCase().includes(q) ||
      other.designation.toLowerCase().includes(q) ||
      (conv.lastMessage && conv.lastMessage.toLowerCase().includes(q))
    );
  });

  const activeOtherInfo = activeConversation ? getOtherParticipantInfo(activeConversation) : null;

  // Format message time
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Quick reply options depending on portal mode
  const quickReplies =
    portalMode === 'admin'
      ? [
          'Please share your daily progress update.',
          'Approved, you may proceed.',
          'Regarding your leave request: please check your email.',
          'Acknowledged 👍',
        ]
      : [
          'Good morning sir, task completed.',
          'Please review my leave application.',
          'I have uploaded the verification document.',
          'Understood, thank you sir! 👍',
        ];

  const avatarClass = (kind: 'broadcast' | 'admin' | 'staff') =>
    kind === 'broadcast'
      ? 'bg-[#efe6d6] text-[#8a6a2f]'
      : kind === 'admin'
        ? 'bg-[#064e3b] text-white'
        : 'bg-[#d7f5e8] text-[#065f46]';

  return (
    <div className="bg-[#f0f2f5] rounded-2xl border border-[#d8e3dc] shadow-sm flex h-[calc(100vh-140px)] min-h-[580px] overflow-hidden">
      {/* LEFT COLUMN: Conversation List */}
      <div
        className={`w-full md:w-[340px] lg:w-[380px] border-r border-[#e4ebe7] flex flex-col bg-white shrink-0 ${
          mobileShowThread ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="px-4 py-3 bg-[#064e3b] text-white space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight">Chats</h2>
              <p className="text-[11px] text-emerald-100/80">
                {portalMode === 'admin' ? 'Staff messages' : 'HR and team'}
              </p>
            </div>
            <button
              type="button"
              id="btn-clear-all-chats"
              onClick={handleClearAllChats}
              className="p-2 rounded-full text-emerald-50 hover:bg-white/10 transition-colors"
              title="Clear all chat history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-100 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-conversations"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff, code, or messages..."
              className="w-full pl-9 pr-3 py-2 text-[13px] rounded-full border-0 bg-white/15 text-white placeholder:text-emerald-100/70 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            {([
              ['all', 'All'],
              ['direct', 'Direct'],
              ['broadcast', 'General'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilterTab(id)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  filterTab === id ? 'bg-white text-[#064e3b]' : 'bg-white/10 text-emerald-50 hover:bg-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto bg-white [scrollbar-width:thin]">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto stroke-1" />
              <p className="text-xs font-medium">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = getOtherParticipantInfo(conv);
              const isActive = conv.id === activeConversationId;
              const unread = incomingUnreadCount(conv.id, currentUserId);

              return (
                <button
                  key={conv.id}
                  id={`chat-conv-item-${conv.id}`}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setMobileShowThread(true);
                    markConversationAsRead(conv.id, currentUserId);
                  }}
                  className={`w-full text-left px-3 py-3 transition-colors flex items-center gap-3 border-b border-[#f1f5f3] ${
                    isActive ? 'bg-[#e7f6ef]' : 'hover:bg-[#f7fbf8]'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-xs ${avatarClass(
                        conv.type === 'broadcast' ? 'broadcast' : other.role === 'Admin' ? 'admin' : 'staff',
                      )}`}
                    >
                      {conv.type === 'broadcast' ? 'All' : other.initials}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[14px] font-medium text-[#111b21] truncate">
                        {other.name}
                      </span>
                      {conv.lastMessage ? (
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {formatTime(conv.lastMessageTimestamp)}
                        </span>
                      ) : null}
                    </div>

                    <p className={`text-[13px] truncate ${unread > 0 ? 'text-[#111b21] font-medium' : 'text-[#667781]'}`}>
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>

                  {unread > 0 && (
                    <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#25d366] text-white text-[11px] font-bold flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat Thread */}
      <div
        className={`flex-1 flex flex-col overflow-hidden ${
          mobileShowThread ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeConversation && activeOtherInfo ? (
          <>
            <div className="h-[60px] px-3 sm:px-4 bg-[#064e3b] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  id="btn-back-to-conversations"
                  onClick={() => setMobileShowThread(false)}
                  className="p-1.5 -ml-1 rounded-full text-white hover:bg-white/10 md:hidden"
                  title="Back to conversation list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs ${avatarClass(
                      activeConversation.type === 'broadcast' ? 'broadcast' : activeOtherInfo.role === 'Admin' ? 'admin' : 'staff',
                    )}`}
                  >
                    {activeConversation.type === 'broadcast' ? 'All' : activeOtherInfo.initials}
                  </div>
                </div>

                <div className="min-w-0">
                  <h3 className="text-[15px] font-medium truncate">{activeOtherInfo.name}</h3>
                  <p className="text-[11px] text-emerald-100/80 truncate">
                    {typingUser ? `${typingUser} is typing...` : activeOtherInfo.designation}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-clear-conversation-chat"
                onClick={handleClearActiveConversation}
                className="p-2 rounded-full text-emerald-50 hover:bg-white/10 transition-colors"
                title="Clear this chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div
              className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 space-y-1.5 [scrollbar-width:thin]"
              style={{ backgroundColor: '#efeae2', backgroundImage: 'radial-gradient(rgba(7,94,84,0.05) 0.6px, transparent 0.6px)', backgroundSize: '14px 14px' }}
            >
              <div className="flex items-center justify-center py-2">
                <span className="px-3 py-1 rounded-lg bg-white/80 text-[#54656f] text-[11px] shadow-sm">
                  Today
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 stroke-1 text-slate-300" />
                  <p className="text-xs font-medium text-slate-500">No messages yet in this conversation.</p>
                  <p className="text-[11px] text-slate-400">Say hello or share an update below.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe =
                    msg.senderId === currentUserId ||
                    msg.senderId === user?.id ||
                    msg.senderId === user?.employeeId ||
                    (portalMode === 'admin' && msg.senderId === ADMIN_USER_ID);
                  const canManage = isMe || currentUserRole === 'admin';
                  const isEditingThis = editingMessageId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`group flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && activeConversation.type === 'broadcast' && (
                        <span className="sr-only">{msg.senderName}</span>
                      )}

                      {/* Bubble Container with Action Buttons */}
                      <div className="relative group/bubble max-w-[85%] sm:max-w-md md:max-w-lg">
                        {/* Hover action menu for Edit & Delete */}
                        {canManage && !isEditingThis && (
                          <div
                            className={`absolute -top-3 z-10 flex items-center gap-1 p-0.5 rounded-lg bg-white border border-slate-200 shadow-md opacity-0 group-hover/bubble:opacity-100 transition-opacity ${
                              isMe ? 'right-2' : 'left-2'
                            }`}
                          >
                            <button
                              id={`btn-edit-msg-${msg.id}`}
                              type="button"
                              onClick={() => handleStartEdit(msg)}
                              className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Edit message"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              id={`btn-delete-msg-${msg.id}`}
                              type="button"
                              onClick={() => setDeletingMessageId(msg.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`px-2.5 py-1.5 shadow-sm ${
                            isMe
                              ? 'bg-[#d9fdd3] text-[#111b21] rounded-lg rounded-tr-none'
                              : 'bg-white text-[#111b21] rounded-lg rounded-tl-none'
                          }`}
                        >
                          {!isMe && (
                            <p className="text-[12px] font-semibold text-[#064e3b] leading-tight mb-0.5">
                              {msg.senderName}
                            </p>
                          )}
                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mb-2 space-y-1.5">
                              {msg.attachments.map((att) => (
                                <div
                                  key={att.id}
                                  className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium border ${
                                    isMe
                                      ? 'bg-white/10 border-white/20 text-white'
                                      : 'bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  {att.type === 'image' ? (
                                    <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold">{att.name}</p>
                                    <p className="text-[10px] opacity-75">{att.size}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Content or Edit Input */}
                          {isEditingThis ? (
                            <div className="space-y-2 mt-0.5">
                              <textarea
                                id={`input-edit-msg-${msg.id}`}
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveEdit(msg.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingMessageId(null);
                                  }
                                }}
                                rows={2}
                                className="w-full p-2 text-xs rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  id="btn-cancel-edit-msg"
                                  type="button"
                                  onClick={() => setEditingMessageId(null)}
                                  className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  id="btn-save-edit-msg"
                                  type="button"
                                  onClick={() => handleSaveEdit(msg.id)}
                                  className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-2xs transition-colors"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[14.5px] leading-snug whitespace-pre-wrap break-words pr-1">
                              {msg.content}
                            </p>
                          )}

                          <div className="flex items-center justify-end gap-1 -mb-0.5 mt-0.5 text-[11px] text-[#667781]">
                            {msg.isEdited && <span className="italic text-[10px]">edited</span>}
                            <span>{formatTime(msg.timestamp)}</span>
                            {isMe && (
                              <span title={msg.status === 'read' ? 'Read' : msg.status === 'delivered' ? 'Delivered' : 'Sent'}>
                                {msg.status === 'read' ? (
                                  <CheckCheck className="w-[16px] h-[16px] text-[#53bdeb] inline" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck className="w-[16px] h-[16px] text-[#667781] inline" />
                                ) : (
                                  <Check className="w-[15px] h-[15px] text-[#667781] inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Suggestions */}
            <div className="px-3 py-1.5 bg-[#efeae2] flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(reply)}
                  className="px-3 py-1 rounded-full bg-white text-[#064e3b] hover:bg-[#e7f6ef] text-[12px] whitespace-nowrap transition-colors shrink-0 shadow-sm"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Attachment preview if pending */}
            {pendingAttachment && (
              <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-medium text-slate-800">
                    Attached: {pendingAttachment.name} ({pendingAttachment.size})
                  </span>
                </div>
                <button
                  onClick={() => setPendingAttachment(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Real-time Remote Typing Indicator */}
            {typingUser && (
              <div className="px-4 py-1.5 text-[11px] font-medium text-indigo-700 bg-indigo-50/80 border-t border-indigo-100 flex items-center gap-2 animate-in fade-in duration-150">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                <span>✍️ {typingUser} is typing...</span>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="px-2 py-2 bg-[#f0f2f5] flex items-end gap-2"
            >
              {/* Hidden File Input for Real Attachments */}
              <input
                ref={fileInputRef}
                type="file"
                accept={fileInputAccept}
                onChange={handleRealFileChange}
                className="hidden"
              />

              {/* Attachment Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenAttachFile('.pdf,.doc,.docx,.txt')}
                  className="p-2 rounded-full text-[#54656f] hover:bg-black/5 transition-colors"
                  title="Attach Document"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAttachFile('image/*')}
                  className="p-2 rounded-full text-[#54656f] hover:bg-black/5 transition-colors hidden sm:block"
                  title="Attach Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Text Input */}
              <input
                ref={inputRef}
                id="input-chat-message"
                type="text"
                value={inputText}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputText(val);
                  if (activeConversation) {
                    emitChatTyping({
                      conversationId: activeConversation.id,
                      userId: currentUserId,
                      userName: currentUserName,
                      isTyping: val.length > 0,
                    });
                  }
                }}
                placeholder="Type a message"
                className="flex-1 py-2.5 px-4 text-[14px] rounded-full border-0 bg-white text-[#111b21] placeholder:text-[#667781] focus:outline-none"
              />

              <button
                id="btn-send-chat-message"
                type="submit"
                disabled={!inputText.trim() && !pendingAttachment}
                className="w-11 h-11 rounded-full bg-[#064e3b] hover:bg-[#05392c] text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 stroke-1" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Select a conversation</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Choose an employee from the roster on the left to start direct messaging or join the general channel.
            </p>
          </div>
        )}
      </div>

      {/* Delete Message In-App Confirmation Modal */}
      {deletingMessageId && (
        <div
          id="delete-message-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingMessageId(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Message?</h3>
                <p className="text-xs text-slate-500">Remove from conversation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this message for everyone in this conversation?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                id="btn-cancel-delete-msg"
                type="button"
                onClick={() => setDeletingMessageId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-msg"
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {customConfirmAction && (
        <div
          id="custom-confirm-chat-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCustomConfirmAction(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{customConfirmAction.title}</h3>
                <p className="text-xs text-slate-500">Action confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {customConfirmAction.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCustomConfirmAction(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={customConfirmAction.onConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
