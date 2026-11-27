'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  CreditCard,
  Lock,
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

type LivePlan = {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  description?: string | null;
};

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  onPlanUpdated,
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

  useModalOverlay({ isOpen, onClose });

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
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-3 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
<<<<<<< HEAD
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Razorpay test mode</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Choose a plan</h2>
            <p className="mt-1 text-xs text-slate-500">Pay with UPI, cards, or net banking. The plan turns on after payment is confirmed.</p>
=======
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Official Razorpay Payment Gateway (Test Mode)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Choose Your Paneliya HRMS Plan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Instant online activation via UPI, GPay, PhonePe, Paytm, NetBanking, and Credit/Debit Cards.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="pt-3 flex items-center justify-center">
            <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200/80 inline-flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => setBillingCycle('Monthly')}
                className={`px-4 py-1.5 rounded-xl transition cursor-pointer ${billingCycle === 'Monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('Annual')}
                className={`px-4 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${billingCycle === 'Annual'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <span>Annual Billing</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-400 text-slate-900 text-[10px] font-black uppercase tracking-wider">
                  Save 17%
                </span>
              </button>
            </div>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

<<<<<<< HEAD
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
=======
        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentSub.plan.id;
            const price =
              billingCycle === 'Annual'
                ? Math.round(plan.priceAnnualINR / 12)
                : plan.priceMonthlyINR;
            const totalBill =
              billingCycle === 'Annual'
                ? plan.priceAnnualINR
                : plan.priceMonthlyINR;
            const isUpgradingThis = upgradingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 border transition-all flex flex-col justify-between relative ${plan.isPopular
                  ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-xl bg-gradient-to-b from-emerald-50/40 via-white to-white'
                  : isCurrent
                    ? 'border-emerald-400/80 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20'
                    : 'border-slate-200/90 hover:border-slate-300 shadow-xs bg-white'
                  }`}
              >
                {/* Top Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase shadow-xs flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Most Popular</span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3.5 right-6 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase shadow-xs flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Active Plan</span>
                  </div>
                )}

                <div>
                  {/* Title & Tagline */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                    {plan.id === 'Enterprise' && (
                      <span className="p-1 rounded-lg bg-purple-100 text-purple-700">
                        <Fingerprint className="w-4 h-4" />
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">{plan.description || 'Company plan'}</p>
                  <p className="mt-4 text-3xl font-bold text-slate-900">₹{price.toLocaleString('en-IN')}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Valid for {months} month{months === 1 ? '' : 's'}</p>
                  <button
                    type="button"
                    disabled={isUpgradingThis || isCurrent}
                    onClick={() => handleSelectPlan(plan)}
<<<<<<< HEAD
                    className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${isCurrent
                      ? 'cursor-not-allowed bg-white text-slate-400 border border-slate-200'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}
=======
                    className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : plan.isPopular
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25'
                        : plan.id === 'Enterprise'
                          ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-500/25'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
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
