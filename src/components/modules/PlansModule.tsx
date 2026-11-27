'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  ShoppingBag,
  RefreshCw,
  CheckCircle2,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useModalOverlay } from '../../lib/useModalOverlay';

const PLAN_FEATURE_OPTIONS = [
  { key: 'face_clock', label: 'Face Clock Kiosk' },
  { key: 'face_selfie', label: 'Selfie Face Verification' },
  { key: 'payroll', label: 'Payroll & Payslips' },
  { key: 'geofence', label: 'Office Geofence' },
  { key: 'recruitment', label: 'Recruitment & Hiring' },
] as const;

const ALL_FEATURE_KEYS = PLAN_FEATURE_OPTIONS.map((f) => f.key);

export const PlansModule: React.FC = () => {
  const { showToast } = useSocket();
  const [plans, setPlans] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [deletingPlan, setDeletingPlan] = useState<any>(null);
  const [sellingPlan, setSellingPlan] = useState<any>(null);
  const [sellCompanyId, setSellCompanyId] = useState('');
  const [busy, setBusy] = useState(false);

  const [planForm, setPlanForm] = useState({
    name: '',
    price: 999,
    durationMonths: 1,
    description: '',
    features: [...ALL_FEATURE_KEYS] as string[],
    status: 'Active' as 'Active' | 'Inactive',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, compRes] = await Promise.all([
        api.listPlans(),
        api.listCompanies({ limit: 50 }).catch(() => ({ data: [] })),
      ]);
      setPlans(Array.isArray(plansRes) ? plansRes : (plansRes?.data || []));
      setCompanies(Array.isArray(compRes?.data) ? compRes.data : Array.isArray(compRes) ? compRes : []);
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Failed to load plans',
        message: err instanceof Error ? err.message : 'Could not fetch plans.',
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const anyModalOpen = Boolean(isCreateOpen || editingPlan || deletingPlan || sellingPlan);
  useModalOverlay({
    isOpen: anyModalOpen,
    onClose: () => {
      setIsCreateOpen(false);
      setEditingPlan(null);
      setDeletingPlan(null);
      setSellingPlan(null);
    },
  });

  const activePlansCount = plans.filter((p) => p.status === 'Active').length;
  const inactivePlansCount = plans.length - activePlansCount;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createPlan({
        name: planForm.name,
        price: Number(planForm.price),
        durationMonths: Number(planForm.durationMonths),
        description: planForm.description,
        features: planForm.features,
      });
      showToast({ type: 'success', title: 'Plan Created', message: `${planForm.name} has been created.` });
      setIsCreateOpen(false);
      setPlanForm({ name: '', price: 999, durationMonths: 1, description: '', features: [...ALL_FEATURE_KEYS], status: 'Active' });
      await loadData();
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Failed to create plan.' });
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setBusy(true);
    try {
      await api.updatePlan(editingPlan.id, {
        name: planForm.name,
        price: Number(planForm.price),
        durationMonths: Number(planForm.durationMonths),
        description: planForm.description,
        features: planForm.features,
        status: planForm.status,
      });
      showToast({ type: 'success', title: 'Plan Updated', message: `${planForm.name} updated.` });
      setEditingPlan(null);
      await loadData();
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Failed to update plan.' });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;
    setBusy(true);
    try {
      await api.deletePlan(deletingPlan.id);
      showToast({ type: 'success', title: 'Plan Deleted', message: `${deletingPlan.name} removed.` });
      setDeletingPlan(null);
      await loadData();
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Cannot delete plan.' });
    } finally {
      setBusy(false);
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingPlan || !sellCompanyId.trim()) return;
    setBusy(true);
    try {
      await api.sellPlan(sellingPlan.id, { companyId: sellCompanyId.trim() });
      showToast({ type: 'success', title: 'Plan Assigned', message: `${sellingPlan.name} activated for company.` });
      setSellingPlan(null);
      setSellCompanyId('');
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not assign plan.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 w-full animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </span>
            Subscription Plans
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, edit, delete, and assign subscription plans for companies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setPlanForm({ name: '', price: 999, durationMonths: 1, description: '', features: [...ALL_FEATURE_KEYS], status: 'Active' });
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Create Plan
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Plans</p>
            <p className="text-xl font-black text-slate-900">{plans.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Active Plans</p>
            <p className="text-xl font-black text-slate-900">{activePlansCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Inactive Plans</p>
            <p className="text-xl font-black text-slate-900">{inactivePlansCount}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-10 text-center text-xs text-slate-500">
          Loading plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-10 text-center space-y-3">
          <p className="text-sm font-bold text-slate-800">No plans created yet</p>
          <p className="text-xs text-slate-500">Create a plan for companies to purchase.</p>
          <button
            type="button"
            onClick={() => {
              setPlanForm({ name: '', price: 999, durationMonths: 1, description: '', features: [...ALL_FEATURE_KEYS], status: 'Active' });
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      plan.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {plan.status}
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-3">
                  ₹{Number(plan.price || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Valid for {plan.durationMonths} month{Number(plan.durationMonths) === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-slate-600 mt-3 line-clamp-3">
                  {plan.description || 'No description provided.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(Array.isArray(plan.features) ? plan.features : ALL_FEATURE_KEYS).map((fkey: string) => {
                    const label = PLAN_FEATURE_OPTIONS.find((f) => f.key === fkey)?.label || fkey;
                    return (
                      <span
                        key={fkey}
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-semibold"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPlan(plan);
                      setPlanForm({
                        name: plan.name || '',
                        price: Number(plan.price) || 0,
                        durationMonths: Number(plan.durationMonths) || 1,
                        description: plan.description || '',
                        features: Array.isArray(plan.features) ? plan.features : [...ALL_FEATURE_KEYS],
                        status: plan.status === 'Inactive' ? 'Inactive' : 'Active',
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingPlan(plan)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSellingPlan(plan);
                    setSellCompanyId(companies[0]?.id || '');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <ShoppingBag className="w-3 h-3" /> Assign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreateOpen || editingPlan) && (
        <div
          onClick={() => {
            setIsCreateOpen(false);
            setEditingPlan(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={editingPlan ? handleEdit : handleCreate}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingPlan(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Plan Name *</label>
                <input
                  required
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Growth Plan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (INR) *</label>
                  <input
                    required
                    min={0}
                    type="number"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Months) *</label>
                  <input
                    required
                    min={1}
                    max={120}
                    type="number"
                    value={planForm.durationMonths}
                    onChange={(e) => setPlanForm({ ...planForm, durationMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              {editingPlan && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={planForm.status}
                    onChange={(e) => setPlanForm({ ...planForm, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">Included Features</label>
                  <button
                    type="button"
                    onClick={() =>
                      setPlanForm((prev) => ({
                        ...prev,
                        features: prev.features.length === ALL_FEATURE_KEYS.length ? [] : [...ALL_FEATURE_KEYS],
                      }))
                    }
                    className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                  >
                    {planForm.features.length === ALL_FEATURE_KEYS.length ? 'Clear all' : 'Select all'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PLAN_FEATURE_OPTIONS.map((feat) => {
                    const checked = planForm.features.includes(feat.key);
                    return (
                      <label
                        key={feat.key}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-[11px] font-semibold cursor-pointer transition ${
                          checked
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setPlanForm((prev) => ({
                              ...prev,
                              features: checked
                                ? prev.features.filter((k) => k !== feat.key)
                                : [...prev.features, feat.key],
                            }))
                          }
                          className="accent-emerald-600"
                        />
                        <span className="truncate">{feat.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Features included in this plan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingPlan(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {busy ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Delete Plan?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong>{deletingPlan.name}</strong>? Plans already linked to orders cannot be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingPlan(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDelete()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {busy ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign / Sell to Company */}
      {sellingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSell}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <h3 className="text-base font-bold text-slate-900">
              Assign {sellingPlan.name}
            </h3>
            <div className="text-xs space-y-2">
              <label className="font-bold text-slate-700 block">Select Company *</label>
              {companies.length > 0 ? (
                <select
                  required
                  value={sellCompanyId}
                  onChange={(e) => setSellCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Choose a company --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.status})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  type="text"
                  value={sellCompanyId}
                  onChange={(e) => setSellCompanyId(e.target.value)}
                  placeholder="Enter Company ID"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSellingPlan(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !sellCompanyId}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {busy ? 'Assigning...' : 'Activate Plan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
