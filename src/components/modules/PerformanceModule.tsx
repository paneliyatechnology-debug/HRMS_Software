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
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">Review Window:</span>
            <span>{cycles[0]?.startDate} → {cycles[0]?.endDate}</span>
          </div>
        )}
      </div>

      {/* Review Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((rev) => (
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
                  <p className="text-xs text-slate-400 mt-0.5">Manager: {rev.managerName}</p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-600 font-black text-xs">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{rev.finalRating || rev.managerRating || rev.selfRating || 4.5} / 5.0</span>
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
                        <span className="text-blue-600 font-bold">{g.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
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
                  setSelfScore(rev.selfRating || 4.5);
                  setSelfComments(rev.selfComments || '');
                  setManagerScore(rev.managerRating || 4.8);
                  setManagerFeedback(rev.managerFeedback || '');
                  setAppraisalReco(rev.appraisalRecommended || 'Merit Promotion + 12% Increment');
                }}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5" />
                <span>Rate & Appraise</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Rate Performance Review */}
      {ratingModalReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                Appraisal Rating: {ratingModalReview.employeeName}
              </h3>
              <button
                onClick={() => setRatingModalReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRateSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Submitting Evaluation As:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRateRole('MANAGER')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                      rateRole === 'MANAGER' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    Manager Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateRole('EMPLOYEE')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                      rateRole === 'EMPLOYEE' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    Self Appraisal
                  </button>
                </div>
              </div>

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
                      <span className="font-black text-blue-600 text-sm">{selfScore} / 5.0</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.1}
                      value={selfScore}
                      onChange={(e) => setSelfScore(Number(e.target.value))}
                      className="w-full accent-blue-600"
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
                <button
                  type="button"
                  onClick={() => setRatingModalReview(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
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
