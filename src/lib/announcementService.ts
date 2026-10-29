import { Announcement } from '../types/hrms';

const ANNOUNCEMENTS_STORAGE_KEY = 'hrms_announcements_records';

const defaultAnnouncements: Announcement[] = [];

/**
 * Retrieve all notices/announcements
 */
export function getAllAnnouncements(): Announcement[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((a: Announcement) => !['anc-1', 'anc-2', 'anc-3'].includes(a.id));
        return clean;
      }
    }
    return [];
  } catch (err) {
    console.error('Failed to load announcements:', err);
    return [];
  }
}

/**
 * Persist announcements to storage and notify listeners
 */
export function saveAnnouncements(announcements: Announcement[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    window.dispatchEvent(new Event('hrms_announcements_updated'));
  } catch (err) {
    console.error('Failed to save announcements:', err);
  }
}

/**
 * Send a new notice (Broadcast to All, or Specific to an Individual Employee)
 */
export function sendNotice(data: {
  title: string;
  content: string;
  targetAudience: 'All' | 'Department' | 'Individual';
  targetEmployeeId?: string;
  targetEmployeeName?: string;
  departmentName?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  authorName?: string;
  authorRole?: string;
}): Announcement {
  const all = getAllAnnouncements();
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const newNotice: Announcement = {
    id: `notice-${Date.now()}`,
    title: data.title,
    content: data.content,
    publishDate: dateStr,
    targetAudience: data.targetAudience,
    targetEmployeeId: data.targetEmployeeId,
    targetEmployeeName: data.targetEmployeeName,
    departmentName: data.departmentName,
    priority: data.priority || 'Medium',
    authorName: data.authorName || 'HR & Management',
    authorRole: data.authorRole || 'Human Resources',
  };

  const updated = [newNotice, ...all];
  saveAnnouncements(updated);
  return newNotice;
}

/**
 * Delete / Remove a notice
 */
export function deleteNotice(id: string): { success: boolean } {
  const all = getAllAnnouncements();
  const filtered = all.filter((a) => a.id !== id);
  saveAnnouncements(filtered);
  return { success: true };
}

/**
 * Filter notices visible to a specific employee (All + their department + their personal notices)
 */
export function getNoticesForEmployee(
  employeeId?: string,
  departmentName?: string
): Announcement[] {
  const all = getAllAnnouncements();
  if (!employeeId) return all;

  return all.filter((a) => {
    if (a.targetAudience === 'All') return true;
    if (a.targetAudience === 'Individual' && a.targetEmployeeId === employeeId) return true;
    if (
      a.targetAudience === 'Department' &&
      departmentName &&
      a.departmentName?.toLowerCase() === departmentName.toLowerCase()
    ) {
      return true;
    }
    return false;
  });
}
