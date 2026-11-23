type UnreadMap = Record<string, number>;
type Listener = (counts: UnreadMap) => void;

let counts: UnreadMap = {};
const listeners = new Set<Listener>();

function publish() {
  const next = { ...counts };
  listeners.forEach((listener) => listener(next));
}

export function subscribeChatUnread(listener: Listener) {
  listeners.add(listener);
  listener({ ...counts });
  return () => {
    listeners.delete(listener);
  };
}

export function addChatUnread(conversationId: string) {
  if (!conversationId) return;
  counts = { ...counts, [conversationId]: (counts[conversationId] || 0) + 1 };
  publish();
}

export function clearChatUnread(conversationId: string) {
  if (!conversationId || !counts[conversationId]) return;
  const next = { ...counts };
  delete next[conversationId];
  counts = next;
  publish();
}
