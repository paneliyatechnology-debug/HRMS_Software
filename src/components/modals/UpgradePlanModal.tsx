'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  CreditCard,
  Lock,
  LogOut,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useModalOverlay } from '../../lib/useModalOverlay';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  onPlanUpdated?: () => void;
  mandatory?: boolean;
  expired?: boolean;
  onLogout?: () => void;
}

// Helper to dynamically load Razorpay Checkout script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load official Razorpay Checkout SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const PLAN_FEATURE_LABELS: Record<string, string> = {
  face_clock: 'Face Clock Kiosk',
  attendance: 'Attendance & Shifts',
  leaves: 'Leave Management',
  payroll: 'Payroll & Payslips',
  recruitment: 'Recruitment & Hiring',
  team_chat: 'Team Chat & Notices',
  geofence: 'Office Geofence',
  tasks: 'Tasks & Projects',
};

type LivePlan = {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  description?: string | null;
  features?: string[];
};

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  onPlanUpdated,
  mandatory = false,
  expired = false,
  onLogout,
}) => {
  const { user } = useAuth();
  const { showToast } = useSocket();
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [backendPlans, setBackendPlans] = useState<LivePlan[]>([]);
  const [plansError, setPlansError] = useState('');
  const [activePlanId, setActivePlanId] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setPlansError('');
    api.getCompanyPremium()
      .then((res) => {
        if (!isMounted || !res) return;
        const status = res?.data || res;
        setActivePlanId(String(status?.order?.status === 'Active' ? status.order.planId || '' : ''));
      })
      .catch(() => undefined);

    api.getPremiumPlans()
      .then((res) => {
        if (!isMounted || !res) return;
        const list = Array.isArray(res) ? res : (res?.data || []);
        setBackendPlans(list);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setPlansError(error instanceof Error ? error.message : 'Plans could not be loaded.');
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useModalOverlay({ isOpen, onClose: mandatory ? undefined : onClose, closeOnEscape: !mandatory });

  if (!isOpen) return null;

  const handleSelectPlan = async (plan: LivePlan) => {
    if (plan.id === activePlanId) {
      showToast({
        type: 'info',
        title: 'Already Subscribed',
        message: `${plan.name} is already active for this company.`,
      });
      return;
    }

    setUpgradingPlanId(plan.id);

    try {
      const checkoutRes = await api.startPlanCheckout({ planId: plan.id });
      const cData = checkoutRes?.data || checkoutRes;
      const orderId = String(cData?.orderId || cData?.razorpayOrderId || '');
      const amountPaise = Number(cData?.amount);
      const keyVal = String(cData?.keyId || '');
      if (!orderId || !keyVal || !Number.isFinite(amountPaise)) {
        throw new Error('Razorpay order was not created.');
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !(window as any).Razorpay) {
        throw new Error('Razorpay payment gateway script could not be loaded in browser');
      }

      // 3. Launch official Razorpay Checkout modal
      const options = {
        key: keyVal,
        amount: amountPaise,
        currency: 'INR',
        name: user?.companyName || 'HRMS',
        description: `${plan.name} · ${plan.durationMonths} month${plan.durationMonths === 1 ? '' : 's'}`,
        image: 'https://cdn-icons-png.flaticon.com/512/9442/9442657.png',
        order_id: orderId,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            await api.verifyPlanPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            showToast({
              type: 'success',
              title: 'Payment Successful',
              message: `${plan.name} is now active.`,
            });
            setUpgradingPlanId(null);
            onPlanUpdated?.();
            onClose();
          } catch (verErr: unknown) {
            showToast({
              type: 'error',
              title: 'Verification Warning',
              message: verErr instanceof Error ? verErr.message : 'Signature mismatch.',
            });
            setUpgradingPlanId(null);
          }
        },
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Company Administrator',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        notes: {
          planId: plan.id,
          planName: plan.name,
        },
        theme: {
          color: '#1b4332',
        },
        modal: {
          ondismiss: function () {
            setUpgradingPlanId(null);
            showToast({
              type: 'info',
              title: 'Payment Cancelled',
              message: 'Razorpay checkout was dismissed without payment.',
            });
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on('payment.failed', function (resp: any) {
        setUpgradingPlanId(null);
        showToast({
          type: 'error',
          title: 'Payment Failed',
          message: resp.error?.description || 'Transaction declined by bank/gateway.',
        });
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error('Razorpay Checkout initialization failed:', err);
      showToast({
        type: 'error',
        title: 'Payment Gateway Notice',
        message: err.message || 'Could not connect to payment gateway. Please check your internet connection.',
      });
      setUpgradingPlanId(null);
    }
  };

  const planCols = backendPlans.length <= 1 ? 'grid-cols-1' : backendPlans.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div
      onClick={(e) => {
        if (!mandatory && e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              {mandatory ? (expired ? 'Plan Expired' : 'Plan Required') : 'Razorpay test mode'}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {mandatory
                ? expired
                  ? 'Your company plan has expired'
                  : 'Purchase a plan to continue'
                : 'Choose a plan'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {mandatory
                ? 'Select and purchase a plan below to unlock your company workspace. You can only logout until a plan is active.'
                : 'Pay with UPI, cards, or net banking. The plan turns on after payment is confirmed.'}
            </p>
          </div>
          {mandatory ? (
            onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {plansError && (
            <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{plansError}</p>
          )}
          {!plansError && backendPlans.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">No active plans yet. A super admin can add one from Settings.</p>
          )}
          <div className={`grid gap-4 ${planCols}`}>
            {backendPlans.map((plan) => {
              const isCurrent = plan.id === activePlanId;
              const isUpgradingThis = upgradingPlanId === plan.id;
              const months = Number(plan.durationMonths) || 1;
              const price = Number(plan.price) || 0;
              return (
                <div
                  key={plan.id}
                  className={`flex min-w-0 flex-col rounded-2xl border p-5 ${isCurrent ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-base font-bold text-slate-900">{plan.name}</h3>
                    {isCurrent && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">{plan.description || 'Company plan'}</p>
                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <p className="text-3xl font-bold text-slate-900">₹{price.toLocaleString('en-IN')}</p>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      {months} Month{months === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-500">Valid for {months} month{months === 1 ? '' : 's'}</p>
                  {Array.isArray(plan.features) && plan.features.length > 0 && (
                    <div className="mt-4 flex-1 border-t border-slate-100 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Included Features
                      </p>
                      <ul className="space-y-1.5">
                        {plan.features.map((featKey) => (
                          <li key={featKey} className="flex items-center gap-2 text-xs text-slate-700">
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span>{PLAN_FEATURE_LABELS[featKey] || featKey}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={isUpgradingThis || isCurrent}
                    onClick={() => handleSelectPlan(plan)}
                    className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${isCurrent
                      ? 'cursor-not-allowed bg-white text-slate-400 border border-slate-200'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}
                  >
                    {isUpgradingThis ? (
                      'Opening Razorpay...'
                    ) : isCurrent ? (
                      'Current plan'
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Pay ₹{price.toLocaleString('en-IN')}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
          <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>Secure Razorpay checkout · UPI, cards, and net banking</span>
        </div>
      </div>
    </div>
  );
};
