import { ChatMessage, ChatConversation, ChatAttachment, User, Employee } from '../types/hrms';
import { getAllEmployees } from './employeeService';

const CHAT_CONVERSATIONS_KEY = 'hrms_chat_conversations_records';
const CHAT_MESSAGES_KEY = 'hrms_chat_messages_records';

export const ADMIN_USER_ID = 'company-admin';
export const ADMIN_NAME = 'HR Administration';
export const ADMIN_ROLE = 'admin' as const;

// Seed initial clean conversations (with no mock messages)
function getDefaultConversations(): ChatConversation[] {
  return [
    {
      id: 'conv-general',
      type: 'broadcast',
      participantIds: ['all'],
      participantNames: { all: 'All Staff & Management' },
      title: '📢 General Staff Helpdesk & Broadcast',
      lastMessage: '',
      lastMessageTimestamp: new Date().toISOString(),
      lastSenderId: ADMIN_USER_ID,
      unreadCount: {},
      updatedAt: new Date().toISOString(),
    },
  ];
}

// Default messages map is completely empty
function getDefaultMessages(): Record<string, ChatMessage[]> {
  return {};
}

// Auto-purge old seeded mock chat messages
if (typeof window !== 'undefined') {
  try {
    const PURGE_KEY = 'hrms_chat_all_messages_purged_v10';
    if (localStorage.getItem(PURGE_KEY) !== 'true') {
      localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify({}));
      const rawConvs = localStorage.getItem(CHAT_CONVERSATIONS_KEY);
      if (rawConvs) {
        try {
          const parsed = JSON.parse(rawConvs);
          if (Array.isArray(parsed)) {
            const cleared = parsed
              .filter(
                (c: any) =>
                  !c.id?.includes('keyur') &&
                  !c.participantIds?.includes('admin-keyur')
              )
              .map((c: any) => ({
                ...c,
                lastMessage: '',
                unreadCount: {},
              }));
            localStorage.setItem(CHAT_CONVERSATIONS_KEY, JSON.stringify(cleared.length > 0 ? cleared : getDefaultConversations()));
          }
        } catch {}
      }
      localStorage.setItem(PURGE_KEY, 'true');
    }
  } catch {}
}

export function getAllConversations(): ChatConversation[] {
  if (typeof window === 'undefined') return getDefaultConversations();
  try {
    const raw = localStorage.getItem(CHAT_CONVERSATIONS_KEY);
    if (!raw) {
      const initial = getDefaultConversations();
      localStorage.setItem(CHAT_CONVERSATIONS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const clean = parsed.filter(
        (c: ChatConversation) =>
          c.id !== 'conv-user-1-emp-2' &&
          c.id !== 'conv-user-1-emp-3' &&
          !c.id?.includes('admin-keyur') &&
          !c.participantIds?.includes('admin-keyur') &&
          !c.participantIds?.includes('emp-2') &&
          !c.participantIds?.includes('emp-3')
      );
      return clean.length > 0 ? clean : getDefaultConversations();
    }
    return getDefaultConversations();
  } catch (e) {
    console.error('Failed to parse chat conversations:', e);
    return getDefaultConversations();
  }
}

export function saveConversations(conversations: ChatConversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_CONVERSATIONS_KEY, JSON.stringify(conversations));
    window.dispatchEvent(new CustomEvent('hrms_chat_updated'));
  } catch (e) {
    console.error('Failed to save chat conversations:', e);
  }
}

export function getAllMessagesMap(): Record<string, ChatMessage[]> {
  if (typeof window === 'undefined') return getDefaultMessages();
  try {
    const raw = localStorage.getItem(CHAT_MESSAGES_KEY);
    if (!raw) {
      const initial = getDefaultMessages();
      localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(initial));
      return initial;
    }
    const map = JSON.parse(raw);
    delete map['conv-user-1-emp-2'];
    delete map['conv-user-1-emp-3'];
    return map;
  } catch (e) {
    console.error('Failed to parse chat messages:', e);
    return getDefaultMessages();
  }
}

export function saveMessagesMap(messagesMap: Record<string, ChatMessage[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messagesMap));
    window.dispatchEvent(new CustomEvent('hrms_chat_updated'));
  } catch (e) {
    console.error('Failed to save chat messages:', e);
  }
}

export function getMessagesForConversation(conversationId: string): ChatMessage[] {
  const map = getAllMessagesMap();
  return map[conversationId] || [];
}

/**
 * Returns or creates a direct conversation between Company Admin and a given Employee.
 */
export function getOrCreateDirectConversation(employee: Employee): ChatConversation {
  if (
    employee.id === 'admin-keyur' ||
    employee.email?.toLowerCase().includes('keyur')
  ) {
    const all = getAllConversations();
    return all[0] || getDefaultConversations()[0];
  }

  const conversations = getAllConversations();
  const convId = `conv-${ADMIN_USER_ID}-${employee.id}`;
  const empFullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Staff Member';

  const existing = conversations.find((c) => c.id === convId);
  if (existing) {
    if (existing.participantNames?.[employee.id] !== empFullName || existing.title !== empFullName) {
      existing.title = empFullName;
      existing.participantNames = {
        ...existing.participantNames,
        [ADMIN_USER_ID]: ADMIN_NAME,
        [employee.id]: empFullName,
      };
      saveConversations(conversations);
    }
    return existing;
  }

  const newConv: ChatConversation = {
    id: convId,
    type: 'direct',
    title: empFullName,
    participantIds: [ADMIN_USER_ID, employee.id],
    participantNames: {
      [ADMIN_USER_ID]: ADMIN_NAME,
      [employee.id]: empFullName,
    },
    participantRoles: {
      [ADMIN_USER_ID]: 'admin',
      [employee.id]: 'employee',
    },
    participantCodes: {
      [ADMIN_USER_ID]: 'ADM-01',
      [employee.id]: employee.employeeCode,
    },
    participantEmails: {
      [ADMIN_USER_ID]: 'hr@paneliya.com',
      [employee.id]: employee.email,
    },
    participantDesignations: {
      [ADMIN_USER_ID]: 'Company HR & Management',
      [employee.id]: employee.designationTitle || 'Staff Member',
    },
    lastMessage: '',
    lastMessageTimestamp: new Date().toISOString(),
    lastSenderId: ADMIN_USER_ID,
    unreadCount: { [ADMIN_USER_ID]: 0, [employee.id]: 0 },
    updatedAt: new Date().toISOString(),
  };

  const updated = [newConv, ...conversations];
  saveConversations(updated);
  return newConv;
}

/**
 * Ensures conversations exist for all current employees in the system with distinct names.
 */
export function syncConversationsWithEmployees(employees?: Employee[]): ChatConversation[] {
  const currentEmployees = employees && employees.length > 0 ? employees : getAllEmployees();
  const conversations = getAllConversations();
  let modified = false;

  currentEmployees.forEach((emp) => {
    if (
      emp.id === 'emp-1' ||
      emp.id === 'admin-keyur' ||
      emp.email?.toLowerCase().includes('keyur')
    ) {
      return;
    }

    const convId = `conv-${ADMIN_USER_ID}-${emp.id}`;
    const empFullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Staff Member';
    const convIndex = conversations.findIndex((c) => c.id === convId);

    if (convIndex === -1) {
      conversations.push({
        id: convId,
        type: 'direct',
        title: empFullName,
        participantIds: [ADMIN_USER_ID, emp.id],
        participantNames: {
          [ADMIN_USER_ID]: ADMIN_NAME,
          [emp.id]: empFullName,
        },
        participantRoles: {
          [ADMIN_USER_ID]: 'admin',
          [emp.id]: 'employee',
        },
        participantCodes: {
          [ADMIN_USER_ID]: 'ADM-01',
          [emp.id]: emp.employeeCode || 'EMP',
        },
        participantEmails: {
          [ADMIN_USER_ID]: 'hr@paneliya.com',
          [emp.id]: emp.email || '',
        },
        participantDesignations: {
          [ADMIN_USER_ID]: 'Company HR & Management',
          [emp.id]: emp.designationTitle || 'Staff Member',
        },
        lastMessage: '',
        lastMessageTimestamp: new Date().toISOString(),
        lastSenderId: ADMIN_USER_ID,
        unreadCount: { [ADMIN_USER_ID]: 0, [emp.id]: 0 },
        updatedAt: new Date().toISOString(),
      });
      modified = true;
    } else {
      // Re-synchronize name if missing or outdated
      const existing = conversations[convIndex];
      if (
        existing.participantNames?.[emp.id] !== empFullName ||
        existing.title !== empFullName
      ) {
        conversations[convIndex] = {
          ...existing,
          title: empFullName,
          participantNames: {
            ...existing.participantNames,
            [ADMIN_USER_ID]: ADMIN_NAME,
            [emp.id]: empFullName,
          },
          participantCodes: {
            ...existing.participantCodes,
            [emp.id]: emp.employeeCode || existing.participantCodes?.[emp.id] || 'EMP',
          },
          participantEmails: {
            ...existing.participantEmails,
            [emp.id]: emp.email || existing.participantEmails?.[emp.id] || '',
          },
          participantDesignations: {
            ...existing.participantDesignations,
            [emp.id]: emp.designationTitle || existing.participantDesignations?.[emp.id] || 'Staff Member',
          },
        };
        modified = true;
      }
    }
  });

  if (modified) {
    saveConversations(conversations);
  }

  return conversations;
}

/**
 * Sends a message in a conversation.
 */
export function sendChatMessage(params: {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'employee';
  recipientId: string;
  recipientName: string;
  content: string;
  attachments?: ChatAttachment[];
}): ChatMessage {
  const {
    conversationId,
    senderId,
    senderName,
    senderRole,
    recipientId,
    recipientName,
    content,
    attachments,
  } = params;

  const now = new Date().toISOString();
  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    conversationId,
    senderId,
    senderName,
    senderRole,
    recipientId,
    recipientName,
    content: content.trim(),
    timestamp: now,
    status: 'delivered',
    attachments,
  };

  // 1. Append message
  const messagesMap = getAllMessagesMap();
  const currentMessages = messagesMap[conversationId] || [];
  messagesMap[conversationId] = [...currentMessages, newMessage];
  saveMessagesMap(messagesMap);

  // 2. Update conversation meta
  const conversations = getAllConversations();
  const convIndex = conversations.findIndex((c) => c.id === conversationId);

  if (convIndex !== -1) {
    const conv = { ...conversations[convIndex] };
    conv.lastMessage = newMessage.content || (attachments?.length ? 'Sent an attachment' : '');
    conv.lastMessageTimestamp = now;
    conv.lastSenderId = senderId;
    conv.updatedAt = now;

    // Increment unread count for recipients
    const unread = { ...(conv.unreadCount || {}) };
    if (conv.type === 'broadcast') {
      // unread for everyone except sender
    } else {
      const otherParticipantId = conv.participantIds.find((id) => id !== senderId) || recipientId;
      unread[otherParticipantId] = (unread[otherParticipantId] || 0) + 1;
    }
    conv.unreadCount = unread;

    // Move this conversation to top
    conversations.splice(convIndex, 1);
    conversations.unshift(conv);
    saveConversations(conversations);
  }

  return newMessage;
}

/**
 * Marks conversation as read for a given user.
 */
export function markConversationAsRead(conversationId: string, currentUserId: string): void {
  const conversations = getAllConversations();
  const convIndex = conversations.findIndex((c) => c.id === conversationId);

  if (convIndex !== -1) {
    const conv = { ...conversations[convIndex] };
    if (conv.unreadCount && conv.unreadCount[currentUserId]) {
      conv.unreadCount = {
        ...conv.unreadCount,
        [currentUserId]: 0,
      };
      conversations[convIndex] = conv;
      saveConversations(conversations);
    }
  }

  // Also update status of messages to 'read'
  const messagesMap = getAllMessagesMap();
  const messages = messagesMap[conversationId] || [];
  let updated = false;
  const updatedMessages = messages.map((m) => {
    if (m.senderId !== currentUserId && m.status !== 'read') {
      updated = true;
      return { ...m, status: 'read' as const };
    }
    return m;
  });

  if (updated) {
    messagesMap[conversationId] = updatedMessages;
    saveMessagesMap(messagesMap);
  }
}

/**
 * Returns total unread messages count for a user.
 */
export function getTotalUnreadChatCount(currentUserId: string): number {
  const conversations = getAllConversations();
  return conversations.reduce((total, conv) => {
    const count = conv.unreadCount?.[currentUserId] || 0;
    return total + count;
  }, 0);
}

/**
 * Edits an existing message in a conversation.
 */
export function editChatMessage(
  conversationId: string,
  messageId: string,
  newContent: string,
  editorUserId: string
): ChatMessage | null {
  const messagesMap = getAllMessagesMap();
  const messages = messagesMap[conversationId] || [];
  const msgIndex = messages.findIndex((m) => m.id === messageId);

  if (msgIndex === -1) return null;

  const msg = messages[msgIndex];
  // Only sender or admin can edit
  if (msg.senderId !== editorUserId && editorUserId !== ADMIN_USER_ID) {
    return null;
  }

  const updatedMessage: ChatMessage = {
    ...msg,
    content: newContent.trim(),
    isEdited: true,
    editedAt: new Date().toISOString(),
  };

  messages[msgIndex] = updatedMessage;
  messagesMap[conversationId] = [...messages];
  saveMessagesMap(messagesMap);

  // If this was the last message in conversation, update conversation preview
  if (msgIndex === messages.length - 1) {
    const conversations = getAllConversations();
    const convIndex = conversations.findIndex((c) => c.id === conversationId);
    if (convIndex !== -1) {
      conversations[convIndex].lastMessage = newContent.trim();
      conversations[convIndex].updatedAt = new Date().toISOString();
      saveConversations(conversations);
    }
  }

  return updatedMessage;
}

/**
 * Deletes a message from a conversation.
 */
export function deleteChatMessage(
  conversationId: string,
  messageId: string,
  deleterUserId: string
): boolean {
  const messagesMap = getAllMessagesMap();
  const messages = messagesMap[conversationId] || [];
  const msgIndex = messages.findIndex((m) => m.id === messageId);

  if (msgIndex === -1) return false;

  const msg = messages[msgIndex];
  // Only sender or admin can delete
  if (msg.senderId !== deleterUserId && deleterUserId !== ADMIN_USER_ID) {
    return false;
  }

  // Remove the message
  messages.splice(msgIndex, 1);
  messagesMap[conversationId] = [...messages];
  saveMessagesMap(messagesMap);

  // Update conversation lastMessage preview
  const conversations = getAllConversations();
  const convIndex = conversations.findIndex((c) => c.id === conversationId);
  if (convIndex !== -1) {
    const remaining = messages;
    if (remaining.length > 0) {
      const last = remaining[remaining.length - 1];
      conversations[convIndex].lastMessage = last.content || (last.attachments?.length ? 'Sent an attachment' : '');
      conversations[convIndex].lastMessageTimestamp = last.timestamp;
      conversations[convIndex].lastSenderId = last.senderId;
    } else {
      conversations[convIndex].lastMessage = '';
      conversations[convIndex].lastMessageTimestamp = conversations[convIndex].updatedAt;
    }
    saveConversations(conversations);
  }

  return true;
}

/**
 * Receives an incoming message broadcast from WebSocket Gateway.
 */
export function receiveIncomingSocketMessage(newMessage: ChatMessage, currentUserId?: string): void {
  if (!newMessage || !newMessage.conversationId || !newMessage.id) return;

  const messagesMap = getAllMessagesMap();
  const currentMessages = messagesMap[newMessage.conversationId] || [];

  // Deduplicate: if message with this ID already exists, don't append again
  const exists = currentMessages.some((m) => m.id === newMessage.id);
  if (exists) return;

  messagesMap[newMessage.conversationId] = [...currentMessages, newMessage];
  saveMessagesMap(messagesMap);

  // Update conversation meta
  const conversations = getAllConversations();
  const convIndex = conversations.findIndex((c) => c.id === newMessage.conversationId);
  const now = newMessage.timestamp || new Date().toISOString();

  if (convIndex !== -1) {
    const conv = { ...conversations[convIndex] };
    conv.lastMessage = newMessage.content || (newMessage.attachments?.length ? 'Sent an attachment' : '');
    conv.lastMessageTimestamp = now;
    conv.lastSenderId = newMessage.senderId;
    conv.updatedAt = now;

    // Increment unread count if current user is not the sender
    if (currentUserId && newMessage.senderId !== currentUserId) {
      const unread = { ...(conv.unreadCount || {}) };
      unread[currentUserId] = (unread[currentUserId] || 0) + 1;
      conv.unreadCount = unread;
    }

    conversations.splice(convIndex, 1);
    conversations.unshift(conv);
    saveConversations(conversations);
  }
}

/**
 * Handles message edited event from WebSocket Gateway.
 */
export function receiveIncomingSocketEdit(payload: {
  conversationId: string;
  messageId: string;
  content: string;
  isEdited?: boolean;
  editedAt?: string;
}): void {
  if (!payload || !payload.conversationId || !payload.messageId) return;

  const messagesMap = getAllMessagesMap();
  const messages = messagesMap[payload.conversationId] || [];
  const msgIndex = messages.findIndex((m) => m.id === payload.messageId);

  if (msgIndex !== -1) {
    messages[msgIndex] = {
      ...messages[msgIndex],
      content: payload.content,
      isEdited: true,
      editedAt: payload.editedAt || new Date().toISOString(),
    };
    messagesMap[payload.conversationId] = [...messages];
    saveMessagesMap(messagesMap);

    if (msgIndex === messages.length - 1) {
      const conversations = getAllConversations();
      const convIndex = conversations.findIndex((c) => c.id === payload.conversationId);
      if (convIndex !== -1) {
        conversations[convIndex].lastMessage = payload.content;
        conversations[convIndex].updatedAt = new Date().toISOString();
        saveConversations(conversations);
      }
    }
  }
}

/**
 * Handles message deleted event from WebSocket Gateway.
 */
export function receiveIncomingSocketDelete(payload: {
  conversationId: string;
  messageId: string;
}): void {
  if (!payload || !payload.conversationId || !payload.messageId) return;

  const messagesMap = getAllMessagesMap();
  const messages = messagesMap[payload.conversationId] || [];
  const msgIndex = messages.findIndex((m) => m.id === payload.messageId);

  if (msgIndex !== -1) {
    messages.splice(msgIndex, 1);
    messagesMap[payload.conversationId] = [...messages];
    saveMessagesMap(messagesMap);

    const conversations = getAllConversations();
    const convIndex = conversations.findIndex((c) => c.id === payload.conversationId);
    if (convIndex !== -1) {
      if (messages.length > 0) {
        const last = messages[messages.length - 1];
        conversations[convIndex].lastMessage = last.content || (last.attachments?.length ? 'Sent an attachment' : '');
        conversations[convIndex].lastMessageTimestamp = last.timestamp;
      } else {
        conversations[convIndex].lastMessage = '';
      }
      saveConversations(conversations);
    }
  }
}

/**
 * Clears all messages in a specific conversation.
 */
export function clearConversationMessages(conversationId: string): void {
  const messagesMap = getAllMessagesMap();
  delete messagesMap[conversationId];
  saveMessagesMap(messagesMap);

  const conversations = getAllConversations();
  const convIndex = conversations.findIndex((c) => c.id === conversationId);
  if (convIndex !== -1) {
    conversations[convIndex].lastMessage = '';
    conversations[convIndex].unreadCount = {};
    saveConversations(conversations);
  }
}

/**
 * Clears ALL messages across all conversations and resets all message counters.
 */
export function clearAllChats(): void {
  saveMessagesMap({});

  const conversations = getAllConversations();
  const cleared = conversations.map((c) => ({
    ...c,
    lastMessage: '',
    unreadCount: {},
    lastMessageTimestamp: new Date().toISOString(),
  }));
  saveConversations(cleared);
}
