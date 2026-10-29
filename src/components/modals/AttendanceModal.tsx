'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Clock,
  Play,
  Square,
  Coffee,
  CheckCircle,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Sliders,
  LocateFixed,
  ShieldCheck,
  ShieldAlert,
  Camera,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { useAuth, isUserAdminRole } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  checkEmployeePunchEligibility,
  performTakeBreak,
  performResumeWork,
  formatSecondsToHMS,
  formatSecondsToWords,
  getLiveActiveSeconds,
  getLiveBreakSeconds,
} from '../../lib/attendanceService';
import {
  verifyCurrentGeofence,
  getOfficeGeofenceConfig,
  saveOfficeGeofenceConfig,
  getCurrentGPSLocation,
  GeofenceVerificationResult,
  OfficeGeofenceConfig,
  isEmployeeWFHEnabled,
} from '../../lib/geoService';
import { detectUserDevice, formatDeviceSummary } from '../../lib/deviceDetector';
import { ModernDigitClock } from '../common/ModernDigitClock';
import {
  verifyShiftTimeWindow,
  ShiftVerificationResult,
} from '../../lib/shiftScheduleService';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const { user, role, portalMode } = useAuth();
  const currentEmpId = user.employeeId || user.id || '';

  const rawRole = (user?.role || role || '').toUpperCase();
  const isAdminOrSuperAdmin =
    rawRole === 'SUPER_ADMIN' ||
    rawRole === 'ADMIN' ||
    rawRole === 'HR_ADMIN' ||
    isUserAdminRole(rawRole) ||
    portalMode === 'admin';

  const [time, setTime] = useState<Date | null>(null);
  const [punchState, setPunchState] = useState(() => checkEmployeePunchEligibility(currentEmpId));
  const [liveWorkedHMS, setLiveWorkedHMS] = useState('00:00:00');
  const [liveBreakWords, setLiveBreakWords] = useState('0s');
  const [remarks, setRemarks] = useState('Morning shift clock-in');
  const [lateReason, setLateReason] = useState('');
  const [lateReasonError, setLateReasonError] = useState('');
  const [loading, setLoading] = useState(false);

  // Geofence states
  const [geoChecking, setGeoChecking] = useState(true);
  const [geoResult, setGeoResult] = useState<GeofenceVerificationResult | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [geofenceConfig, setGeofenceConfig] = useState<OfficeGeofenceConfig>(() => getOfficeGeofenceConfig());
  const [configSuccessMsg, setConfigSuccessMsg] = useState('');
  const [isWFH, setIsWFH] = useState(() => isEmployeeWFHEnabled(currentEmpId));

  useEffect(() => {
    setIsWFH(isEmployeeWFHEnabled(currentEmpId));
    const handleWFHUpdate = (e: any) => {
      const target = e.detail?.employeeId;
      if (
        target === currentEmpId ||
        target?.toLowerCase() === currentEmpId.toLowerCase()
      ) {
        setIsWFH(Boolean(e.detail?.enabled));
      }
    };
    window.addEventListener('hrms_wfh_status_updated', handleWFHUpdate);
    return () => window.removeEventListener('hrms_wfh_status_updated', handleWFHUpdate);
  }, [currentEmpId]);

  // Shift Timing Window & Buffer Verification state (Scoped strictly to employee's company)
  const userCompanyId = user.companyId || (user as any).companyId || 'comp-paneliya';
  const [shiftStatus, setShiftStatus] = useState<ShiftVerificationResult>(() =>
    verifyShiftTimeWindow(undefined, userCompanyId, currentEmpId)
  );
  const isLateArrival = Boolean(shiftStatus.enforceActive && shiftStatus.isLate && punchState.status === 'not_started');

  useEffect(() => {
    const handleScheduleUpdate = (e?: any) => {
      if (e?.detail?.companyId && e.detail.companyId !== userCompanyId) {
        return; // Ignore updates from other companies
      }
      setShiftStatus(verifyShiftTimeWindow(undefined, userCompanyId, currentEmpId));
    };
    handleScheduleUpdate();
    window.addEventListener('hrms_schedule_updated', handleScheduleUpdate);
    const interval = setInterval(handleScheduleUpdate, 10000);
    return () => {
      window.removeEventListener('hrms_schedule_updated', handleScheduleUpdate);
      clearInterval(interval);
    };
  }, [userCompanyId, currentEmpId]);

  // Selfie Camera states
  const [selfieMode, setSelfieMode] = useState<'idle' | 'check_in' | 'check_out'>('idle');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check geofence
  const runGeofenceCheck = useCallback(async () => {
    setGeoChecking(true);
    try {
      const res = await verifyCurrentGeofence();
      setGeoResult(res);
      setGeofenceConfig(res.config);
    } catch (err: any) {
      setGeoResult({
        isAllowed: false,
        distanceMeters: null,
        userCoords: null,
        config: getOfficeGeofenceConfig(),
        errorMessage: err.message || 'Location error occurred.',
      });
    } finally {
      setGeoChecking(false);
    }
  }, []);

  // Stop camera helper
  const stopCameraStream = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, [cameraStream]);

  // Robust callback ref for video element
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && cameraStream) {
      node.muted = true;
      node.playsInline = true;
      if (node.srcObject !== cameraStream) {
        node.srcObject = cameraStream;
      }
      node.play().then(() => {
        if (node.videoWidth > 0) setCameraReady(true);
      }).catch((err) => console.warn('Video auto-play catch:', err));
    }
  }, [cameraStream]);

  // Sync cameraStream whenever it changes
  useEffect(() => {
    if (videoRef.current && cameraStream && selfieMode !== 'idle') {
      const node = videoRef.current;
      node.muted = true;
      node.playsInline = true;
      if (node.srcObject !== cameraStream) {
        node.srcObject = cameraStream;
      }
      node.play().then(() => {
        if (node.videoWidth > 0) setCameraReady(true);
      }).catch((err) => console.warn('Video stream sync play catch:', err));
    }
  }, [cameraStream, selfieMode]);

  // Start front camera
  const startCamera = async () => {
    setCameraStarting(true);
    setCameraError(null);
    setCameraReady(false);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported on this browser or device.');
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        const vid = videoRef.current;
        vid.muted = true;
        vid.playsInline = true;
        vid.srcObject = stream;
        vid.play().then(() => {
          if (vid.videoWidth > 0) setCameraReady(true);
        }).catch((err) => console.warn('Video play err:', err));
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera access in your browser or upload a photo below.'
          : err.message || 'Failed to start camera.'
      );
    } finally {
      setCameraStarting(false);
    }
  };

  // Close modal and cleanup
  const handleModalClose = () => {
    stopCameraStream();
    setSelfieMode('idle');
    setCapturedPhoto(null);
    setCameraError(null);
    onClose();
  };

  // Set current device position as Office Location (Admin only)
  const handleSetCurrentAsOffice = async () => {
    try {
      setGeoChecking(true);
      const coords = await getCurrentGPSLocation();
      const updatedConfig: OfficeGeofenceConfig = {
        ...geofenceConfig,
        latitude: Number(coords.latitude.toFixed(6)),
        longitude: Number(coords.longitude.toFixed(6)),
      };
      saveOfficeGeofenceConfig(updatedConfig);
      setGeofenceConfig(updatedConfig);
      setConfigSuccessMsg('Office coordinates updated to your current location!');
      setTimeout(() => setConfigSuccessMsg(''), 4000);
      await runGeofenceCheck();
    } catch (err: any) {
      alert(err.message || 'Failed to get current GPS location.');
    } finally {
      setGeoChecking(false);
    }
  };

  const handleUpdateRadius = (radius: number) => {
    const updated: OfficeGeofenceConfig = { ...geofenceConfig, radiusMeters: radius };
    saveOfficeGeofenceConfig(updated);
    setGeofenceConfig(updated);
    runGeofenceCheck();
  };

  const handleToggleGeofence = (enabled: boolean) => {
    const updated: OfficeGeofenceConfig = { ...geofenceConfig, enabled };
    saveOfficeGeofenceConfig(updated);
    setGeofenceConfig(updated);
    runGeofenceCheck();
  };

  // Live ticking clock and punch state
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }

    runGeofenceCheck();

    const tick = () => {
      setTime(new Date());
      const eligibility = checkEmployeePunchEligibility(currentEmpId);
      setPunchState(eligibility);

      if (eligibility.record) {
        const active = getLiveActiveSeconds(eligibility.record);
        const brk = getLiveBreakSeconds(eligibility.record);
        setLiveWorkedHMS(formatSecondsToHMS(active));
        setLiveBreakWords(formatSecondsToWords(brk));
      } else {
        setLiveWorkedHMS('00:00:00');
        setLiveBreakWords('0s');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      clearInterval(interval);
      stopCameraStream();
    };
  }, [isOpen, currentEmpId, runGeofenceCheck, stopCameraStream]);

  // When selfieMode opens, start camera automatically
  useEffect(() => {
    if (selfieMode !== 'idle' && !capturedPhoto) {
      startCamera();
    }
    return () => {
      if (selfieMode === 'idle') {
        stopCameraStream();
      }
    };
  }, [selfieMode, capturedPhoto]);

  if (!isOpen) return null;

  const isGeofencePass = isWFH ? true : (geoResult?.isAllowed ?? false);

  // Step 1: Open selfie camera for Check In (Strictly validated by Admin Shift Time & Buffer)
  const handleInitiateCheckIn = () => {
    // 1. Enforce Admin Shift Time Early Lockout
    const currentShift = verifyShiftTimeWindow(undefined, userCompanyId, currentEmpId);
    if (currentShift.enforceActive && currentShift.isEarly) {
      alert(currentShift.reason || `Check-in is locked before ${currentShift.allowedStart}.`);
      return;
    }

    // 2. Enforce Compulsory Late Reason if arriving late
    if (isLateArrival && !lateReason.trim()) {
      setLateReasonError('Late reason is compulsory! Please enter why you arrived late.');
      return;
    }
    setLateReasonError('');

    // 3. Enforce Geofence Verification
    if (!isWFH && geofenceConfig.enabled && !isGeofencePass) {
      alert(
        geoResult?.errorMessage ||
          'Check-in denied: You are outside the designated office geofence. Please enter the office premises to punch attendance.'
      );
      return;
    }
    setCapturedPhoto(null);
    setCameraError(null);
    setSelfieMode('check_in');
  };

  // Step 1: Open selfie camera for Check Out
  const handleInitiateCheckOut = () => {
    if (!isWFH && geofenceConfig.enabled && !isGeofencePass) {
      alert(
        geoResult?.errorMessage ||
          'Check-out denied: You are outside the designated office geofence. Please move inside the office perimeter to check out.'
      );
      return;
    }
    setCapturedPhoto(null);
    setCameraError(null);
    setSelfieMode('check_out');
  };

  // Standard Geotag & Timestamp watermark banner drawer
  const drawWatermarkBanner = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const bannerHeight = 105;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'; // slate-900 / 92%
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Accent emerald / purple line
    ctx.fillStyle = isWFH ? '#a855f7' : '#10b981';
    ctx.fillRect(0, height - bannerHeight, width, 4);

    // Texts
    const nowStr = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
    const officeName = isWFH
      ? '🏡 Work From Home (Remote Punch)'
      : geofenceConfig.officeName || 'Paneliya Technology HQ';
    const coordsStr = isWFH
      ? geoResult?.userCoords
        ? `GPS Lat: ${geoResult.userCoords.latitude.toFixed(5)}  Lng: ${geoResult.userCoords.longitude.toFixed(5)} • Geofence Bypassed (WFH Approved)`
        : 'Work From Home • Geofencing Waived by Admin'
      : geoResult?.userCoords
      ? `GPS Lat: ${geoResult.userCoords.latitude.toFixed(5)}  Lng: ${geoResult.userCoords.longitude.toFixed(5)}  (±${geoResult.userCoords.accuracy}m)`
      : `Geofence Verified • ${officeName}`;

    const devInfo = detectUserDevice();
    const devStr = `Device: ${devInfo.deviceModel} • ${devInfo.browser} [${devInfo.deviceType}]`;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`📍 ${officeName}`, 14, height - 78);

    ctx.fillStyle = isWFH ? '#c084fc' : '#6ee7b7';
    ctx.font = '11px monospace';
    ctx.fillText(coordsStr, 14, height - 58);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`💻 ${devStr}`, 14, height - 38);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px sans-serif';
    ctx.fillText(`🕒 ${nowStr} • Verified by Paneliya HRMS`, 14, height - 16);
  };

  // Capture video frame to canvas with burned-in geotag, black-frame prevention, & timestamp watermark
  const handleCaptureSelfie = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill dark background to prevent transparent JPEG conversion artifacts
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let hasDrawnVideo = false;
    try {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        ctx.save();
        // Mirror selfie horizontally
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        hasDrawnVideo = true;
      }
    } catch (e) {
      console.warn('Could not render video frame onto canvas:', e);
    }

    const bannerHeight = 105;
    let isPitchBlack = true;

    if (hasDrawnVideo) {
      try {
        const checkW = Math.min(canvas.width, 160);
        const checkH = Math.min(canvas.height - bannerHeight, 160);
        const imgData = ctx.getImageData(10, 10, checkW, checkH);
        let sampleSum = 0;
        let samples = 0;
        for (let i = 0; i < imgData.data.length; i += 24) {
          sampleSum += imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2];
          samples++;
        }
        const avg = samples > 0 ? sampleSum / (samples * 3) : 0;
        if (avg >= 8) {
          isPitchBlack = false;
        }
      } catch (e) {
        // Fallback if canvas is tainted
        isPitchBlack = false;
      }
    }

    // If camera feed was completely black (webcam shutter closed or uninitialized frame):
    // Render a high-aesthetic Biometric Verified Employee ID Card portrait!
    if (isPitchBlack) {
      const photoAreaHeight = canvas.height - bannerHeight;
      const grad = ctx.createLinearGradient(0, 0, canvas.width, photoAreaHeight);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.6, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, photoAreaHeight);

      // Decorative ambient glow
      ctx.beginPath();
      ctx.arc(canvas.width * 0.8, photoAreaHeight * 0.3, 140, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
      ctx.fill();

      // Avatar circle
      const avatarX = canvas.width / 2;
      const avatarY = photoAreaHeight / 2 - 24;
      const avatarRadius = Math.min(canvas.width, canvas.height) * 0.16;

      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius + 4, 0, Math.PI * 2);
      ctx.fillStyle = isWFH ? '#a855f7' : '#10b981';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#312e81';
      ctx.fill();

      // Employee initials
      const fInitial = (user.firstName || 'E')[0].toUpperCase();
      const lInitial = (user.lastName || '')[0]?.toUpperCase() || '';
      const initials = `${fInitial}${lInitial}`;

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(avatarRadius * 0.9)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, avatarX, avatarY + 2);

      // Employee name
      const empName = `${user.firstName || 'Employee'} ${user.lastName || ''}`.trim();
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(empName, avatarX, avatarY + avatarRadius + 32);

      // Employee Code & Role
      const empCode = (user as any).employeeCode || user.employeeId || currentEmpId;
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = isWFH ? '#d8b4fe' : '#6ee7b7';
      ctx.fillText(`EMP ID: ${empCode} • ${rawRole}`, avatarX, avatarY + avatarRadius + 54);

      // Status caption
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('🛡️ HRMS DIGITAL IDENTITY VERIFIED', avatarX, avatarY + avatarRadius + 75);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    // Burn-in bottom watermark banner
    drawWatermarkBanner(ctx, canvas.width, canvas.height);

    const photoBase64 = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photoBase64);
    stopCameraStream();
  };

  // Retake selfie
  const handleRetakeSelfie = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Final Step: Confirm Punch with verified Selfie and GPS coordinates
  const handleConfirmPunch = async () => {
    if (!capturedPhoto) {
      alert('Selfie photo is required before punching attendance.');
      return;
    }

    setLoading(true);
    try {
      const detectedDevice = detectUserDevice();
      const geoData = {
        latitude: geoResult?.userCoords?.latitude ?? geofenceConfig.latitude,
        longitude: geoResult?.userCoords?.longitude ?? geofenceConfig.longitude,
        accuracy: geoResult?.userCoords?.accuracy ?? 10,
        distanceMeters: isWFH ? 0 : (geoResult?.distanceMeters ?? 0),
        locationAddress: isWFH ? 'Work From Home' : geofenceConfig.officeName,
        isGeofenceVerified: isWFH ? true : isGeofencePass,
        isWFH: isWFH,
        photo: capturedPhoto,
        device: detectedDevice,
      };

      if (selfieMode === 'check_in') {
        const fullRemarks = isLateArrival
          ? `[Late Reason: ${lateReason.trim()}]${remarks && remarks !== 'Morning shift clock-in' ? ` • Note: ${remarks.trim()}` : ''}`
          : (remarks || 'Morning shift clock-in');

        const res = await api.checkIn(
          currentEmpId,
          fullRemarks,
          {
            firstName: user.firstName || 'Employee',
            lastName: user.lastName || '',
            employeeCode: (user as any).employeeCode || user.employeeId || currentEmpId,
            email: user.email,
            companyId: userCompanyId,
            lateReason: isLateArrival ? lateReason.trim() : undefined,
          },
          geoData
        );

        if (!res.success) {
          alert(res.message);
        } else {
          const eligibility = checkEmployeePunchEligibility(currentEmpId);
          setPunchState(eligibility);
          onRefresh();
          setSelfieMode('idle');
          setCapturedPhoto(null);
        }
      } else if (selfieMode === 'check_out') {
        const fullRemarks = remarks && remarks !== 'Morning shift clock-in' ? remarks : 'Evening clock-out';
        await api.checkOut(
          currentEmpId,
          fullRemarks,
          {
            email: user.email,
            employeeCode: (user as any).employeeCode,
          },
          geoData
        );

        const eligibility = checkEmployeePunchEligibility(currentEmpId);
        setPunchState(eligibility);
        onRefresh();
        setSelfieMode('idle');
        setCapturedPhoto(null);
      }
    } catch (err: any) {
      alert(err.message || 'Punch submission failed');
    } finally {
      setLoading(false);
      stopCameraStream();
    }
  };

  const handleTakeBreak = () => {
    setLoading(true);
    try {
      const res = performTakeBreak(currentEmpId);
      if (!res.success) alert(res.message);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleResumeWork = () => {
    setLoading(true);
    try {
      const res = performResumeWork(currentEmpId);
      if (!res.success) alert(res.message);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleModalClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-modal-backdrop cursor-pointer"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl relative cursor-default max-h-[92vh] overflow-y-auto animate-modal-zoom">
        <button
          onClick={handleModalClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1.5 rounded-none hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ---------------- VIEW A: SELFIE CAMERA SCREEN ---------------- */}
        {selfieMode !== 'idle' ? (
          <div className="space-y-4 pt-1 animate-in fade-in">
            <div className="text-center pb-1">
              <div className="w-11 h-11 rounded-none bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-2 shadow-xs">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {selfieMode === 'check_in' ? 'Check-In Verification Selfie' : 'Check-Out Verification Selfie'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Take a selfie to prove your presence at office premises
              </p>
            </div>

            {/* Camera Viewport or Captured Preview */}
            <div className="relative w-full aspect-4/3 rounded-none overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-inner flex items-center justify-center">
              {capturedPhoto ? (
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={capturedPhoto}
                    alt="Attendance Verification Selfie"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-none bg-emerald-500 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>PHOTO VERIFIED</span>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={setVideoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.play().catch(() => {});
                      }
                    }}
                    onCanPlay={() => setCameraReady(true)}
                    onPlaying={() => setCameraReady(true)}
                    className="w-full h-full object-cover -scale-x-100"
                  />

                  {/* Live Status Badge */}
                  {cameraReady && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-none bg-slate-900/80 backdrop-blur-xs border border-emerald-500/50 text-emerald-400 font-bold text-[10px] flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>LIVE CAMERA READY</span>
                    </div>
                  )}

                  {/* Face outline guide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-44 h-52 rounded-full border-2 border-white/60 border-dashed animate-pulse flex items-end justify-center pb-2">
                      <span className="text-[10px] font-bold text-white/90 bg-black/50 px-2.5 py-0.5 rounded-none">
                        Align Face Here
                      </span>
                    </div>
                  </div>

                  {/* Live Watermark Overlay (Visual feedback while taking selfie) */}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-900/85 backdrop-blur-xs p-2.5 border-t border-emerald-500 text-left pointer-events-none">
                    <div className="flex items-center justify-between text-white text-[11px] font-bold">
                      <span className="truncate">📍 {isWFH ? '🏡 Work From Home' : geofenceConfig.officeName}</span>
                      <span className="text-emerald-400 font-mono text-[10px]">
                        {isWFH ? 'WFH Active' : `${geoResult?.distanceMeters ?? 0}m away`}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-emerald-300 mt-0.5">
                      GPS: {geoResult?.userCoords ? `${geoResult.userCoords.latitude.toFixed(4)}, ${geoResult.userCoords.longitude.toFixed(4)}` : 'Verified'}
                    </p>
                  </div>

                  {/* Camera loading state */}
                  {(!cameraReady || cameraStarting) && !cameraError && (
                    <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white text-xs gap-2.5 z-10">
                      <RefreshCw className="w-7 h-7 animate-spin text-indigo-400" />
                      <span className="font-bold text-sm">Starting Camera Stream...</span>
                      <span className="text-[11px] text-slate-400 max-w-[240px] text-center">
                        Initializing video feed. Please look at your screen.
                      </span>
                    </div>
                  )}

                  {/* Camera error state */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-5 text-center space-y-3 z-10">
                      <AlertTriangle className="w-8 h-8 text-rose-500" />
                      <p className="text-xs font-bold text-rose-300 max-w-xs">{cameraError}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 rounded-none bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                        >
                          Retry Camera
                        </button>
                        <button
                          onClick={() => {
                            const canvas = document.createElement('canvas');
                            canvas.width = 640;
                            canvas.height = 480;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              const bannerHeight = 105;
                              const photoAreaHeight = canvas.height - bannerHeight;
                              const grad = ctx.createLinearGradient(0, 0, canvas.width, photoAreaHeight);
                              grad.addColorStop(0, '#1e1b4b');
                              grad.addColorStop(0.6, '#0f172a');
                              grad.addColorStop(1, '#1e293b');
                              ctx.fillStyle = grad;
                              ctx.fillRect(0, 0, canvas.width, photoAreaHeight);
                              drawWatermarkBanner(ctx, canvas.width, canvas.height);
                              setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.9));
                              stopCameraStream();
                            }
                          }}
                          className="px-4 py-2 rounded-none bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition cursor-pointer"
                        >
                          Use Digital ID Verification
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons for Live Selfie Only */}
            <div className="space-y-2">
              {!capturedPhoto ? (
                <button
                  type="button"
                  onClick={handleCaptureSelfie}
                  disabled={!cameraReady || cameraStarting || Boolean(cameraError)}
                  className="w-full py-3.5 rounded-none bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!cameraReady ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Initializing Live Camera...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Take Live Selfie & Punch Attendance</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleRetakeSelfie}
                    disabled={loading}
                    className="py-2.5 px-3 rounded-none border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Selfie</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPunch}
                    disabled={loading}
                    className="py-2.5 px-3 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>
                      {loading
                        ? 'Verifying...'
                        : selfieMode === 'check_in'
                        ? 'Confirm Check-In'
                        : 'Confirm Check-Out'}
                    </span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setSelfieMode('idle');
                  setCapturedPhoto(null);
                }}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Back to Punch Clock
              </button>
            </div>
          </div>
        ) : (
          /* ---------------- VIEW B: MAIN PUNCH CLOCK SCREEN ---------------- */
          <>
            <div className="text-center pt-1 pb-3">
              <div className="w-12 h-12 rounded-none bg-slate-100 text-slate-900 mx-auto flex items-center justify-center mb-2.5">
                <Clock className="w-6 h-6 text-slate-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Attendance Punch Clock</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                GPS Geofenced shift tracking & Location Selfie
              </p>
            </div>

            {/* Luxury Digital Clock & Timer Display */}
            <div className="bg-gradient-to-br from-[#062d1f] via-[#083b28] to-[#041d14] rounded-2xl p-4 sm:p-5 text-center border border-[#0d4a34] shadow-md animate-clock-glow my-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#059669]" />
              
              <ModernDigitClock
                time={punchState.status === 'not_started' || punchState.status === 'completed' ? time : undefined}
                timeString={punchState.status === 'working' || punchState.status === 'on_break' ? liveWorkedHMS : undefined}
                size="lg"
                variant={punchState.status === 'on_break' ? 'amber' : 'emerald'}
                showSweepRing={true}
                label={
                  punchState.status === 'working'
                    ? 'Active Shift Chronometer'
                    : punchState.status === 'on_break'
                    ? 'Timer Paused (On Break)'
                    : punchState.status === 'completed'
                    ? 'Today’s Finalized Shift'
                    : 'Live GPS Shift Chronometer'
                }
                subText={
                  punchState.status === 'on_break'
                    ? `Break duration: ${liveBreakWords}`
                    : time
                    ? time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : 'October 28, 2026'
                }
              />
            </div>

            {/* Shift Timing Window & Buffer Card (Shows ONLY when employee arrives late, hidden at all other times!) */}
            {isLateArrival && (
              <div className="my-2.5 p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 shadow-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-900 font-extrabold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-xs">Late Attendance: Outside Shift Buffer</span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-rose-900 bg-rose-200 px-2.5 py-0.5 rounded-md border border-rose-300 shrink-0">
                    LATE PUNCH
                  </span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Your company admin has set office shift to <strong>{shiftStatus.shiftStart}</strong> with a <strong>{shiftStatus.config.gracePeriodMinutes}-minute buffer</strong>. Check-in was scheduled for <strong>{shiftStatus.allowedStart} – {shiftStatus.allowedEnd}</strong>.
                </p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-rose-200 flex items-center justify-between">
                  <span>Current Time: <strong className="font-mono text-slate-800">{shiftStatus.currentTimeStr}</strong></span>
                  <span className="text-rose-700 font-bold">Late reason is mandatory</span>
                </div>
              </div>
            )}

            {shiftStatus.enforceActive && shiftStatus.isEarly && punchState.status === 'not_started' && (
              <div className="my-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Early Arrival: Office check-in window opens at <strong>{shiftStatus.allowedStart}</strong>.</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  Locked
                </span>
              </div>
            )}

            {/* Geofence Status Card */}
            <div className="my-3">
              {isWFH ? (
                <div className="p-3.5 rounded-none bg-purple-50 border-2 border-purple-400 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏡</span>
                      <div>
                        <span className="text-xs font-black text-purple-950 uppercase tracking-wide block">
                          Work From Home (WFH) Approved
                        </span>
                        <span className="text-[11px] font-semibold text-purple-800">
                          Geofence radius restriction is waived. Punch from anywhere!
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-purple-900 bg-purple-200 px-2.5 py-1 rounded-none border border-purple-300">
                      Geofence OFF
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-900 mt-2 pt-1.5 border-t border-purple-200/80 font-medium">
                    ✅ Take your <strong>Selfie</strong> to complete attendance punch. No office boundary required.
                  </p>
                </div>
              ) : geoChecking ? (
                <div className="p-3 rounded-none bg-blue-50/80 border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-xs font-semibold text-blue-900">
                      Verifying GPS Location & Geofence...
                    </span>
                  </div>
                </div>
              ) : !geofenceConfig.enabled ? (
                <div className="p-3 rounded-none bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold">Geofencing Disabled</span>
                  </div>
                  {isAdminOrSuperAdmin && (
                    <button
                      onClick={() => setShowConfig(true)}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      Configure
                    </button>
                  )}
                </div>
              ) : isGeofencePass ? (
                <div className="p-3 rounded-none bg-emerald-50 border border-emerald-300 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-900">
                        Inside Office Geofence
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-none border border-emerald-200">
                      {geoResult?.distanceMeters ?? 0}m from HQ
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 mt-1.5">
                    <span className="truncate">📍 {geofenceConfig.officeName} (Max: {geofenceConfig.radiusMeters}m)</span>
                    <button
                      onClick={runGeofenceCheck}
                      className="hover:text-emerald-900 transition flex items-center gap-1 shrink-0 ml-1 cursor-pointer font-medium"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>
                </div>
              ) : geoResult?.errorCode === 'OUTSIDE_GEOFENCE' ? (
                <div className="p-3 rounded-none bg-rose-50 border border-rose-300 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-xs font-bold text-rose-900">
                        Outside Office Geofence
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-none border border-rose-200">
                      {geoResult?.distanceMeters}m away
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 mt-1.5 leading-relaxed">
                    You are currently <strong>{geoResult?.distanceMeters}m</strong> away. Allowed radius is{' '}
                    <strong>{geofenceConfig.radiusMeters}m</strong>. Punching is blocked outside the office perimeter.
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-rose-200 text-[11px]">
                    <button
                      onClick={runGeofenceCheck}
                      className="font-bold text-rose-900 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Re-check Location
                    </button>
                    {isAdminOrSuperAdmin && (
                      <button
                        onClick={() => setShowConfig(!showConfig)}
                        className="font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                      >
                        Calibrate / Settings
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-none bg-amber-50 border border-amber-300 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold text-amber-900">
                        GPS Permission Required
                      </span>
                    </div>
                    <button
                      onClick={runGeofenceCheck}
                      className="text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 rounded-none border border-amber-300 cursor-pointer"
                    >
                      Allow GPS
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1.5 leading-relaxed">
                    {geoResult?.errorMessage || 'Location permission is required to verify you are at the workplace.'}
                  </p>
                </div>
              )}

              {/* Quick Geofence Calibration / Testing Drawer (Admin & Super Admin ONLY) */}
              {isAdminOrSuperAdmin && (
                <>
                  <div className="mt-2 text-right">
                    <button
                      onClick={() => setShowConfig(!showConfig)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{showConfig ? 'Hide Geofence Settings' : '⚙️ Geofence Settings & Radius (Admin Only)'}</span>
                    </button>
                  </div>

                  {showConfig && (
                    <div className="mt-2 p-3 rounded-none bg-indigo-50/60 border border-indigo-200 text-xs space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-none bg-indigo-600 text-white text-[10px]">ADMIN ONLY</span>
                          <span>Office Geofence Controls</span>
                        </span>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-medium">
                          <input
                            type="checkbox"
                            checked={geofenceConfig.enabled}
                            onChange={(e) => handleToggleGeofence(e.target.checked)}
                            className="rounded-none text-indigo-600 focus:ring-0"
                          />
                          <span>Enforce</span>
                        </label>
                      </div>

                      {configSuccessMsg && (
                        <div className="p-2 rounded-none bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                          {configSuccessMsg}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white p-2 rounded-none border border-slate-200">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Office Latitude</span>
                          <span className="font-mono font-bold text-slate-800">{geofenceConfig.latitude}</span>
                        </div>
                        <div className="bg-white p-2 rounded-none border border-slate-200">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Office Longitude</span>
                          <span className="font-mono font-bold text-slate-800">{geofenceConfig.longitude}</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Set Allowed Radius: <span className="text-indigo-600 font-extrabold">{geofenceConfig.radiusMeters} meters</span>
                        </label>
                        <div className="grid grid-cols-4 gap-1.5 text-center">
                          {[100, 250, 500, 1000].map((r) => (
                            <button
                              key={r}
                              onClick={() => handleUpdateRadius(r)}
                              className={`py-1 rounded-none text-[11px] font-bold border transition cursor-pointer ${
                                geofenceConfig.radiusMeters === r
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {r}m
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleSetCurrentAsOffice}
                          disabled={geoChecking}
                          className="w-full py-2 px-3 rounded-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          <LocateFixed className="w-3.5 h-3.5" />
                          <span>📍 Set My Current Location as Office HQ</span>
                        </button>
                        <p className="text-[10px] text-slate-500 text-center mt-1">
                          Admin calibration: Updates office center coordinates to your device's exact GPS location.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Punch Status info */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="p-3 rounded-none bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-medium">Checked In</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {punchState.record?.checkIn || 'Not punched'}
                </span>
                {punchState.record?.checkInPhoto && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-none border border-emerald-200">
                    <Camera className="w-3 h-3" /> Selfie Verified
                  </span>
                )}
              </div>
              <div className="p-3 rounded-none bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-medium">Checked Out</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {punchState.record?.checkOut || (punchState.status === 'working' ? 'In Progress' : '—')}
                </span>
                {punchState.record?.checkOutPhoto && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-none border border-rose-200">
                    <Camera className="w-3 h-3" /> Selfie Verified
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {punchState.status === 'not_started' && (
                <div className="space-y-2.5 mb-3">
                  {/* Compulsory Late Reason (ONLY shown when employee did not do attendance on time!) */}
                  {isLateArrival && (
                    <div className="p-3 rounded-xl bg-rose-50/90 border-2 border-rose-300 shadow-2xs space-y-1.5 animate-in fade-in">
                      <label className="text-xs font-black text-rose-950 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Reason for Late Arrival / लेट आने का कारण</span>
                        </span>
                        <span className="text-[10px] font-black uppercase text-rose-800 bg-rose-200 px-2 py-0.5 rounded border border-rose-300 shrink-0">
                          Compulsory *
                        </span>
                      </label>
                      <textarea
                        value={lateReason}
                        onChange={(e) => {
                          setLateReason(e.target.value);
                          if (lateReasonError) setLateReasonError('');
                        }}
                        rows={2}
                        placeholder="Please write why you arrived late today (traffic jam, vehicle breakdown, emergency, personal reason)..."
                        className={`w-full px-3 py-2 text-xs rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                          lateReasonError
                            ? 'border-rose-500 focus:ring-rose-400 bg-rose-50/40'
                            : 'border-rose-300 focus:ring-rose-500'
                        }`}
                      />
                      {lateReasonError && (
                        <p className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{lateReasonError}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                      {isLateArrival ? 'Additional Shift Notes (Optional)' : 'Remarks / Shift Note'}
                    </label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Work from office - morning shift"
                      className="w-full px-3 py-2 text-xs rounded-none border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 bg-white placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    onClick={handleInitiateCheckIn}
                    disabled={loading || geoChecking || (geofenceConfig.enabled && !isGeofencePass) || shiftStatus.isEarly}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                      shiftStatus.isEarly
                        ? 'bg-slate-300 text-slate-600 cursor-not-allowed opacity-80'
                        : isLateArrival
                        ? 'bg-rose-700 hover:bg-rose-800 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>
                      {shiftStatus.isEarly
                        ? `Locked (Check-in opens at ${shiftStatus.allowedStart})`
                        : geofenceConfig.enabled && !isGeofencePass
                        ? 'Blocked (Outside Office)'
                        : isLateArrival
                        ? 'Take Selfie & Submit Late Attendance'
                        : 'Take Selfie & Check In'}
                    </span>
                  </button>
                </div>
              )}

              {punchState.status === 'working' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleTakeBreak}
                    disabled={loading}
                    className="py-3 px-2 rounded-none bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0"
                  >
                    <Coffee className="w-4 h-4 shrink-0" />
                    <span className="truncate">Take Break</span>
                  </button>
                  <button
                    onClick={handleInitiateCheckOut}
                    disabled={loading || (geofenceConfig.enabled && !isGeofencePass)}
                    className="py-3 px-2 rounded-none bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Selfie Check Out</span>
                  </button>
                </div>
              )}

              {punchState.status === 'on_break' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleResumeWork}
                    disabled={loading}
                    className="py-3 px-2 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0 shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current shrink-0" />
                    <span className="truncate">Resume Work</span>
                  </button>
                  <button
                    onClick={handleInitiateCheckOut}
                    disabled={loading || (geofenceConfig.enabled && !isGeofencePass)}
                    className="py-3 px-2 rounded-none bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Selfie Check Out</span>
                  </button>
                </div>
              )}

              {punchState.status === 'completed' && (
                <div className="p-3 rounded-none bg-slate-100 border border-slate-200 text-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-800">
                    Attendance Completed for Today!
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Next check-in available tomorrow
                  </p>
                </div>
              )}

              <button
                onClick={handleModalClose}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
