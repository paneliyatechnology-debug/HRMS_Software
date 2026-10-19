'use client';

import React from 'react';
import { Bell, Plus, Calendar, Tag } from 'lucide-react';
import { Announcement } from '../../types/hrms';

export const AnnouncementsModule: React.FC = () => {
  const announcements: Announcement[] = [
    {
      id: 'anc-1',
      title: 'Company Annual Town Hall & Q3 Product Keynote',
      content: 'Join us on Friday, October 30th at 10:00 AM PST for our quarterly town hall! We will celebrate major engineering milestones, reveal the Q4 roadmap, and recognize employee achievements.',
      publishDate: '2026-10-15',
      targetAudience: 'All',
      priority: 'High',
      authorName: 'John Deo (VP of Engineering)',
    },
    {
      id: 'anc-2',
      title: 'Open Enrollment for Health, Dental & Vision Insurance Benefits',
      content: 'The 2027 open enrollment period begins next Monday. Please review the updated benefit plans in the Documents portal before November 15th.',
      publishDate: '2026-10-17',
      targetAudience: 'All',
      priority: 'Medium',
      authorName: 'Sarah Jenkins (HR Director)',
    },
    {
      id: 'anc-3',
      title: 'New Hybrid Office Policy & Workspace Booking Guidelines',
      content: 'We have upgraded collaboration spaces in both SF and NY offices. Hot-desking reservations are now available in the employee portal.',
      publishDate: '2026-10-18',
      targetAudience: 'All',
      priority: 'Low',
      authorName: 'People Operations',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Company Notice Board & Bulletins
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official organizational broadcasts, town hall updates, and department circulars
          </p>
        </div>

        <button
          onClick={() => alert('New announcement publisher opening...')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Create Announcement
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((anc) => (
          <div
            key={anc.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  anc.priority === 'High'
                    ? 'bg-rose-50 text-rose-600'
                    : anc.priority === 'Medium'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {anc.priority} Priority
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Published on {anc.publishDate}
              </span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {anc.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {anc.content}
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
              <span>Author: <strong className="text-slate-700 dark:text-slate-200">{anc.authorName}</strong></span>
              <span className="font-semibold text-blue-600">Audience: {anc.targetAudience}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
