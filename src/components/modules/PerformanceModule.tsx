'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Star,
  Award,
  CheckCircle,
  Target,
  MessageSquare,
  Plus,
  Sliders,
  X,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { PerformanceReview } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';

interface PerformanceModuleProps {
  reviews?: PerformanceReview[];
  onRefresh?: () => void;
}

export const PerformanceModule: React.FC<PerformanceModuleProps> = ({
  reviews: initialReviews,
  onRefresh,
}) => {
  const { user, role } = useAuth();
  const { showToast } = useSocket();

  const [cycles, setCycles] = useState<any[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>(initialReviews || []);
  const [loading, setLoading] = useState(false);

  // Modal: Rate Appraisal
  const [ratingModalReview, setRatingModalReview] = useState<PerformanceReview | null>(null);
  useEffect(() => {
    if (!ratingModalReview) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRatingModalReview(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [ratingModalReview]);

  const [selfScore, setSelfScore] = useState(4.5);
  const [selfComments, setSelfComments] = useState('');
  const [managerScore, setManagerScore] = useState(4.8);
  const [managerFeedback, setManagerFeedback] = useState('');
  const [appraisalReco, setAppraisalReco] = useState('');
  const [rateRole, setRateRole] = useState<'MANAGER' | 'EMPLOYEE'>('MANAGER');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cyclesData, reviewsData] = await Promise.all([
        api.getPerformanceCycles(),
        api.getPerformanceReviews(),
      ]);
      setCycles(cyclesData);
      if (Array.isArray(reviewsData)) {
        setReviews(reviewsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModalReview) return;
    try {
      const updated = await api.ratePerformanceReview(ratingModalReview.id, {
        selfRating: Number(selfScore),
        selfComments: selfComments.trim() || undefined,
        managerRating: Number(managerScore),
        managerFeedback: managerFeedback.trim() || undefined,
        appraisalRecommended: appraisalReco.trim() || undefined,
        role: rateRole,
        actorName: `${user.firstName || 'Admin'} ${user.lastName || ''}`,
      });

      setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast({
        type: 'success',
        title: 'Appraisal Rating Saved',
        message: `Evaluation submitted for ${ratingModalReview.employeeName}.`,
      });

      setRatingModalReview(null);
      onRefresh?.();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Submission Failed', message: err.message || 'Could not save appraisal.' });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Performance Management & OKRs
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold">
              {cycles[0]?.title || 'Q3-Q4 2026 Cycle'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Goal tracking, quarterly appraisal cycles, self-assessment ratings, and manager 360-degree feedback
          </p>
        </div>

        {cycles.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-2xs">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800">Review Window:</span>
            <span>{cycles[0]?.startDate} → {cycles[0]?.endDate}</span>
          </div>
        )}
      </div>

      {/* Review Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">No performance reviews found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No active appraisal cycles or reviews found for your organization.
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {rev.employeeName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manager: {rev.managerName || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-600 font-black text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{rev.finalRating ? `${rev.finalRating} / 5.0` : rev.managerRating ? `${rev.managerRating} / 5.0` : 'Not Rated'}</span>
                  </div>
                </div>

                {/* OKR Goals Progress */}
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Key Objectives & Deliverables (OKRs)
                  </p>
                  <div className="space-y-3">
                    {(rev.goals || []).map((g, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-700">{g.title}</span>
                          <span className="text-emerald-700 font-bold">{g.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all"
                            style={{ width: `${g.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback box */}
                {(rev.managerFeedback || rev.selfComments) && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 text-xs text-slate-600 border border-slate-100 space-y-2">
                    {rev.selfComments && (
                      <div>
                        <span className="font-bold block text-slate-700">Self Assessment:</span>
                        <p className="text-[11px]">{rev.selfComments}</p>
                      </div>
                    )}
                    {rev.managerFeedback && (
                      <div>
                        <span className="font-bold block text-slate-700">Manager Appraisal:</span>
                        <p className="text-[11px]">{rev.managerFeedback}</p>
                      </div>
                    )}
                    {rev.appraisalRecommended && (
                      <p className="pt-1 text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                        <Award className="w-3.5 h-3.5" /> {rev.appraisalRecommended}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {rev.status || 'Active Cycle'}
                </span>

                <button
                  onClick={() => {
                    setRatingModalReview(rev);
                    setSelfScore(rev.selfRating || 0);
                    setSelfComments(rev.selfComments || '');
                    setManagerScore(rev.managerRating || 0);
                    setManagerFeedback(rev.managerFeedback || '');
                    setAppraisalReco(rev.appraisalRecommended || '');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Rate & Appraise</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Rate Performance Review */}
      {ratingModalReview && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setRatingModalReview(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden cursor-default transition-all my-auto max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    Appraisal Rating: {ratingModalReview.employeeName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Submit performance appraisal evaluation</p>
                </div>
              </div>
              <button
                onClick={() => setRatingModalReview(null)}
<<<<<<< HEAD
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
=======
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              >
                <X className="w-5 h-5" />
              </button>
            </div>

<<<<<<< HEAD
            <form onSubmit={handleRateSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Submitting Evaluation As:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRateRole('MANAGER')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        rateRole === 'MANAGER' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Manager Feedback
                    </button>
                    <button
                      type="button"
                      onClick={() => setRateRole('EMPLOYEE')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        rateRole === 'EMPLOYEE' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Self Appraisal
                    </button>
                  </div>
=======
            <form onSubmit={handleRateSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Submitting Evaluation As:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRateRole('MANAGER')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      rateRole === 'MANAGER' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    Manager Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateRole('EMPLOYEE')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      rateRole === 'EMPLOYEE' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    Self Appraisal
                  </button>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                </div>

                {rateRole === 'MANAGER' ? (
                  <>
                    <div>
                      <div className="flex justify-between font-semibold mb-1.5 text-slate-700">
                        <span>Manager Rating Score (1.0 - 5.0):</span>
                        <span className="font-bold text-amber-700 text-sm">{managerScore} / 5.0</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.1}
                        value={managerScore}
                        onChange={(e) => setManagerScore(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Qualitative Manager Feedback</label>
                      <textarea
                        rows={2}
                        placeholder="Feedback on key deliverables, technical leadership, and team collaboration..."
                        value={managerFeedback}
                        onChange={(e) => setManagerFeedback(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Appraisal & Promotion Recommendation</label>
                      <input
                        type="text"
                        placeholder="e.g., Promotion to Lead Software Engineer + 15% merit increment"
                        value={appraisalReco}
                        onChange={(e) => setAppraisalReco(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between font-semibold mb-1.5 text-slate-700">
                        <span>Self-Assessment Score (1.0 - 5.0):</span>
                        <span className="font-bold text-blue-700 text-sm">{selfScore} / 5.0</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.1}
                        value={selfScore}
                        onChange={(e) => setSelfScore(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Self-Assessment Remarks</label>
                      <textarea
                        rows={3}
                        placeholder="Summarize your major achievements, sprint milestones, and personal development goals..."
                        value={selfComments}
                        onChange={(e) => setSelfComments(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}
              </div>

<<<<<<< HEAD
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
=======
              {rateRole === 'MANAGER' ? (
                <>
                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-slate-700">
                      <span>Manager Rating Score (1.0 - 5.0):</span>
                      <span className="font-black text-amber-600 text-sm">{managerScore} / 5.0</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.1}
                      value={managerScore}
                      onChange={(e) => setManagerScore(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Qualitative Manager Feedback</label>
                    <textarea
                      rows={2}
                      placeholder="Feedback on key deliverables, technical leadership, and team collaboration..."
                      value={managerFeedback}
                      onChange={(e) => setManagerFeedback(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Appraisal & Promotion Recommendation</label>
                    <input
                      type="text"
                      placeholder="e.g., Promotion to Lead Software Engineer + 15% merit increment"
                      value={appraisalReco}
                      onChange={(e) => setAppraisalReco(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-slate-700">
                      <span>Self-Assessment Score (1.0 - 5.0):</span>
                      <span className="font-black text-emerald-700 text-sm">{selfScore} / 5.0</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.1}
                      value={selfScore}
                      onChange={(e) => setSelfScore(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Self-Assessment Remarks</label>
                    <textarea
                      rows={3}
                      placeholder="Summarize your major achievements, sprint milestones, and personal development goals..."
                      value={selfComments}
                      onChange={(e) => setSelfComments(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                <button
                  type="button"
                  onClick={() => setRatingModalReview(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
<<<<<<< HEAD
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
=======
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-600/20 cursor-pointer"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
