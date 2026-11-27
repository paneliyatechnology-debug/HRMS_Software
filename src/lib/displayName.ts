function isEmailLike(value?: string): boolean {
  return !!value && value.includes('@');
}

function isSecretLike(value?: string): boolean {
  const text = (value || '').trim();
  if (!text) return false;
  if (isEmailLike(text)) return false;
  return /[@#$%]|pass|pwd|\d{2,}/i.test(text) && !/^[A-Za-z][A-Za-z .'-]{1,}$/.test(text);
}

function fromEmail(email?: string): string {
  const local = (email || '').split('@')[0] || '';
  const words = local.replace(/\d+/g, ' ').replace(/[._-]+/g, ' ').trim();
  if (!words) return 'Employee';
  return words.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function readablePersonName(first?: string, last?: string, email?: string): string {
  const safeFirst = first && !isEmailLike(first) && !isSecretLike(first) ? first.trim() : '';
  const safeLast = last && !isEmailLike(last) && !isSecretLike(last) ? last.trim() : '';
  if (safeFirst || safeLast) return `${safeFirst} ${safeLast}`.trim();
  return fromEmail(email || first);
}

export function readableInitials(first?: string, last?: string, email?: string): string {
  const parts = readablePersonName(first, last, email).split(/\s+/).filter(Boolean);
  const firstLetter = parts[0]?.[0] || 'E';
  const secondLetter = parts[1]?.[0] || '';
  return `${firstLetter}${secondLetter}`.toUpperCase();
}
