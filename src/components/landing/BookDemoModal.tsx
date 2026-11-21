'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Building2,
  User,
  Mail,
  Phone,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  CalendarDays,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useModalOverlay } from '../../lib/useModalOverlay';
import { CustomSelect } from '../common/CustomSelect';

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMPANY_SIZE_OPTIONS = [
  { value: '1 - 15 Employees', label: '1 - 15 Employees (Startup / Small)' },
  { value: '16 - 50 Employees', label: '16 - 50 Employees (Growing Business)' },
  { value: '51 - 200 Employees', label: '51 - 200 Employees (Mid-Sized)' },
  { value: '201 - 500 Employees', label: '201 - 500 Employees (Enterprise)' },
  { value: '500+ Employees', label: '500+ Employees (Large Corporate)' },
];

const TIME_SLOT_OPTIONS = [
  { value: '10:00 AM - 12:00 PM', label: 'Morning Slot (10:00 AM - 12:00 PM)' },
  { value: '02:00 PM - 04:00 PM', label: 'Afternoon Slot (02:00 PM - 04:00 PM)' },
  { value: '04:00 PM - 06:00 PM', label: 'Evening Slot (04:00 PM - 06:00 PM)' },
];

const AVAILABLE_MODULES = [
  'Live Shift & Attendance',
  'Automated Payroll & Slips',
  'Leave Quotas & Workflow',
  'Employee Self-Service Portal',
  'Recruitment & Onboarding',
  'Company Notices & Broadcasts',
];

export const BookDemoModal: React.FC<BookDemoModalProps> = ({ isOpen, onClose }) => {
  useModalOverlay({ isOpen, onClose });

  // Tomorrow's date in YYYY-MM-DD as minimum booking date
  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  // Form State
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('16 - 50 Employees');
  const [preferredDate, setPreferredDate] = useState(getTomorrowString());
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('02:00 PM - 04:00 PM');
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'Live Shift & Attendance',
    'Automated Payroll & Slips',
  ]);
  const [notes, setNotes] = useState('');

  // Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    bookingId: string;
    fullName: string;
    workEmail: string;
    companyName: string;
    preferredDate: string;
    preferredTimeSlot: string;
  } | null>(null);

  if (!isOpen) return null;

  const toggleModule = (module: string) => {
    setSelectedModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    );
  };

  const handleReset = () => {
    setSuccessData(null);
    setErrorMessage(null);
    setFullName('');
    setWorkEmail('');
    setPhoneNumber('');
    setCompanyName('');
    setNotes('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validation
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(workEmail.trim())) {
      setErrorMessage('Please enter a valid official work email address.');
      return;
    }
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!companyName.trim()) {
      setErrorMessage('Please enter your company or business name.');
      return;
    }
    if (!preferredDate) {
      setErrorMessage('Please select a preferred date for the demo.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/book-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          workEmail,
          phoneNumber,
          companyName,
          companySize,
          preferredDate,
          preferredTimeSlot,
          interestedModules: selectedModules,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit demo request.');
      }

      setSuccessData(data.details);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">Book a Personalized Demo</h2>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                See how MyOwn HRMS automates attendance &amp; payroll
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4" style={{ scrollbarWidth: 'thin' }}>
          {successData ? (
            /* ══════════════════════════════════════════════════════════════
               SUCCESS CONFIRMATION SCREEN
            ══════════════════════════════════════════════════════════════ */
            <div className="py-6 text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-[#1b4332] mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-[#2d6a4f]" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Booking Reference: {successData.bookingId}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-3">Demo Reserved Successfully!</h3>
                <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto mt-1">
                  Thank you, <strong className="text-slate-900">{successData.fullName}</strong>. Our HR Solutions
                  Specialist will connect with you at your chosen date and time.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700 max-w-md mx-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#2d6a4f]" /> Company
                  </span>
                  <span className="font-bold text-slate-900">{successData.companyName}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#2d6a4f]" /> Scheduled Date
                  </span>
                  <span className="font-bold text-slate-900">{successData.preferredDate}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#2d6a4f]" /> Time Slot
                  </span>
                  <span className="font-bold text-slate-900">{successData.preferredTimeSlot}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#2d6a4f]" /> Confirmation Sent To
                  </span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{successData.workEmail}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Close &amp; Return to Home
                </button>
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════
               BOOK DEMO INPUT FORM
            ══════════════════════════════════════════════════════════════ */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold text-xs animate-in fade-in">
                  {errorMessage}
                </div>
              )}

              {/* Row 1: Full Name & Work Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Patel"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Official Work Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      placeholder="e.g. rahul@company.com"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Phone Number & Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile / WhatsApp No <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Company / Organization Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Patel Industries Ltd."
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Team Size & Preferred Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Company Size (Employees)
                  </label>
                  <CustomSelect
                    value={companySize}
                    onChange={(val) => setCompanySize(val)}
                    options={COMPANY_SIZE_OPTIONS}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Preferred Demo Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Preferred Time Slot */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Preferred Time Slot
                </label>
                <CustomSelect
                  value={preferredTimeSlot}
                  onChange={(val) => setPreferredTimeSlot(val)}
                  options={TIME_SLOT_OPTIONS}
                />
              </div>

              {/* Row 5: Modules of Interest */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Key Modules You Want to Explore
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isSelected = selectedModules.includes(mod);
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => toggleModule(mod)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold text-left transition-all flex items-center justify-between cursor-pointer select-none ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{mod}</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-700 shrink-0 ml-1 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 6: Additional Requirements / Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Specific Requirements or Questions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Currently using biometric machine, want to know if MyOwn HRMS supports payroll integration..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Submit CTA & Trust Line */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-100" />
                      <span>Reserving Your Demo Slot...</span>
                    </>
                  ) : (
                    <>
                      <CalendarDays className="w-4 h-4 text-emerald-100" />
                      <span>Confirm &amp; Schedule Live Demo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-slate-500 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>No credit card required • Instant confirmation • Free 1-on-1 consultation</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
