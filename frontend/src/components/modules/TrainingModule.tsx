'use client';

import React from 'react';
import { GraduationCap, Award, Clock, Users, CheckCircle, BookOpen } from 'lucide-react';
import { TrainingProgram } from '../../types/hrms';

interface TrainingModuleProps {
  programs: TrainingProgram[];
  onRefresh: () => void;
}

export const TrainingModule: React.FC<TrainingModuleProps> = ({ programs }) => {
  const displayPrograms: TrainingProgram[] = programs.length > 0 ? programs : [
    {
      id: 'trn-1',
      title: 'Enterprise Cybersecurity & Data Privacy Standards',
      description: 'Annual mandatory training covering ISO 27001, SOC2, phishing prevention, and GDPR compliance.',
      trainerName: 'David K. Vance (Security Consultant)',
      skillsCovered: ['Cybersecurity', 'SOC 2', 'Data Privacy'],
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      durationHours: 6,
      status: 'In Progress',
      enrolledCount: 21,
    },
    {
      id: 'trn-2',
      title: 'Modern Full-Stack Architecture with Next.js 15 & Nest.js',
      description: 'Advanced engineering workshops on server actions, clean DDD architecture, and real-time observability.',
      trainerName: 'Alex Mercer (Staff Engineer)',
      skillsCovered: ['Next.js App Router', 'Nest.js Microservices', 'Prisma ORM'],
      startDate: '2026-10-15',
      endDate: '2026-11-15',
      durationHours: 12,
      status: 'In Progress',
      enrolledCount: 8,
    },
    {
      id: 'trn-3',
      title: 'Effective Leadership, Mentorship & OKR Coaching',
      description: 'Managerial excellence program on giving constructive feedback, conducting appraisals and driving velocity.',
      trainerName: 'Sarah Jenkins (HR Director)',
      skillsCovered: ['Leadership', 'Performance Management', 'OKR Coaching'],
      startDate: '2026-11-05',
      endDate: '2026-11-25',
      durationHours: 8,
      status: 'Upcoming',
      enrolledCount: 6,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Learning & Development
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Skill development courses, compliance certifications, training programs, and employee progress
          </p>
        </div>

        <button
          onClick={() => alert('New training curriculum builder opening...')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
        >
          Add Training Course
        </button>
      </div>

      {/* Program Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayPrograms.map((prog) => (
          <div
            key={prog.id}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  {prog.status}
                </span>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {prog.durationHours} Hours
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 mt-3">
                {prog.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {prog.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {prog.skillsCovered.map((s) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Instructor</span>
                <span className="font-semibold text-slate-800">{prog.trainerName}</span>
              </div>
              <span className="font-bold text-blue-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {prog.enrolledCount} Enrolled
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
