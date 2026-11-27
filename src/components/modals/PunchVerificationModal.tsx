'use client';

import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  Tablet,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Maximize2,
  Copy,
  Check,
  Monitor,
  Compass,
  Calendar,
  User,
  ArrowRight,
  Info,
  Fingerprint,
} from 'lucide-react';
import { AttendanceRecord, Employee, DevicePunchInfo } from '../../types/hrms';
import { useModalOverlay } from '../../lib/useModalOverlay';
import { formatSecondsToWords, formatSecondsToHMS } from '../../lib/attendanceService';

interface PunchVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  employee?: Employee | null;
}

export const PunchVerificationModal: React.FC<PunchVerificationModalProps> = ({
  isOpen,
  onClose,
  record,
  employee,
}) => {
  const [copiedUA, setCopiedUA] = useState<string | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  useModalOverlay({
    isOpen,
    onClose: () => {
      if (expandedPhoto) {
        setExpandedPhoto(null);
      } else {
        onClose();
      }
    },
  });

  if (!isOpen || !record) return null;

  const empName = record.employeeName || (employee ? `${employee.firstName} ${employee.lastName}` : 'Employee');
  const empCode = record.employeeCode || employee?.employeeCode || 'EMP-1';
  const deptName = record.departmentName || employee?.departmentName || 'General';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedUA(key);
    setTimeout(() => setCopiedUA(null), 2000);
  };

  const getDeviceIcon = (device?: DevicePunchInfo) => {
    if (!device) return <Monitor className="w-4 h-4 text-slate-500" />;
    if (device.os?.includes('Biometric') || device.deviceModel?.includes('Biometric') || device.browser?.includes('Sensor')) {
      return <Fingerprint className="w-4 h-4 text-amber-600" />;
    }
    switch (device.deviceType) {
      case 'Mobile':
        return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'Tablet':
        return <Tablet className="w-4 h-4 text-blue-600" />;
      case 'Desktop':
      default:
        return <Laptop className="w-4 h-4 text-indigo-600" />;
    }
  };

  const renderDeviceCard = (
    device?: DevicePunchInfo,
    punchType: 'Check-In' | 'Check-Out' = 'Check-In',
    photo?: string,
    coords?: { lat?: number; lng?: number; accuracy?: number; distance?: number },
    time?: string
  ) => {
    return (
<<<<<<< HEAD
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-full">
=======
      <div className="bg-[#FAF8F5] border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_0px_#000] flex flex-col justify-between h-full">
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center gap-2">
              <span
<<<<<<< HEAD
                className={`w-2.5 h-2.5 rounded-full ${
                  punchType === 'Clock-In' ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-rose-500 ring-2 ring-rose-500/20'
=======
                className={`w-3 h-3 rounded-full border border-black ${
                  punchType === 'Check-In' ? 'bg-[#00F0B5]' : 'bg-[#FF5C00]'
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                }`}
              />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                {punchType} Verification
              </span>
            </div>
<<<<<<< HEAD
            <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs inline-flex items-center gap-1 text-slate-700">
              <Clock className="w-3 h-3 text-slate-400" /> {time || '—'}
=======
            <span className="font-mono text-xs font-black bg-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
              ⏰ {time || '—'}
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
            </span>
          </div>

          {/* Selfie Photo Preview */}
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 flex items-center justify-between">
              <span>Verified Geotag Selfie</span>
              {photo && (
                <button
                  type="button"
                  onClick={() => setExpandedPhoto(photo)}
<<<<<<< HEAD
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
=======
                  className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                >
                  <Maximize2 className="w-2.5 h-2.5" /> Expand
                </button>
              )}
            </div>

            {photo ? (
              <div
                onClick={() => setExpandedPhoto(photo)}
                className="relative h-44 rounded-xl overflow-hidden border border-slate-200 group cursor-pointer bg-slate-900"
              >
                <img
                  src={photo}
                  alt={`${punchType} Selfie`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                  <span className="text-[10px] font-mono text-white flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {time}
                  </span>
                  {coords?.lat && coords?.lng && (
                    <span className="text-[9px] font-mono text-white/80 flex items-center gap-1 truncate">
                      <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                      {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-44 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5 p-4 text-center">
                <Camera className="w-6 h-6 text-slate-300" />
                <span className="font-semibold text-slate-600">No Geotag Photo Captured</span>
                <span className="text-[10px] text-slate-400">
                  Punch was completed via Biometric terminal or photo-bypass session
                </span>
              </div>
            )}
          </div>

<<<<<<< HEAD
          {/* Location & GPS Info */}
          <div className="mb-4 p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">GPS Status:</span>
              {coords?.lat && coords?.lng ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                  <Check className="w-3 h-3" /> Geofence Verified
=======
          {/* Location & Geofence Status */}
          <div className="mb-4 bg-white rounded-xl p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500" /> Geofence Verification
              </span>
              {record.isWFH ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                  <span>🏡</span> WFH Approved (Geofence Waived)
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                </span>
              ) : (
                <span className="text-amber-700 font-semibold text-[11px]">
                  Office Network / Geofence Off
                </span>
              )}
            </div>

            {coords?.lat && coords?.lng && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Coordinates:</span>
                  <span className="font-mono text-slate-800 text-[11px]">
                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </span>
                </div>
                {coords.distance !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Distance from Office:</span>
                    <span
                      className={`font-mono font-bold text-[11px] ${
                        coords.distance <= 100 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {coords.distance} meters
                    </span>
                  </div>
                )}
                {coords.accuracy !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Accuracy Radius:</span>
                    <span className="font-mono text-slate-600 text-[11px]">
                      ±{coords.accuracy} m
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

<<<<<<< HEAD
          {/* Device Signature Breakdown */}
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                {getDeviceIcon(device)}
                <span>Device Fingerprint</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {device?.deviceType || 'Desktop / Web'}
=======
          {/* Device Fingerprint Details */}
          <div className="bg-white rounded-xl p-3 border border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                {getDeviceIcon(device)} Detected Device Hardware
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-emerald-200 bg-emerald-50 text-emerald-800">
                {device?.deviceType || 'Desktop'}
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Device Model:</span>
                <span className="font-semibold text-slate-900">{device?.deviceModel || 'Windows PC / Laptop'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Operating System:</span>
                <span className="font-mono text-slate-800">{device?.os || 'Windows 10/11'}</span>
              </div>
              <div className="flex items-center justify-between">
<<<<<<< HEAD
                <span className="text-slate-500 font-medium">Browser:</span>
                <span className="font-mono text-indigo-700 font-semibold">{device?.browser || 'Chrome / Edge'}</span>
=======
                <span className="text-slate-500 font-bold">Browser &amp; Engine:</span>
                <span className="font-mono font-bold text-emerald-700">{device?.browser || 'Chrome / Edge'}</span>
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Resolution:</span>
                <span className="font-mono text-slate-600">{device?.screenResolution || '1920×1080'}</span>
              </div>
            </div>

            {/* User-Agent String */}
            {device?.userAgent && (
              <div className="mt-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">User-Agent</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(device.userAgent || '', punchType)}
<<<<<<< HEAD
                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
=======
                    className="text-[9px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                  >
                    {copiedUA === punchType ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" /> Copy UA
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[9px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-200 break-all max-h-12 overflow-y-auto">
                  {device.userAgent}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-white/45 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      >
        <div
          onClick={(e) => e.stopPropagation()}
<<<<<<< HEAD
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden cursor-default my-auto"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                <Camera className="w-5 h-5" />
=======
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-sm text-emerald-700">
                📸
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
<<<<<<< HEAD
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    Punch &amp; Device Verification Audit
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    HR Admin
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
=======
                  <h2 className="text-base font-bold tracking-tight text-slate-900">
                    Employee Punch &amp; Device Verification Audit
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-900 text-white">
                    HR ADMIN ONLY
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
                  {empName} ({empCode}) • {deptName} • Date: {record.date}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
<<<<<<< HEAD
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
=======
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Summary Bar */}
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Status</span>
                <p className="font-bold text-slate-900">
                  {record.isCompleted
                    ? 'Shift Completed'
                    : record.isOnBreak
                    ? 'On Break (Paused)'
                    : 'Active Working'}
                </p>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Active Time</span>
                <p className="font-mono font-bold text-emerald-700">
                  {formatSecondsToHMS(record.activeSeconds || 0)}
                </p>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Break Duration</span>
                <p className="font-mono font-bold text-amber-700">
                  {formatSecondsToWords(record.breakSeconds || 0)}
                </p>
              </div>
            </div>

            {/* Device Cross-Check Badge */}
            {record.checkInDevice && record.checkOutDevice && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold shadow-2xs">
                {record.checkInDevice.deviceModel === record.checkOutDevice.deviceModel ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Same Device In &amp; Out
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Different Devices Detected
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Body: Side-by-Side Comparison */}
<<<<<<< HEAD
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Clock-In Card */}
=======
          <div className="p-5 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Check-In Card */}
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
              {renderDeviceCard(
                record.checkInDevice,
                'Check-In',
                record.checkInPhoto,
                {
                  lat: record.checkInLatitude,
                  lng: record.checkInLongitude,
                  accuracy: record.checkInAccuracy,
                  distance: record.checkInDistanceMeters,
                },
                record.checkIn
              )}

              {/* Check-Out Card */}
              {renderDeviceCard(
                record.checkOutDevice,
                'Check-Out',
                record.checkOutPhoto,
                {
                  lat: record.checkOutLatitude,
                  lng: record.checkOutLongitude,
                  distance: record.checkOutDistanceMeters,
                },
                record.checkOut || (record.isCompleted ? 'Completed' : 'Still Working (Pending)')
              )}
            </div>
          </div>

          {/* Footer */}
<<<<<<< HEAD
          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between shrink-0">
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Watermarked selfie photos and hardware signatures are tamper-proof.</span>
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
=======
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              Watermarked selfie photos and hardware signatures are tamper-proof and stored with employee attendance record.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
>>>>>>> 7c080ad1dede1b604c527aa55a4f8f7e27459b35
            >
              Close Audit
            </button>
          </div>
        </div>
      </div>

      {/* Full Resolution Photo Modal */}
      {expandedPhoto && (
        <div
          onClick={() => setExpandedPhoto(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/45 backdrop-blur-md animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-slate-950 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center z-10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={expandedPhoto}
              alt="Full Resolution Geotag Selfie"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};
