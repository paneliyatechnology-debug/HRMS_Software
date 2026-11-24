'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  AlertCircle,
  User,
  UserPlus,
  Phone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Users,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  X,
  Briefcase,
  FileText,
  MapPin,
  Info,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { CustomSelect } from '../common/CustomSelect';

const INDUSTRY_OPTIONS = [
  { value: 'IT & Software Services', label: 'Information Technology & Software' },
  { value: 'Manufacturing & Industrial', label: 'Manufacturing & Industrial' },
  { value: 'Retail & E-Commerce', label: 'Retail & E-Commerce' },
  { value: 'Healthcare & Pharma', label: 'Healthcare & Pharma' },
  { value: 'Construction & Real Estate', label: 'Construction & Real Estate' },
  { value: 'Financial & Banking', label: 'Financial & Banking' },
  { value: 'Education & EdTech', label: 'Education & EdTech' },
  { value: 'Hospitality & Services', label: 'Hospitality & Services' },
  { value: 'General Corporate', label: 'General Corporate / Other' },
];
import {
  validateEmail,
  validatePhone,
  validateGstin,
  validateName,
  validateLoginIdentifier,
  cleanPhoneNumber,
  checkDuplicateEmailOrPhone,
} from '../../lib/validation';

export interface LoginPageProps {
  onBackToHome?: () => void;
  initialMode?: 'login' | 'signup';
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToHome, initialMode = 'login' }) => {
  const router = useRouter();
  const { login, registerCompanyAccount } = useAuth();
  const handleBack = onBackToHome || (() => router.push('/dashboard'));

  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'registration_pending'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/register') {
      return 'signup';
    }
    return initialMode;
  });

  const [registeredCompanyInfo, setRegisteredCompanyInfo] = useState<{
    companyName: string;
    ownerEmail: string;
    ownerName: string;
  }>({
    companyName: '',
    ownerEmail: '',
    ownerName: '',
  });

  // Animation transition state for fluid switching between login and register views
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStage, setTransitionStage] = useState<'idle' | 'leaving' | 'entering'>('idle');
  const [transitionDirection, setTransitionDirection] = useState<'to-signup' | 'to-login'>('to-signup');

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const handleOpenForgot = () => {
    setForgotError(null);
    setForgotSuccess(null);
    if (identifier && identifier.includes('@')) {
      setForgotEmail(identifier.trim());
    } else {
      setForgotEmail('');
    }
    setForgotModalOpen(true);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const trimmed = forgotEmail.trim();
    if (!trimmed) {
      setForgotError('Please enter your email address.');
      return;
    }
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.forgotPassword(trimmed);
      setForgotSuccess(res?.message || 'A password form link was sent to your email.');
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to send password reset link. Please check your email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSwitchToSignup = () => {
    if (isTransitioning || viewMode === 'signup') return;
    setIsTransitioning(true);
    setTransitionDirection('to-signup');
    setTransitionStage('leaving');

    setTimeout(() => {
    clearAllSignupFields();
    setViewMode('signup');
    setErrorMessage(null);
    setSuccessMessage(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/register') {
      window.history.pushState(null, '', '/register');
    }
      setTransitionStage('entering');
      requestAnimationFrame(() => {
        setTimeout(() => {
          setTransitionStage('idle');
          setIsTransitioning(false);
        }, 40);
      });
    }, 180);
  };

  const handleSwitchToLogin = () => {
    if (isTransitioning || viewMode === 'login') return;
    setIsTransitioning(true);
    setTransitionDirection('to-login');
    setTransitionStage('leaving');

    setTimeout(() => {
    clearAllSignupFields();
    clearLoginFields();
    setViewMode('login');
    setErrorMessage(null);
    setSuccessMessage(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.pushState(null, '', '/login');
    }
      setTransitionStage('entering');
      requestAnimationFrame(() => {
        setTimeout(() => {
          setTransitionStage('idle');
          setIsTransitioning(false);
        }, 40);
      });
    }, 180);
  };

  useEffect(() => {
    const handlePopState = () => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/register') {
        setViewMode('signup');
      } else if (window.location.pathname === '/login') {
        setViewMode('login');
      }
    }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Company Registration Form State
  const [companyName, setCompanyName] = useState('');
  const [companyGst, setCompanyGst] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('IT & Software Services');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyState, setCompanyState] = useState('');

  // Company Owner Account State
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });
  };

  // Anti-autofill state for login & password fields so browser never auto-detects or pre-fills them
  const [loginIdentifierReadOnly, setLoginIdentifierReadOnly] = useState(true);
  const [loginPasswordReadOnly, setLoginPasswordReadOnly] = useState(true);

  const clearLoginFields = () => {
    setIdentifier('');
    setPassword('');
    setLoginIdentifierReadOnly(true);
    setLoginPasswordReadOnly(true);
    setFieldErrors({});
  };

  const clearAllSignupFields = () => {
    setCompanyName('');
    setCompanyGst('');
    setCompanyIndustry('IT & Software Services');
    setCompanyAddress('');
    setCompanyCity('');
    setCompanyState('');
    setOwnerFirstName('');
    setOwnerLastName('');
    setOwnerEmail('');
    setOwnerPhone('');
    setFieldErrors({});
  };

  useEffect(() => {
    if (viewMode === 'login') {
      clearLoginFields();
      const t1 = setTimeout(() => {
        setIdentifier('');
        setPassword('');
      }, 50);
      const t2 = setTimeout(() => {
        setIdentifier('');
        setPassword('');
      }, 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'signup') {
      clearAllSignupFields();
    }
  }, [viewMode]);

  // Bottom Popup State for unassociated / unlinked organization users
  const [notInOrgPopup, setNotInOrgPopup] = useState<{
    open: boolean;
    email: string;
    attemptRole?: string;
  } | null>(null);

  // Handle Unified Login Submission with Automatic Role & Workspace Detection
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setNotInOrgPopup(null);
    const errors: Record<string, string> = {};

    // Validate Identifier
    const idCheck = validateLoginIdentifier(identifier);
    if (!idCheck.isValid) {
      errors.identifier = idCheck.error || 'Please enter a valid email, 10-digit mobile number, or employee code.';
    }

    // Validate Password
    if (!password || password.trim().length === 0) {
      errors.password = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      // Single unified login: automatically identifies Owner/Admin or Employee based on role in database
      const res = await login(identifier, password);

      if (!res.success) {
        if (
          res.notInOrganization ||
          res.message?.toLowerCase().includes('not part of any organization')
        ) {
          setNotInOrgPopup({
            open: true,
            email: identifier.trim(),
            attemptRole: 'Workspace User',
          });
        }

        setErrorMessage(
          res.message || 'Invalid credentials. Please verify your email, mobile number or employee code and password.'
        );
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Handle Company Registration (Owner Onboarding)
  const handleRegisterCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const errors: Record<string, string> = {};

    // 1. Company Legal Name validation
    const compCheck = validateName(companyName, 'Company legal name', 2, true);
    if (!compCheck.isValid) {
      errors.companyName = compCheck.error || 'Company legal name is required.';
    }

    // 2. GSTIN format validation (if provided)
    if (companyGst.trim()) {
      const gstCheck = validateGstin(companyGst, false);
      if (!gstCheck.isValid) {
        errors.companyGst = gstCheck.error || 'Invalid GSTIN format. Example: 24AAAAA0000A1Z5';
      }
    }

    // 3. Owner First Name & Last Name validation
    const fNameCheck = validateName(ownerFirstName, 'Owner first name', 2, true);
    if (!fNameCheck.isValid) {
      errors.ownerFirstName = fNameCheck.error || 'Owner first name is required (at least 2 letters).';
    }
    const lNameCheck = validateName(ownerLastName, 'Owner last name', 2, true);
    if (!lNameCheck.isValid) {
      errors.ownerLastName = lNameCheck.error || 'Owner last name is required (at least 2 letters).';
    }

    // 4. Owner Email validation
    const emailCheck = validateEmail(ownerEmail, true);
    if (!emailCheck.isValid) {
      errors.ownerEmail = emailCheck.error || 'Please enter a valid official email address.';
    }

    // 5. Owner Phone validation
    const phoneCheck = validatePhone(ownerPhone, true);
    if (!phoneCheck.isValid) {
      errors.ownerPhone = phoneCheck.error || 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // 6. Strict Uniqueness Check: 1 Email = 1 Account & 1 Mobile Number = 1 Account
    const allEmps = await api.getEmployees().catch(() => []);
    const dupCheck = checkDuplicateEmailOrPhone({
      email: ownerEmail,
      phone: ownerPhone,
      existingEmployees: allEmps,
    });
    if (!dupCheck.isValid) {
      const msg = dupCheck.error || 'This email or mobile number is already registered.';
      if (msg.toLowerCase().includes('email')) {
        errors.ownerEmail = msg;
      } else {
        errors.ownerPhone = msg;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const res = await registerCompanyAccount({
        companyName: companyName.trim(),
        companyLegalName: companyName.trim(),
        gstNumber: companyGst.trim() ? companyGst.trim().toUpperCase() : '',
        gstin: companyGst.trim() ? companyGst.trim().toUpperCase() : '',
        industry: companyIndustry || 'Information Technology & Software',
        industrySector: companyIndustry || 'Information Technology & Software',
        address: companyAddress.trim() || '',
        officeAddress: companyAddress.trim() || '',
        city: companyCity.trim() || 'Surat',
        state: companyState.trim() || 'Gujarat',
        firstName: ownerFirstName.trim(),
        lastName: ownerLastName.trim(),
        email: ownerEmail.trim().toLowerCase(),
        officialEmail: ownerEmail.trim().toLowerCase(),
        phone: phoneCheck.cleanPhone || ownerPhone.trim(),
        mobileNumber: phoneCheck.cleanPhone || ownerPhone.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Company registration failed. Please try again.');
      } else {
        setRegisteredCompanyInfo({
          companyName: companyName.trim(),
          ownerEmail: ownerEmail.trim().toLowerCase(),
          ownerName: `${ownerFirstName.trim()} ${ownerLastName.trim()}`,
        });
        setViewMode('registration_pending');
        setErrorMessage(null);
        setSuccessMessage(null);
        clearAllSignupFields();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Company registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic CSS classes for seamless directional transition between views
  const loginAnimationClass =
    transitionStage === 'leaving' && transitionDirection === 'to-signup'
      ? 'opacity-0 -translate-x-8 scale-[0.98] pointer-events-none'
      : transitionStage === 'entering' && transitionDirection === 'to-login'
      ? 'opacity-0 -translate-x-8 scale-[0.98]'
      : 'opacity-100 translate-x-0 scale-100';

  const signupAnimationClass =
    transitionStage === 'leaving' && transitionDirection === 'to-login'
      ? 'opacity-0 translate-x-8 scale-[0.98] pointer-events-none'
      : transitionStage === 'entering' && transitionDirection === 'to-signup'
      ? 'opacity-0 translate-x-8 scale-[0.98]'
      : 'opacity-100 translate-x-0 scale-100';

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f8f9fa] via-[#f8f9fa] to-[#f8f9fa] flex flex-col justify-between items-center px-4 sm:px-6 py-5 sm:py-8 relative selection:bg-emerald-600 selection:text-white overflow-x-hidden">

      {/* Modern dot mesh and ambient glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] bg-gradient-to-tr from-emerald-300/20 via-teal-200/15 to-emerald-100/25 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation Bar: Back Link Positioned Cleanly at Top-Left & Enterprise Badge */}
      <header className="w-full max-w-6xl flex items-center justify-between z-20 mb-3 sm:mb-6">
        <button
          id="btn-back-to-landing"
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-white/95 hover:bg-white backdrop-blur-md border border-slate-200/90 hover:border-emerald-300 px-3.5 sm:px-4 py-2 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer group whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 group-hover:-translate-x-1 transition-transform shrink-0" />
          <span className="hidden sm:inline">Back to Home Overview</span>
          <span className="sm:hidden">Back to Home</span>
        </button>

      </header>

      {/* Main Center Form Area */}
      <main className="w-full flex-1 flex flex-col justify-center items-center py-2 z-10 animate-module-fade-in">
        {viewMode === 'login' ? (
          /* ========================================================== */
          /* 2-COLUMN SPLIT SCREEN LOGIN LAYOUT                         */
          /* ========================================================== */
          <div className={`w-full max-w-5xl bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(5,150,105,0.08),0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px] transition-all duration-300 ease-out will-change-transform ${loginAnimationClass}`}>
            {/* ========================================================== */}
            {/* LEFT COLUMN: VISUAL ARTWORK & ANIMATED SHOWCASE (lg:col-5) */}
            {/* ========================================================== */}
            <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 sm:p-10 bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#143728] text-white relative overflow-hidden select-none">
              {/* Background ambient mesh and animated glowing orbs */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
              <div className="absolute -top-14 -left-14 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
              <div className="absolute -bottom-14 -right-14 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '1.5s' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-emerald-300/10 rounded-full blur-2xl animate-ping pointer-events-none" style={{ animationDuration: '7s' }} />

              {/* Top Badge with Live Radar Pulse */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-[#d8f3dc] border border-white/20 backdrop-blur-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span>Unified Workforce Platform</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-200/80 bg-black/20 px-2 py-0.5 rounded-md border border-white/10">
                  SYS_ONLINE
                </span>
            </div>

              {/* Middle Showcase Graphic: Animated Enterprise Workspace Illustration */}
              <div className="relative z-10 my-auto py-2 flex flex-col justify-center space-y-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                    Workforce &amp; Operations in Sync.
                  </h2>
                  <p className="text-xs text-emerald-100/80 leading-relaxed font-medium mt-1">
                    Smart shift tracking, leave approvals, automated statutory payroll, and team self-service.
            </p>
          </div>

                {/* Animated Workspace & Dashboard Vector Illustration */}
                <div className="relative my-2 py-3 flex items-center justify-center">
                  <div className="relative w-full max-w-[320px] aspect-[4/3] flex items-center justify-center">
                    {/* Floating Ambient Glowing Halo */}
                    <div
                      className="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 via-teal-300/10 to-transparent rounded-full blur-2xl animate-pulse pointer-events-none"
                      style={{ animationDuration: '4s' }}
                    />

                    {/* SVG Workspace & Team Illustration */}
                    <svg
                      viewBox="0 0 400 300"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full h-full drop-shadow-2xl animate-float-subtle"
                    >
                      {/* Base Platform / Desk Glow */}
                      <ellipse cx="200" cy="265" rx="150" ry="18" fill="rgba(0,0,0,0.22)" />

                      {/* Central Modern Monitor / Tablet Device */}
                      <rect
                        x="70"
                        y="45"
                        width="260"
                        height="175"
                        rx="16"
                        fill="#0d2818"
                        stroke="#52b788"
                        strokeWidth="2"
                        strokeOpacity="0.4"
                      />

                      {/* Device Top Bar */}
                      <rect x="70" y="45" width="260" height="24" rx="16" fill="#1b4332" />
                      <circle cx="92" cy="57" r="4" fill="#ef4444" opacity="0.8" />
                      <circle cx="106" cy="57" r="4" fill="#f59e0b" opacity="0.8" />
                      <circle cx="120" cy="57" r="4" fill="#10b981" opacity="0.8" />
                      <rect x="145" y="52" width="110" height="10" rx="5" fill="rgba(255,255,255,0.15)" />

                      {/* Dashboard Screen Content - Stat Card 1: Attendance Growth */}
                      <rect
                        x="88"
                        y="82"
                        width="105"
                        height="58"
                        rx="8"
                        fill="#163e2d"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                      />
                      <rect x="98" y="92" width="40" height="6" rx="3" fill="#95d5b2" />
                      {/* Mini Bar Chart with varied heights */}
                      <rect x="98" y="112" width="8" height="18" rx="2" fill="#52b788" opacity="0.6" />
                      <rect x="112" y="106" width="8" height="24" rx="2" fill="#52b788" opacity="0.8" />
                      <rect x="126" y="116" width="8" height="14" rx="2" fill="#52b788" opacity="0.5" />
                      <rect x="140" y="102" width="8" height="28" rx="2" fill="#74c69d" />
                      <rect x="154" y="98" width="8" height="32" rx="2" fill="#b7e4c7" />
                      <rect x="168" y="108" width="8" height="22" rx="2" fill="#52b788" opacity="0.7" />

                      {/* Dashboard Screen Content - Stat Card 2: Team Members Donut / Circle */}
                      <rect
                        x="207"
                        y="82"
                        width="105"
                        height="58"
                        rx="8"
                        fill="#163e2d"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                      />
                      <rect x="217" y="92" width="45" height="6" rx="3" fill="#95d5b2" />
                      <circle cx="275" cy="118" r="16" stroke="#2d6a4f" strokeWidth="5" fill="none" />
                      <circle
                        cx="275"
                        cy="118"
                        r="16"
                        stroke="#74c69d"
                        strokeWidth="5"
                        strokeDasharray="60 100"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <circle cx="275" cy="118" r="5" fill="#d8f3dc" />

                      {/* Live Activity Row on Dashboard */}
                      <rect x="88" y="152" width="224" height="22" rx="6" fill="#123824" />
                      <circle cx="102" cy="163" r="5" fill="#52b788" />
                      <rect x="114" y="160" width="75" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
                      <rect x="245" y="158" width="55" height="10" rx="5" fill="#2d6a4f" />
                      <rect x="252" y="161" width="40" height="4" rx="2" fill="#b7e4c7" />

                      <rect x="88" y="180" width="224" height="22" rx="6" fill="#123824" />
                      <circle cx="102" cy="191" r="5" fill="#74c69d" />
                      <rect x="114" y="188" width="90" height="6" rx="3" fill="rgba(255,255,255,0.4)" />
                      <rect x="255" y="186" width="45" height="10" rx="5" fill="#1b4332" />
                      <rect x="260" y="189" width="35" height="4" rx="2" fill="#95d5b2" />

                      {/* Device Stand */}
                      <path d="M175 220 L165 255 L235 255 L225 220 Z" fill="#1b4332" opacity="0.9" />
                      <rect x="150" y="254" width="100" height="6" rx="3" fill="#2d6a4f" />
                    </svg>

                    {/* Floating Card 1 (Top Right) */}
                    <div
                      className="absolute -top-2 -right-3 sm:-right-4 bg-white/15 border border-white/25 backdrop-blur-md rounded-2xl p-2.5 shadow-lg flex items-center gap-2 text-white animate-float-subtle pointer-events-none"
                      style={{ animationDuration: '3.5s' }}
                    >
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-[#d8f3dc]" />
                  </div>
                  <div>
                        <p className="text-[10px] font-bold leading-tight">Payroll &amp; Leaves</p>
                        <p className="text-[9px] text-emerald-200/70">Synced in real-time</p>
                  </div>
                </div>

                    {/* Floating Card 2 (Bottom Left) */}
                    <div
                      className="absolute -bottom-1 -left-3 sm:-left-4 bg-white/15 border border-white/25 backdrop-blur-md rounded-2xl p-2.5 shadow-lg flex items-center gap-2 text-white pointer-events-none"
                      style={{ animation: 'floatSubtle 4.5s ease-in-out infinite 1s' }}
                    >
                      <div className="w-7 h-7 rounded-xl bg-teal-500/30 border border-teal-400/40 flex items-center justify-center text-teal-200">
                        <Users className="w-4 h-4 text-[#d8f3dc]" />
              </div>
                      <div>
                        <p className="text-[10px] font-bold leading-tight">Team Operations</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-[9px] font-semibold text-emerald-200">Active Workspace</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Highlight Badges */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs">
                    <p className="text-[11px] font-bold text-white">Statutory Ready</p>
                    <p className="text-[9px] text-emerald-200/70">PF, ESIC, PT &amp; TDS</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs">
                    <p className="text-[11px] font-bold text-white">Cloud Multi-Tenant</p>
                    <p className="text-[9px] text-emerald-200/70">Strict Data Privacy</p>
                  </div>
                </div>
              </div>

              {/* Bottom Security Footer */}
              <div className="relative z-10 pt-3.5 border-t border-white/15 flex items-center gap-2 text-[11px] text-emerald-200/80">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Multi-Tenant Data Isolation &amp; Role-Based Security</span>
              </div>
            </div>

            {/* ========================================================== */}
            {/* RIGHT COLUMN: LOGIN FORM (lg:col-span-7)                   */}
            {/* ========================================================== */}
            <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
              <div>
                {/* Brand Header Inside Card */}
                <div className="mb-7">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs p-1">
                      <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="text-base font-black text-slate-900 tracking-tight block leading-tight">
                        MyOwn HRMS
                      </span>
                      <span className="text-[10px] font-bold text-[#2d6a4f] uppercase tracking-wider block">
                        Workforce Portal
                      </span>
                    </div>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Sign In to Workspace
                  </h1>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    Enter your work email, mobile number or employee code.
                  </p>
                </div>

            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

                {/* Login Form */}
              <form
                onSubmit={handleLoginSubmit}
                className="space-y-4"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
              >
                {/* Trap inputs to absorb browser autofill and auto-detection */}
                <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}>
                  <input type="text" name="fake_user_trap_login" tabIndex={-1} autoComplete="off" />
                  <input type="password" name="fake_pwd_trap_login" tabIndex={-1} autoComplete="new-password" />
                </div>

                {/* Identifier Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="input-login-identifier" className="text-xs font-bold text-slate-700">
                        Work Email, Mobile or Employee Code
                    </label>
                    {fieldErrors.identifier && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.identifier}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="input-login-identifier"
                      name="paneliya_fld_usr_noautofill"
                      type="text"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      readOnly={loginIdentifierReadOnly}
                      onFocus={() => setLoginIdentifierReadOnly(false)}
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        clearFieldError('identifier');
                      }}
                        placeholder="Enter email, mobile number or employee code"
                      className={`w-full h-12 pl-11 pr-4 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${
                        fieldErrors.identifier
                          ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                      }`}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="input-login-password" className="text-xs font-bold text-slate-700">
                      Password
                    </label>
                      {fieldErrors.password && (
                        <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {fieldErrors.password}
                        </span>
                      )}
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-login-password"
                      name="paneliya_fld_pwd_noautofill"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      readOnly={loginPasswordReadOnly}
                      onFocus={() => setLoginPasswordReadOnly(false)}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                      }}
                      placeholder="••••••••"
                      className={`w-full h-12 pl-11 pr-11 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${
                        fieldErrors.password
                          ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                      }`}
                    />
                    <button
                      id="btn-toggle-login-password"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                    <div className="flex justify-end mt-1.5">
                      <button
                        id="btn-forgot-password"
                        type="button"
                        onClick={handleOpenForgot}
                        className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 hover:underline cursor-pointer transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                  id="btn-submit-login"
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 group whitespace-nowrap shrink-0"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing In to Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                </form>
              </div>

                {/* Bottom Switcher: Register Company */}
              <div className="pt-6 mt-6 border-t border-slate-100 text-center sm:text-left">
                  <p className="text-xs text-slate-500 font-medium">
                    Are you a Company Owner?{' '}
                    <button
                      id="link-switch-to-signup"
                      type="button"
                      onClick={handleSwitchToSignup}
                    disabled={isTransitioning}
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline px-1 py-0.5 rounded transition-colors cursor-pointer inline-flex items-center gap-1 group disabled:opacity-50"
                    >
                      <span>Register Your Company Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </p>
                </div>
            </div>
          </div>
        ) : (
          /* ========================================================== */
          /* SIGNUP & PENDING APPROVAL CONTAINER                        */
          /* ========================================================== */
          <div className={`w-full ${viewMode === 'signup' ? 'max-w-2xl' : 'max-w-lg'} transition-all duration-300 ease-out will-change-transform ${signupAnimationClass}`}>
            {/* Luxury Card */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(5,150,105,0.08),0_1px_3px_rgba(0,0,0,0.05)] p-6 sm:p-9">
              {/* Internal Brand Header Row */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs p-1">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-base font-black text-slate-900 tracking-tight block leading-tight">
                      MyOwn HRMS
                    </span>
                    <span className="text-[10px] font-bold text-[#2d6a4f] uppercase tracking-wider block">
                      {viewMode === 'signup' ? 'Company Workspace Setup' : 'Registration Status'}
                    </span>
                  </div>
                </div>
                {viewMode === 'signup' && (
                  <button
                    id="btn-back-to-login-sides"
                    type="button"
                    onClick={handleSwitchToLogin}
                    disabled={isTransitioning}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 disabled:opacity-50 group py-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back to Sign In</span>
                  </button>
                )}
              </div>

            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {viewMode === 'registration_pending' ? (
              /* ========================================================== */
              /* PENDING APPROVAL CONFIRMATION VIEW                         */
              /* ========================================================== */
              <div className="py-2 text-center animate-in fade-in zoom-in-95 duration-200">
                {/* Success Badge Icon */}
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Company Registration Submitted!
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your company registration request has been successfully recorded.
                </p>

                {/* Informational Text Box */}
                <div className="my-5 p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/50 border border-emerald-200 text-left space-y-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Pending Administrator Approval
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        Your company <strong className="text-slate-900 font-bold">{registeredCompanyInfo.companyName}</strong> has been registered successfully.
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Your workspace is currently under review by the administrator. Once your company registration is approved by the admin, you will be able to log in to your account.
                      </p>
                    </div>
                  </div>

                  {registeredCompanyInfo.ownerEmail && (
                    <div className="pt-3 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-600">
                      <span>Registered Admin Email:</span>
                      <span className="font-mono font-bold text-slate-900 break-all">{registeredCompanyInfo.ownerEmail}</span>
                    </div>
                  )}
                </div>

                {/* Back to Login Page Button */}
                <div className="pt-1">
                  <button
                    id="btn-back-to-login-after-reg"
                    type="button"
                    onClick={handleSwitchToLogin}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Login Page</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================== */
              /* COMPANY REGISTRATION FORM (Only Company Owner Onboards)     */
              /* ========================================================== */
              <form
                onSubmit={handleRegisterCompanySubmit}
                className="space-y-4"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              >
                {/* Trap inputs to absorb browser autofill */}
                <div
                  style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
                  aria-hidden="true"
                >
                  <input type="text" name="fake_username_trap" tabIndex={-1} autoComplete="off" />
                  <input type="password" name="fake_password_trap" tabIndex={-1} autoComplete="new-password" />
                </div>
                {/* Employee Warning Notice */}
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs text-slate-800 flex items-start gap-2.5 shadow-2xs">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900">Important for Staff Employees:</p>
                    <p className="text-[11px] text-amber-800/90 mt-0.5 leading-snug">
                      Employees <strong>cannot self-register</strong> here. Only new <strong>Company Owners</strong> register their company. Once registered, the owner will add your Email or Phone in their Owner Dashboard, enabling your employee login.
                    </p>
                  </div>
                </div>

                {/* Section 1: Company Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      1. Company Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Company Legal Name <span className="text-red-500">*</span>
                        </label>
                        {fieldErrors.companyName && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.companyName}
                          </span>
                        )}
                      </div>
                      <input
                        id="input-company-name"
                        name="reg_company_legal_name"
                        type="text"
                        required
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          clearFieldError('companyName');
                        }}
                        placeholder="e.g. Paneliya Infotech Pvt Ltd"
                        className={`w-full h-11 px-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${fieldErrors.companyName
                          ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                          }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          GSTIN / Tax ID <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                        </label>
                        {fieldErrors.companyGst && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.companyGst}
                          </span>
                        )}
                      </div>
                      <input
                        id="input-company-gst"
                        name="reg_company_tax_gstin"
                        type="text"
                        maxLength={15}
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={companyGst}
                        onChange={(e) => {
                          setCompanyGst(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15));
                          clearFieldError('companyGst');
                        }}
                        placeholder="e.g. 24AAAAA0000A1Z5"
                        className={`w-full h-11 px-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all uppercase ${fieldErrors.companyGst
                          ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                          }`}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">15-char format (e.g. 24AAAAA0000A1Z5)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Industry Sector</label>
                      <CustomSelect
                        id="select-company-industry"
                        value={companyIndustry}
                        onChange={(val) => setCompanyIndustry(val)}
                        options={INDUSTRY_OPTIONS}
                        placeholder="Select Industry Sector"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Office Address</label>
                      <input
                        id="input-company-address"
                        name="reg_company_office_address"
                        type="text"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="e.g. 402, Ring Road"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                      <input
                        id="input-company-city"
                        name="reg_company_office_city"
                        type="text"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={companyCity}
                        onChange={(e) => setCompanyCity(e.target.value)}
                        placeholder="e.g. Surat"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                      <input
                        id="input-company-state"
                        name="reg_company_office_state"
                        type="text"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={companyState}
                        onChange={(e) => setCompanyState(e.target.value)}
                        placeholder="e.g. Gujarat"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Owner Account */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      2. Company Owner & Administrator Account
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        {fieldErrors.ownerFirstName && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.ownerFirstName}
                          </span>
                        )}
                      </div>
                      <input
                        id="input-owner-firstname"
                        name="reg_owner_given_name"
                        type="text"
                        required
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={ownerFirstName}
                        onChange={(e) => {
                          setOwnerFirstName(e.target.value);
                          clearFieldError('ownerFirstName');
                        }}
                        placeholder="e.g. Ravi"
                        className={`w-full h-11 px-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${fieldErrors.ownerFirstName
                          ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                          }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        {fieldErrors.ownerLastName && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.ownerLastName}
                          </span>
                        )}
                      </div>
                      <input
                        id="input-owner-lastname"
                        name="reg_owner_family_name"
                        type="text"
                        required
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        value={ownerLastName}
                        onChange={(e) => {
                          setOwnerLastName(e.target.value);
                          clearFieldError('ownerLastName');
                        }}
                        placeholder="e.g. Paneliya"
                        className={`w-full h-11 px-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${fieldErrors.ownerLastName
                          ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                          }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Official Owner Email <span className="text-red-500">*</span>
                        </label>
                        {fieldErrors.ownerEmail && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.ownerEmail}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="input-owner-email"
                          name="reg_owner_primary_email"
                          type="email"
                          required
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          value={ownerEmail}
                          onChange={(e) => {
                            setOwnerEmail(e.target.value);
                            clearFieldError('ownerEmail');
                          }}
                          placeholder="owner@company.com"
                          className={`w-full h-11 pl-9 pr-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${fieldErrors.ownerEmail
                            ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                            }`}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        {fieldErrors.ownerPhone && (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {fieldErrors.ownerPhone}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="input-owner-phone"
                          name="reg_owner_mobile_number"
                          type="tel"
                          maxLength={13}
                          required
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          value={ownerPhone}
                          onChange={(e) => {
                            setOwnerPhone(e.target.value.replace(/[^0-9+\s]/g, '').slice(0, 13));
                            clearFieldError('ownerPhone');
                          }}
                          placeholder="9876543210"
                          className={`w-full h-11 pl-9 pr-3.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all ${fieldErrors.ownerPhone
                            ? 'border-rose-400 ring-4 ring-rose-500/10 bg-rose-50/20'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                            }`}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">10-digit Indian mobile number (e.g. 9876543210)</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 text-xs text-emerald-900 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-950">Secure Automated Provisioning</p>
                      <p className="text-[11px] text-emerald-800/90 mt-0.5">Your official account login password will be securely generated and sent directly to your registered email address.</p>
                    </div>
                  </div>
                </div>

                {/* Submit Sign Up Button */}
                <button
                  id="btn-submit-company-register"
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Company & Onboarding Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Register Company &amp; Launch Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Switcher Link (for Signup Mode) */}
            {viewMode === 'signup' && (
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs font-medium text-slate-500">
                  Already have an account?{' '}
                  <button
                    id="link-switch-to-login"
                    type="button"
                    onClick={handleSwitchToLogin}
                    disabled={isTransitioning}
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline px-1 py-0.5 rounded transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Security & Trust Badges */}
          
            </div>
      )}
    </main>

     

      {/* ================================================================ */}
      {/* FORGOT PASSWORD MODAL: Enter Email to Trigger Reset Link API     */}
      {/* ================================================================ */}
      {forgotModalOpen && (
        <div
          id="modal-forgot-password-backdrop"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !forgotLoading) {
              setForgotModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative animate-in zoom-in-95 duration-200"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              disabled={forgotLoading}
              className="absolute right-4 top-4 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {forgotSuccess ? (
              <div className="text-center py-2 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
            </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Reset Link Sent!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {forgotSuccess}
                  </p>
          </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-left space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                    <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Recipient Email:</span>
        </div>
                  <p className="font-mono text-emerald-800 font-semibold break-all pl-5">
                    {forgotEmail}
                  </p>
                  <p className="text-[11px] text-slate-600 pl-5">
                    Please check your Gmail / Inbox (and Spam folder). Follow the link in the email to set your new password.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Back to Workspace Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSuccess(null);
                      setForgotError(null);
                    }}
                    className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Resend link or use another email
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3.5 pr-8">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                      Forgot Password?
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      Enter your registered email address to receive password reset instructions.
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {forgotError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label htmlFor="input-modal-forgot-email" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="input-modal-forgot-email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder="e.g. user@company.com"
                      className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full h-11 mt-1 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel and Return to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* BOTTOM POPUP: "You are not part of any organization"             */}
      {/* ================================================================ */}
      {notInOrgPopup?.open && (
        <div
          id="not-in-org-bottom-popup"
          role="alert"
          aria-live="assertive"
          className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-50 animate-in slide-in-from-bottom duration-300 pointer-events-auto"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_20px_50px_rgba(6,45,31,0.15)] overflow-hidden">
            {/* Top alert header bar */}
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Access Restricted • Organization Required
                </span>
              </div>
              <button
                id="btn-close-not-in-org-popup"
                type="button"
                onClick={() => setNotInOrgPopup(null)}
                className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Popup Content */}
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                    You are not part of any organization
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    The email or ID <span className="font-mono bg-emerald-50 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">{notInOrgPopup.email}</span> has not been added to any company or organization yet.
                  </p>
                </div>
              </div>

              {/* Informative Guidance Box */}
              <div className="mt-3.5 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-[11px] uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>How to get access:</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  1. Contact your <strong>Company Administrator or HR</strong>.
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  2. Ask them to add your email using the <strong>Add Employee</strong> button in their company dashboard.
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  3. Once added, you will automatically be linked to their company workspace and can log in here!
                </p>
              </div>

              {/* Actions Row */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  id="btn-popup-try-another"
                  type="button"
                  onClick={() => {
                    setNotInOrgPopup(null);
                    setIdentifier('');
                    const inputEl = document.getElementById('input-login-identifier');
                    if (inputEl) inputEl.focus();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
                >
                  Try Another Email
                </button>
                <button
                  id="btn-popup-dismiss"
                  type="button"
                  onClick={() => setNotInOrgPopup(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
