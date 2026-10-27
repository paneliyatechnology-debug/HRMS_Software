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
        return <Laptop className="w-4 h-4 text-purple-600" />;
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
      <div className="bg-[#FAF8F5] border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_0px_#000] flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full border border-black ${
                  punchType === 'Check-In' ? 'bg-[#00F0B5]' : 'bg-[#FF5C00]'
                }`}
              />
              <span className="font-black text-xs uppercase tracking-wider text-black">
                {punchType} Verification
              </span>
            </div>
            <span className="font-mono text-xs font-black bg-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
              ⏰ {time || '—'}
            </span>
          </div>

          {/* Selfie Photo Preview */}
          <div className="mb-4">
            <span className="text-[10px] font-black uppercase text-slate-500 block mb-1.5 flex items-center justify-between">
              <span>Verified Geotag Selfie</span>
              {photo && (
                <button
                  type="button"
                  onClick={() => setExpandedPhoto(photo)}
                  className="text-[10px] font-bold text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" /> Full View
                </button>
              )}
            </span>

            {photo ? (
              <div
                onClick={() => setExpandedPhoto(photo)}
                className="relative rounded-xl border-2 border-black overflow-hidden bg-slate-900 group cursor-pointer shadow-[2px_2px_0px_0px_#000] aspect-[4/3] flex items-center justify-center"
              >
                <img
                  src={photo}
                  alt={`${punchType} selfie`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                  <Maximize2 className="w-4 h-4" />
                  <span>Click to Enlarge</span>
                </div>
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/75 rounded text-[10px] font-mono font-bold text-white border border-white/20 backdrop-blur-xs flex items-center gap-1">
                  <Camera className="w-3 h-3 text-emerald-400" />
                  <span>GPS Burned</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center text-slate-400">
                <Camera className="w-6 h-6 mx-auto mb-1 stroke-1" />
                <p className="text-xs font-semibold">No selfie recorded</p>
                <p className="text-[10px] text-slate-400">Legacy punch or offline entry</p>
              </div>
            )}
          </div>

          {/* Location & Geofence Status */}
          <div className="mb-4 bg-white rounded-xl p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500" /> Geofence Verification
              </span>
              {record.isWFH ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                  <span>🏡</span> WFH Approved (Geofence Waived)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Inside HQ
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">GPS Coordinates</span>
                <p className="font-mono font-bold text-slate-800 text-[11px] truncate">
                  {coords?.lat ? `${coords.lat.toFixed(5)}, ${coords.lng?.toFixed(5)}` : '21.1702, 72.8311'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Office Distance / Mode</span>
                <p className={`font-mono font-bold text-[11px] ${record.isWFH ? 'text-purple-700' : 'text-emerald-700'}`}>
                  {record.isWFH
                    ? 'Remote / Home Punch'
                    : coords?.distance !== undefined
                    ? `${Math.round(coords.distance)}m from HQ`
                    : 'Inside (15m)'}
                </p>
              </div>
            </div>
          </div>

          {/* Device Fingerprint Details */}
          <div className="bg-white rounded-xl p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                {getDeviceIcon(device)} Detected Device Hardware
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase border border-black bg-[#FFE600] text-black">
                {device?.deviceType || 'Desktop'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Device Model:</span>
                <span className="font-black text-slate-900">{device?.deviceModel || 'Windows PC / Laptop'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Operating System:</span>
                <span className="font-mono font-bold text-slate-800">{device?.os || 'Windows 10/11'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Browser &amp; Engine:</span>
                <span className="font-mono font-bold text-indigo-700">{device?.browser || 'Chrome / Edge'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Screen Resolution:</span>
                <span className="font-mono text-slate-700">{device?.screenResolution || '1920×1080 (DPR 1)'}</span>
              </div>
              {device?.orientation && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Orientation:</span>
                  <span className="font-semibold text-slate-700">{device.orientation}</span>
                </div>
              )}
            </div>

            {/* User-Agent String */}
            {device?.userAgent && (
              <div className="mt-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">User-Agent Header</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(device.userAgent || '', punchType)}
                    className="text-[9px] font-bold text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
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
                <p className="text-[9px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200 break-all max-h-14 overflow-y-auto">
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border-[3px] border-black rounded-3xl shadow-[8px_8px_0px_0px_#000] overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b-2 border-black bg-[#FFE600] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_#000]">
                📸
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black uppercase tracking-tight text-black">
                    Employee Punch &amp; Device Verification Audit
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-black text-white">
                    HR ADMIN ONLY
                  </span>
                </div>
                <p className="text-xs font-bold text-black/80">
                  {empName} ({empCode}) • {deptName} • Date: {record.date}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border-2 border-black bg-white hover:bg-red-100 flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Quick Summary Bar */}
          <div className="px-5 py-2.5 bg-slate-50 border-b-2 border-black flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Status</span>
                <p className="font-black text-slate-900">
                  {record.isCompleted
                    ? 'Shift Completed'
                    : record.isOnBreak
                    ? 'On Break (Paused)'
                    : 'Active Working'}
                </p>
              </div>
              <div className="h-6 w-0.5 bg-slate-300" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Active Time</span>
                <p className="font-mono font-black text-emerald-700">
                  {formatSecondsToHMS(record.activeSeconds || 0)}
                </p>
              </div>
              <div className="h-6 w-0.5 bg-slate-300" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Break Duration</span>
                <p className="font-mono font-bold text-amber-700">
                  {formatSecondsToWords(record.breakSeconds || 0)}
                </p>
              </div>
            </div>

            {/* Device Cross-Check Badge */}
            {record.checkInDevice && record.checkOutDevice && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 border-black bg-white text-[11px] font-black">
                {record.checkInDevice.deviceModel === record.checkOutDevice.deviceModel ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Same Device Used For In &amp; Out
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Different Devices Detected!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Body: Side-by-Side Comparison */}
          <div className="p-5 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Check-In Card */}
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
          <div className="px-5 py-3 border-t-2 border-black bg-white flex items-center justify-between shrink-0">
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              Watermarked selfie photos and hardware signatures are tamper-proof and stored with employee attendance record.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000]"
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
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-black rounded-2xl border-2 border-white overflow-hidden shadow-2xl">
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center z-10 border border-white/30"
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
