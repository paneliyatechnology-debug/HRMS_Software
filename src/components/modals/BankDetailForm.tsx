'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const ROLES = ['HR', 'MANAGER', 'EMPLOYEE'];

export const BankDetailForm: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ bankName: '', accountHolderName: '', accountNumber: '', ifsc: '' });

  useEffect(() => {
    if (!user?.id || !ROLES.includes(user.role)) return;
    let stop = false;
    api.getBankDetails()
      .then((data) => {
        if (stop) return;
        setOpen(!data?.bank);
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [user?.id, user?.role]);

  if (!open) return null;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.saveBankDetails(form);
      setOpen(false);
      showToast({ title: 'Bank saved', message: 'This bank is saved once. It cannot be added again.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Could not save', message: err.message || 'Check the bank details.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/50 flex items-center justify-center p-4">
      <form onSubmit={save} className="w-full max-w-md bg-white rounded-2xl p-5 space-y-3 shadow-xl">
        <h2 className="text-base font-bold text-slate-900">Add bank details</h2>
        <p className="text-xs text-slate-500">One bank only. After you save, this form will not open again.</p>
        <input required value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} placeholder="Bank name" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <input required value={form.accountHolderName} onChange={(event) => setForm({ ...form, accountHolderName: event.target.value })} placeholder="Account holder name" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <input required inputMode="numeric" value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value })} placeholder="Account number" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <input required value={form.ifsc} onChange={(event) => setForm({ ...form, ifsc: event.target.value.toUpperCase() })} placeholder="IFSC" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-slate-900 text-white py-2 text-sm font-bold disabled:opacity-60">
          {saving ? 'Saving...' : 'Save bank'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="w-full text-xs font-semibold text-slate-500">
          Later
        </button>
      </form>
    </div>
  );
};
