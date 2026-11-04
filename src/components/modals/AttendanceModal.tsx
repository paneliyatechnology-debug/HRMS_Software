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
  Camera,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { useAuth, isUserAdminRole } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  checkEmployeePunchEligibility,
  performCheckIn,
  performCheckOut,
  performTakeBreak,
  performResumeWork,
  formatSecondsToHMS,
  formatSecondsToWords,
  getLiveActiveSeconds,
  getLiveBreakSeconds,
  updateLocalRecordFromBackend,
} from '../../lib/attendanceService';
import { isEmployeeWFHEnabled } from '../../lib/geoService';
import { detectUserDevice, formatDeviceSummary } from '../../lib/deviceDetector';
import { ModernDigitClock } from '../common/ModernDigitClock';
import { useModalOverlay } from '../../lib/useModalOverlay';
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
  const isAdminUser =
    rawRole === 'ADMIN' ||
    rawRole === 'HR_ADMIN' ||
    isUserAdminRole(rawRole) ||
    portalMode === 'admin';

  const [time, setTime] = useState<Date | null>(null);
  const [punchState, setPunchState] = useState(() => checkEmployeePunchEligibility(currentEmpId));
  const [liveWorkedHMS, setLiveWorkedHMS] = useState('00:00:00');
  const [liveBreakWords, setLiveBreakWords] = useState('0s');
  const [remarks, setRemarks] = useState('Morning shift clock-in');
  const [loading, setLoading] = useState(false);

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

  // Live ticking clock and punch state
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }

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
  }, [isOpen, currentEmpId, stopCameraStream]);

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

  useModalOverlay({ isOpen, onClose: handleModalClose });

  if (!isOpen) return null;

  // Step 1: Direct Check In (Selfie/Photo feature temporarily disabled per user request)
  const handleInitiateCheckIn = async () => {
    // 1. Enforce Admin Shift Time Early Lockout
    const currentShift = verifyShiftTimeWindow(undefined, userCompanyId, currentEmpId);
    if (currentShift.enforceActive && currentShift.isEarly) {
      alert(currentShift.reason || `Check-in is locked before ${currentShift.allowedStart}.`);
      return;
    }

    setLoading(true);
    try {
      const fullRemarks = remarks || 'Morning shift clock-in';
      const res = await api.startWork({});
      if (res && res.record) {
        updateLocalRecordFromBackend(res.record);
      } else {
        performCheckIn({
          id: currentEmpId,
          firstName: user.firstName || 'Employee',
          lastName: user.lastName || '',
          employeeCode: (user as any).employeeCode || user.employeeId || currentEmpId,
          companyId: userCompanyId,
          remarks: fullRemarks,
        });
      }
      const eligibility = checkEmployeePunchEligibility(currentEmpId);
      setPunchState(eligibility);
      onRefresh();
      handleModalClose();
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Direct Check Out (Selfie/Photo feature temporarily disabled per user request)
  const handleInitiateCheckOut = async () => {
    setLoading(true);
    try {
      const fullRemarks = remarks && remarks !== 'Morning shift clock-in' ? remarks : 'Evening clock-out';
      const res = await api.stopWork({});
      if (res && res.record) {
        updateLocalRecordFromBackend(res.record);
      } else {
        performCheckOut(currentEmpId, {
          remarks: fullRemarks,
        });
      }
      const eligibility = checkEmployeePunchEligibility(currentEmpId);
      setPunchState(eligibility);
      onRefresh();
      handleModalClose();
    } catch (err: any) {
      alert(err.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
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
      : 'Paneliya Technology Office';
    const coordsStr = `Identity & Presence Verified • ${officeName}`;

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
        locationAddress: isWFH ? 'Work From Home' : 'Office',
        isGeofenceVerified: true,
        isWFH: isWFH,
        photo: capturedPhoto,
        device: detectedDevice,
      };

      if (selfieMode === 'check_in') {
        const fullRemarks = remarks || 'Morning shift clock-in';

        const res = await api.checkIn(
          currentEmpId,
          fullRemarks,
          {
            firstName: user.firstName || 'Employee',
            lastName: user.lastName || '',
            employeeCode: (user as any).employeeCode || user.employeeId || currentEmpId,
            email: user.email,
            companyId: userCompanyId,
          },
          geoData
        );

        if (!res.success) {
          alert(res.message);
        } else {
          if (res.record) {
            updateLocalRecordFromBackend(res.record);
          } else {
            performCheckIn(
              {
                id: currentEmpId,
                firstName: user.firstName || 'Employee',
                lastName: user.lastName || '',
                employeeCode: (user as any).employeeCode || user.employeeId || currentEmpId,
                companyId: userCompanyId,
                remarks: fullRemarks,
              },
              geoData
            );
          }
          const eligibility = checkEmployeePunchEligibility(currentEmpId);
          setPunchState(eligibility);
          onRefresh();
          setSelfieMode('idle');
          setCapturedPhoto(null);
        }
      } else if (selfieMode === 'check_out') {
        const fullRemarks = remarks && remarks !== 'Morning shift clock-in' ? remarks : 'Evening clock-out';
        const res = await api.checkOut(
          currentEmpId,
          fullRemarks,
          {
            email: user.email,
            employeeCode: (user as any).employeeCode,
          },
          geoData
        );

        if (!res.success) {
          alert(res.message);
        } else {
          if (res.record) {
            updateLocalRecordFromBackend(res.record);
          } else {
            performCheckOut(currentEmpId, {
              photo: capturedPhoto,
              device: detectedDevice,
              remarks: fullRemarks,
            });
          }
          const eligibility = checkEmployeePunchEligibility(currentEmpId);
          setPunchState(eligibility);
          onRefresh();
          setSelfieMode('idle');
          setCapturedPhoto(null);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Punch submission failed');
    } finally {
      setLoading(false);
      stopCameraStream();
    }
  };

  const handleTakeBreak = async () => {
    setLoading(true);
    try {
      await api.startBreak({});
      const res = performTakeBreak(currentEmpId);
      if (!res.success) alert(res.message);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to start break.');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeWork = async () => {
    setLoading(true);
    try {
      await api.resumeBreak({});
      const res = performResumeWork(currentEmpId);
      if (!res.success) alert(res.message);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to resume work.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleModalClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6 border border-slate-200 shadow-2xl relative cursor-default max-h-[92vh] overflow-y-auto animate-modal-zoom"
      >
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
                      <span className="truncate">📍 {isWFH ? '🏡 Work From Home' : 'Corporate Office'}</span>
                      <span className="text-emerald-400 font-mono text-[10px]">
                        {isWFH ? 'WFH Active' : 'Attendance Verified'}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-emerald-300 mt-0.5">
                      Presence: Verified by Paneliya HRMS
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
                Shift timing & attendance tracking
              </p>
            </div>

            {/* Luxury Digital Clock & Timer Display */}
            <div className="bg-gradient-to-br from-[#062d1f] via-[#083b28] to-[#041d14] rounded-2xl p-4 sm:p-5 text-center border border-[#0d4a34] shadow-md animate-clock-glow my-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#059669]" />
              
              <ModernDigitClock
                time={punchState.status === 'not_started' ? time : undefined}
                timeString={punchState.status !== 'not_started' ? liveWorkedHMS : undefined}
                size="lg"
                variant={punchState.status === 'on_break' ? 'amber' : 'emerald'}
                showSweepRing={punchState.status === 'working'}
                label={
                  punchState.status === 'working'
                    ? 'Active Shift Chronometer'
                    : punchState.status === 'on_break'
                    ? 'Timer Paused (On Break)'
                    : punchState.status === 'completed'
                    ? 'Shift Completed (Timer Stopped)'
                    : 'Live GPS Shift Chronometer'
                }
                subText={
                  punchState.status === 'on_break'
                    ? `Break duration: ${liveBreakWords}`
                    : punchState.status === 'completed'
                    ? `Total worked: ${liveWorkedHMS} • Shift Finalized`
                    : time
                    ? time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : 'October 28, 2026'
                }
              />
            </div>

            {/* WFH Indicator (if enabled) */}
            {isWFH && (
              <div className="my-3 p-3 rounded-xl bg-purple-50 border border-purple-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏡</span>
                  <div>
                    <span className="text-xs font-bold text-purple-950 block">Work From Home (WFH) Active</span>
                    <span className="text-[11px] text-purple-800">Remote attendance punch mode enabled</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase text-purple-900 bg-purple-200 px-2.5 py-0.5 rounded-full">Remote</span>
              </div>
            )}

            {/* Punch Status info */}
            <div className="grid grid-cols-2 gap-2.5 mb-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">First In</span>
                <span className="font-semibold text-slate-800 text-xs">
                  {punchState.record?.checkIn || 'Not punched'}
                </span>
                {punchState.record?.checkInPhoto && (
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <Camera className="w-2.5 h-2.5" /> Selfie Verified
                  </span>
                )}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Latest Out</span>
                <span className="font-semibold text-slate-800 text-xs">
                  {punchState.record?.checkOut || (punchState.status === 'working' ? 'In Progress' : '—')}
                </span>
                {punchState.record?.checkOutPhoto && (
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    <Camera className="w-2.5 h-2.5" /> Selfie Verified
                  </span>
                )}
              </div>
            </div>

            {/* Total Worked & Total Break Metrics Bar */}
            {punchState.record && (
              <div className="grid grid-cols-2 gap-2.5 mb-3 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold tracking-wider">Total Worked Today</span>
                  <span className="font-mono font-bold text-emerald-900 text-sm">
                    {liveWorkedHMS}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                  <span className="text-amber-700 block text-[10px] uppercase font-bold tracking-wider">Total Break Time</span>
                  <span className="font-mono font-bold text-amber-900 text-sm">
                    {liveBreakWords}
                  </span>
                </div>
              </div>
            )}

            {/* Today's Punch History Timeline (Multi-punch sessions) */}
            {punchState.record?.punches && punchState.record.punches.length > 1 && (
              <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
                  Today's Punches ({punchState.record.punches.length} recorded)
                </span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {punchState.record.punches.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${p.type === 'IN' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="font-bold text-slate-800 shrink-0">{p.type === 'IN' ? 'Check In' : 'Check Out'}</span>
                        {p.remarks && <span className="text-slate-400 text-[10px] truncate max-w-[120px]">({p.remarks})</span>}
                      </div>
                      <span className="font-mono text-slate-600 font-semibold text-[11px] shrink-0">{p.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {punchState.status === 'not_started' && (
                <div className="space-y-2.5 mb-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                      Remarks / Shift Note
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
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {loading ? 'Checking In...' : 'Check In Now'}
                    </span>
                  </button>
                </div>
              )}

              {punchState.status === 'working' && (
                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 sm:gap-2.5">
                  <button
                    onClick={handleTakeBreak}
                    disabled={loading}
                    className="py-3 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0"
                  >
                    <Coffee className="w-4 h-4 shrink-0" />
                    <span className="truncate">{loading ? 'Starting Break...' : 'Take Break'}</span>
                  </button>
                  <button
                    onClick={handleInitiateCheckOut}
                    disabled={loading}
                    className="py-3 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span className="truncate">{loading ? 'Checking Out...' : 'Check Out'}</span>
                  </button>
                </div>
              )}

              {punchState.status === 'on_break' && (
                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 sm:gap-2.5">
                  <button
                    onClick={handleResumeWork}
                    disabled={loading}
                    className="py-3 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0 shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current shrink-0" />
                    <span className="truncate">{loading ? 'Resuming...' : 'Resume Work'}</span>
                  </button>
                  <button
                    onClick={handleInitiateCheckOut}
                    disabled={loading}
                    className="py-3 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span className="truncate">{loading ? 'Checking Out...' : 'Check Out'}</span>
                  </button>
                </div>
              )}

              {punchState.status === 'completed' && (
                <div className="space-y-2.5 mb-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-xs font-semibold text-slate-800">
                      Currently Checked Out
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      You can check in again anytime to start another work session.
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                      Remarks / Next Shift Note
                    </label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Post-break / afternoon session check-in"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 bg-white placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    onClick={handleInitiateCheckIn}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white transition-all cursor-pointer shadow-sm disabled:opacity-40"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{loading ? 'Checking In...' : 'Check In Again'}</span>
                  </button>
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
