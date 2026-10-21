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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Employee, ChatConversation, ChatMessage, ChatAttachment } from '../../types/hrms';
import {
  getAllConversations,
  getMessagesForConversation,
  sendChatMessage,
  markConversationAsRead,
  syncConversationsWithEmployees,
  ADMIN_USER_ID,
  ADMIN_NAME,
} from '../../lib/chatService';

interface ChatModuleProps {
  employees?: Employee[];
  initialEmployeeId?: string | null;
  onClearInitialEmployee?: () => void;
}

export const ChatModule: React.FC<ChatModuleProps> = ({
  employees = [],
  initialEmployeeId,
  onClearInitialEmployee,
}) => {
  const { user, portalMode } = useAuth();

  // Determine current user chat identity
  const currentUserId = portalMode === 'admin' ? ADMIN_USER_ID : user.employeeId || user.id || 'emp-2';
  const currentUserName = portalMode === 'admin' ? ADMIN_NAME : `${user.firstName || 'Staff'} ${user.lastName || 'Member'}`.trim();
  const currentUserRole = portalMode === 'admin' ? ('admin' as const) : ('employee' as const);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'direct' | 'broadcast'>('all');
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load and sync conversations
  const loadConversations = () => {
    const list = syncConversationsWithEmployees(employees);
    setConversations([...list]);
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

  // Handle initial targeted employee chat from directory or dashboard
  useEffect(() => {
    if (initialEmployeeId) {
      const targetConvId = `conv-user-1-${initialEmployeeId}`;
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

  // If active conversation not in list or not set, pick the first sensible conversation
  useEffect(() => {
    if (conversations.length > 0 && !conversations.some((c) => c.id === activeConversationId)) {
      if (portalMode === 'employee') {
        // Employees usually want to talk to Admin first
        const adminConv = conversations.find((c) => c.id === `conv-user-1-${currentUserId}`);
        setActiveConversationId(adminConv ? adminConv.id : conversations[0].id);
      } else {
        setActiveConversationId(conversations[0].id);
      }
    }
  }, [conversations, activeConversationId, portalMode, currentUserId]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) return;
    const msgs = getMessagesForConversation(activeConversationId);
    setMessages(msgs);
    markConversationAsRead(activeConversationId, currentUserId);
  }, [activeConversationId, currentUserId]);

  // Listen to message updates
  useEffect(() => {
    const handleMessageUpdate = () => {
      if (activeConversationId) {
        const msgs = getMessagesForConversation(activeConversationId);
        setMessages(msgs);
      }
    };
    window.addEventListener('hrms_chat_updated', handleMessageUpdate);
    return () => {
      window.removeEventListener('hrms_chat_updated', handleMessageUpdate);
    };
  }, [activeConversationId]);

  // Auto-scroll to bottom of thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Helper to determine the other participant's details in a 1-to-1 chat
  const getOtherParticipantInfo = (conv: ChatConversation) => {
    if (conv.type === 'broadcast') {
      return {
        id: 'all',
        name: conv.title || 'General Staff Helpdesk',
        role: 'Broadcast Channel',
        code: 'ALL-STAFF',
        email: 'helpdesk@paneliya.com',
        designation: 'Paneliya Workforce Channel',
        initials: 'GS',
      };
    }

    if (portalMode === 'admin') {
      // The other participant is the employee
      const empId = conv.participantIds.find((id) => id !== ADMIN_USER_ID) || 'emp-2';
      const name = conv.participantNames[empId] || 'Staff Member';
      const code = conv.participantCodes?.[empId] || 'EMP';
      const email = conv.participantEmails?.[empId] || '';
      const designation = conv.participantDesignations?.[empId] || 'Employee';
      const initials = name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      return { id: empId, name, role: 'Staff Member', code, email, designation, initials };
    } else {
      // The other participant is typically Admin
      const otherId = conv.participantIds.find((id) => id !== currentUserId) || ADMIN_USER_ID;
      const isOtherAdmin = otherId === ADMIN_USER_ID;
      const name = conv.participantNames[otherId] || (isOtherAdmin ? 'Keyur Sangani (Admin)' : 'Colleague');
      const code = isOtherAdmin ? 'ADMIN' : conv.participantCodes?.[otherId] || 'STAFF';
      const email = conv.participantEmails?.[otherId] || 'admin@paneliya.com';
      const designation = isOtherAdmin ? 'Super Administrator & HR' : conv.participantDesignations?.[otherId] || 'Staff';
      const initials = name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      return { id: otherId, name, role: isOtherAdmin ? 'Admin' : 'Staff', code, email, designation, initials };
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !pendingAttachment) return;
    if (!activeConversation) return;

    const other = getOtherParticipantInfo(activeConversation);

    sendChatMessage({
      conversationId: activeConversation.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      recipientId: other.id,
      recipientName: other.name,
      content: inputText.trim(),
      attachments: pendingAttachment ? [pendingAttachment] : undefined,
    });

    setInputText('');
    setPendingAttachment(null);
    inputRef.current?.focus();
  };

  const handleQuickReply = (text: string) => {
    if (!activeConversation) return;
    const other = getOtherParticipantInfo(activeConversation);

    sendChatMessage({
      conversationId: activeConversation.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      recipientId: other.id,
      recipientName: other.name,
      content: text,
    });
  };

  const handleAddSampleAttachment = (type: 'document' | 'image') => {
    if (type === 'document') {
      setPendingAttachment({
        id: `att-${Date.now()}`,
        name: 'Sprint_Work_Report.pdf',
        size: '1.4 MB',
        type: 'pdf',
      });
    } else {
      setPendingAttachment({
        id: `att-${Date.now()}`,
        name: 'Architecture_Diagram.png',
        size: '850 KB',
        type: 'image',
      });
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex h-[calc(100vh-140px)] min-h-[580px] overflow-hidden select-none">
      {/* LEFT COLUMN: Conversation List */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 shrink-0 ${
          mobileShowThread ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Team Chat</h2>
                <p className="text-[11px] text-slate-500">
                  {portalMode === 'admin' ? 'Admin Staff Communication' : 'Direct HR & Peer Messages'}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {conversations.length} chats
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-conversations"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff, code, or messages..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
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
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterTab === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterTab('direct')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterTab === 'direct'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              1-on-1 Staff
            </button>
            <button
              onClick={() => setFilterTab('broadcast')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterTab === 'broadcast'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              General Channel
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 [scrollbar-width:thin]">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto stroke-1" />
              <p className="text-xs font-medium">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = getOtherParticipantInfo(conv);
              const isActive = conv.id === activeConversationId;
              const unread = conv.unreadCount?.[currentUserId] || 0;

              return (
                <button
                  key={conv.id}
                  id={`chat-conv-item-${conv.id}`}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setMobileShowThread(true);
                  }}
                  className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 relative ${
                    isActive
                      ? 'bg-white border-l-4 border-slate-900 shadow-xs'
                      : 'hover:bg-white/80'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        conv.type === 'broadcast'
                          ? 'bg-amber-100 text-amber-800'
                          : other.role === 'Admin'
                          ? 'bg-slate-900 text-white'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {conv.type === 'broadcast' ? '📢' : other.initials}
                    </div>
                    {/* Online indicator */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                        {other.name}
                        {other.role === 'Admin' && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-900 text-white text-[9px] font-semibold">
                            Admin
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {formatTime(conv.lastMessageTimestamp)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mb-1">
                      {other.code} • {other.designation}
                    </p>

                    <p
                      className={`text-xs truncate ${
                        unread > 0 ? 'font-bold text-slate-900' : 'text-slate-500 font-normal'
                      }`}
                    >
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {unread > 0 && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
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
        className={`flex-1 flex flex-col bg-slate-50/30 overflow-hidden ${
          mobileShowThread ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeConversation && activeOtherInfo ? (
          <>
            {/* Thread Header */}
            <div className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  id="btn-back-to-conversations"
                  onClick={() => setMobileShowThread(false)}
                  className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden"
                  title="Back to conversation list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                      activeConversation.type === 'broadcast'
                        ? 'bg-amber-100 text-amber-800'
                        : activeOtherInfo.role === 'Admin'
                        ? 'bg-slate-900 text-white'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {activeConversation.type === 'broadcast' ? '📢' : activeOtherInfo.initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                {/* Recipient Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {activeOtherInfo.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active now
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {activeOtherInfo.code} • {activeOtherInfo.designation}
                    {activeOtherInfo.email && ` (${activeOtherInfo.email})`}
                  </p>
                </div>
              </div>

              {/* Status / Channel pill */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/60">
                  {activeConversation.type === 'broadcast' ? 'All Staff Group' : 'Direct Encrypted Chat'}
                </span>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [scrollbar-width:thin]">
              {/* Day divider */}
              <div className="flex items-center justify-center">
                <span className="px-3 py-1 rounded-full bg-slate-200/70 text-slate-600 text-[11px] font-medium">
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
                  const isMe = msg.senderId === currentUserId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      {/* Sender label for incoming */}
                      {!isMe && (
                        <div className="flex items-center gap-1.5 ml-1">
                          <span className="text-[11px] font-bold text-slate-700">
                            {msg.senderName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({msg.senderRole === 'admin' ? 'Administrator' : 'Staff'})
                          </span>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-md md:max-w-lg p-3.5 rounded-2xl shadow-xs transition-all ${
                          isMe
                            ? 'bg-slate-900 text-white rounded-tr-xs'
                            : 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs'
                        }`}
                      >
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

                        {/* Content text */}
                        <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>

                        {/* Timestamp & Status */}
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isMe ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          <span>{formatTime(msg.timestamp)}</span>
                          {isMe && (
                            <span>
                              {msg.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-400 inline" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Suggestions */}
            <div className="px-4 py-2 bg-slate-100/60 border-t border-slate-200 flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
              <span className="text-[10px] font-semibold text-slate-400 shrink-0 uppercase tracking-wider">
                Quick:
              </span>
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(reply)}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs whitespace-nowrap transition-colors shrink-0 shadow-2xs"
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

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              {/* Attachment Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAddSampleAttachment('document')}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Attach Document"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSampleAttachment('image')}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors hidden sm:block"
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
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeOtherInfo.name}... (Press Enter to send)`}
                className="flex-1 py-2.5 px-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              />

              {/* Send Button */}
              <button
                id="btn-send-chat-message"
                type="submit"
                disabled={!inputText.trim() && !pendingAttachment}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
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
    </div>
  );
};
