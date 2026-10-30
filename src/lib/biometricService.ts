import { AttendanceRecord, Employee, DevicePunchInfo } from '../types/hrms';
import {
  getAllAttendanceRecords,
  saveAttendanceRecords,
  getTodayDateString,
  updateLocalRecordFromBackend,
} from './attendanceService';
import { getAllEmployees } from './employeeService';

export interface BiometricDevice {
  id: string;
  companyId: string;
  companyName: string;
  deviceName: string;
  brand: 'eSSL' | 'ZKTeco' | 'Realtime' | 'Mantra' | 'Biomax' | 'Hikvision' | 'Matrix' | 'Other';
  model: string;
  serialNumber: string;
  ipAddress: string;
  port: number;
  connectionType: 'cloud_push_adms' | 'local_agent_bridge';
  branchLocation: string;
  secretApiKey: string;
  status: 'online' | 'offline' | 'syncing';
  lastSyncAt: string | null;
  totalPunches: number;
  createdAt: string;
}

const STORAGE_KEY = 'hrms_biometric_devices_list';

export const initialBiometricDevices: BiometricDevice[] = [
  {
    id: 'bio-paneliya-01',
    companyId: 'comp-paneliya',
    companyName: 'Paneliya Technology Inc.',
    deviceName: 'Main Entrance Face & Finger Terminal',
    brand: 'eSSL',
    model: 'eSSL MB20 Multi-Biometric',
    serialNumber: 'ZK-MB20-SURAT-891',
    ipAddress: '192.168.1.201',
    port: 4370,
    connectionType: 'cloud_push_adms',
    branchLocation: 'Surat HQ • Reception Gate',
    secretApiKey: 'bio_sec_paneliya_9x48f2a1b9',
    status: 'online',
    lastSyncAt: 'Just now',
    totalPunches: 142,
    createdAt: '2026-01-15',
  },
  {
    id: 'bio-paneliya-02',
    companyId: 'comp-paneliya',
    companyName: 'Paneliya Technology Inc.',
    deviceName: 'Developer Wing Biometric Gateway',
    brand: 'ZKTeco',
    model: 'ZKTeco uFace 800 Plus',
    serialNumber: 'ZK-UF800-44912',
    ipAddress: '192.168.1.202',
    port: 4370,
    connectionType: 'local_agent_bridge',
    branchLocation: 'Surat HQ • 2nd Floor Dev Lab',
    secretApiKey: 'bio_sec_paneliya_88d1c920ef',
    status: 'online',
    lastSyncAt: '2 mins ago',
    totalPunches: 98,
    createdAt: '2026-02-01',
  },
];

let liveBiometricDevices: BiometricDevice[] = [...initialBiometricDevices];

/**
 * Get all registered biometric devices, optionally filtered by companyId
 */
export function getBiometricDevices(companyId?: string): BiometricDevice[] {
  if (companyId) {
    return liveBiometricDevices.filter(
      (d) =>
        d.companyId === companyId ||
        d.companyId.toLowerCase() === companyId.toLowerCase()
    );
  }
  return liveBiometricDevices;
}

/**
 * Save or update a biometric device (in-memory)
 */
export function saveBiometricDevice(device: BiometricDevice): void {
  const idx = liveBiometricDevices.findIndex((d) => d.id === device.id);
  if (idx !== -1) {
    liveBiometricDevices[idx] = device;
  } else {
    liveBiometricDevices.unshift(device);
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    window.dispatchEvent(new CustomEvent('hrms_biometric_devices_updated'));
  }
}

/**
 * Delete a biometric device (in-memory)
 */
export function deleteBiometricDevice(deviceId: string): void {
  liveBiometricDevices = liveBiometricDevices.filter((d) => d.id !== deviceId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    window.dispatchEvent(new CustomEvent('hrms_biometric_devices_updated'));
  }
}

/**
 * Generate a unique secret API key for a device
 */
export function generateDeviceApiKey(companyId: string, deviceName: string): string {
  const cleanComp = (companyId || 'comp').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
  return `bio_sec_${cleanComp}_${randomHex}`;
}

/**
 * Resolve Cloud Webhook Push URL
 */
export function getCloudWebhookUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/biometric/push`;
  }
  return 'https://hrms.paneliya.com/api/biometric/push';
}

/**
 * Process an incoming Biometric Punch (Auto In/Out determination)
 */
export function processBiometricPunch(payload: {
  companyId?: string;
  deviceId?: string;
  deviceApiKey?: string;
  employeeCode: string;
  punchTime?: string;
  verificationMode?: 'FINGERPRINT' | 'FACE' | 'RFID_CARD' | 'PASSWORD';
}): {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
  punchType?: 'CHECK_IN' | 'CHECK_OUT';
} {
  const allEmployees = getAllEmployees();
  const q = payload.employeeCode.trim().toLowerCase();

  const employee = allEmployees.find(
    (e) =>
      e.employeeCode?.toLowerCase() === q ||
      e.id?.toLowerCase() === q ||
      `${e.firstName} ${e.lastName}`.toLowerCase() === q
  );

  if (!employee) {
    return {
      success: false,
      message: `Employee with code "${payload.employeeCode}" not found in employee directory. Please register or verify employee code.`,
    };
  }

  // Find device info
  const devices = getBiometricDevices();
  const device = devices.find(
    (d) =>
      d.id === payload.deviceId ||
      (payload.deviceApiKey && d.secretApiKey === payload.deviceApiKey)
  ) || devices[0];

  const now = payload.punchTime ? new Date(payload.punchTime) : new Date();
  const todayStr = getTodayDateString();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const allRecords = getAllAttendanceRecords();
  const existingIdx = allRecords.findIndex(
    (r) =>
      r.date === todayStr &&
      (r.employeeId === employee.id || r.employeeId.toLowerCase() === employee.id.toLowerCase())
  );

  const biometricDeviceDesc: DevicePunchInfo = {
    deviceType: 'Desktop',
    deviceModel: `${device?.brand || 'Biometric'} ${device?.model || 'Hardware Terminal'} [${payload.verificationMode || 'BIOMETRIC'}]`,
    os: 'Biometric Embedded Linux Firmware v4.8',
    browser: `Hardware Sensor (${payload.verificationMode || 'Finger/Face'})`,
    screenResolution: `Serial: ${device?.serialNumber || 'SN-UNKNOWN'}`,
    platform: device?.branchLocation || 'Office Gate',
  };

  let punchTypeResult: 'CHECK_IN' | 'CHECK_OUT' = 'CHECK_IN';
  let updatedRecord: AttendanceRecord;

  if (existingIdx !== -1) {
    // Record already exists for today
    const existing = allRecords[existingIdx];

    if (!existing.checkOut || existing.checkOut.trim() === '') {
      // Step 2: Employee is punching out!
      punchTypeResult = 'CHECK_OUT';
      const elapsedActive = existing.lastActiveTimestamp
        ? Math.max(0, Math.floor((now.getTime() - existing.lastActiveTimestamp) / 1000))
        : 0;
      const totalSecs = (existing.activeSeconds || 0) + elapsedActive;

      updatedRecord = {
        ...existing,
        checkOut: timeStr,
        isCompleted: true,
        isOnBreak: false,
        lastActiveTimestamp: undefined,
        activeSeconds: totalSecs,
        workingHours: Number((totalSecs / 3600).toFixed(2)),
        checkOutDevice: biometricDeviceDesc,
        remarks: `${existing.remarks ? `${existing.remarks} | ` : ''}⚡ Checked out via ${device?.deviceName || 'Biometric Machine'} (${timeStr})`,
      };
      allRecords[existingIdx] = updatedRecord;
    } else {
      // Already checked in and checked out today - record duplicate or overtime punch
      punchTypeResult = 'CHECK_OUT';
      updatedRecord = {
        ...existing,
        checkOut: timeStr,
        remarks: `${existing.remarks ? `${existing.remarks} | ` : ''}Re-punched via Biometric at ${timeStr}`,
      };
      allRecords[existingIdx] = updatedRecord;
    }
  } else {
    // Step 1: Employee is checking in!
    punchTypeResult = 'CHECK_IN';
    updatedRecord = {
      id: `att-bio-${Date.now()}`,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeCode: employee.employeeCode,
      departmentName: employee.departmentName,
      date: todayStr,
      checkIn: timeStr,
      status: 'Present',
      breakDurationMinutes: 0,
      workingHours: 0,
      overtimeHours: 0,
      activeSeconds: 0,
      breakSeconds: 0,
      isOnBreak: false,
      isCompleted: false,
      lastActiveTimestamp: now.getTime(),
      createdAt: now.toISOString(),
      isGeofenceVerified: true,
      checkInDevice: biometricDeviceDesc,
      remarks: `🛡️ Verified Biometric Check-In via ${device?.deviceName || 'Hardware Device'} [${payload.verificationMode || 'Fingerprint'}]`,
    };
    allRecords.unshift(updatedRecord);
  }

  saveAttendanceRecords(allRecords);

  // Update device stats
  if (device) {
    device.totalPunches = (device.totalPunches || 0) + 1;
    device.lastSyncAt = 'Just now';
    device.status = 'online';
    saveBiometricDevice(device);
  }

  // Dispatch events for live UI updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hrms_attendance_updated'));
    window.dispatchEvent(new CustomEvent('hrms_biometric_punch_received', {
      detail: {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeCode: employee.employeeCode,
        punchType: punchTypeResult,
        time: timeStr,
        device: device?.deviceName,
      },
    }));
  }

  return {
    success: true,
    punchType: punchTypeResult,
    message: `Biometric ${punchTypeResult === 'CHECK_IN' ? 'Check-In' : 'Check-Out'} recorded for ${employee.firstName} ${employee.lastName} (${employee.employeeCode}) at ${timeStr}!`,
    record: updatedRecord,
  };
}

/**
 * Generates a ready-to-run Node.js Background Sync Agent Script for this company's device
 */
export function generateNodeJsAgentScript(device: BiometricDevice): string {
  const webhookUrl = getCloudWebhookUrl();
  return `/**
 * Paneliya HRMS - Biometric Hardware Local Sync Agent (Node.js)
 * -------------------------------------------------------------
 * Device: ${device.deviceName} (${device.brand} ${device.model})
 * Serial: ${device.serialNumber}
 * Company API Key: ${device.secretApiKey}
 * Target Cloud Webhook: ${webhookUrl}
 * 
 * Setup:
 * 1. npm init -y
 * 2. npm install node-zklib axios
 * 3. node sync-agent.js
 */

const ZKLib = require('node-zklib');
const axios = require('axios');

const DEVICE_IP = '${device.ipAddress}';
const DEVICE_PORT = ${device.port || 4370};
const API_KEY = '${device.secretApiKey}';
const DEVICE_ID = '${device.id}';
const CLOUD_URL = '${webhookUrl}';

async function startAgent() {
  console.log(\`[HRMS Agent] Connecting to \${DEVICE_IP}:\${DEVICE_PORT}...\`);
  const zk = new ZKLib(DEVICE_IP, DEVICE_PORT, 10000, 4000);

  try {
    await zk.createSocket();
    console.log(\`[HRMS Agent] Connected successfully to ${device.brand} device!\`);

    // Listen to live punches in real time
    zk.getRealTimeLogs(async (data) => {
      console.log(\`[Punch Detected] User ID: \${data.userId} at \${data.attTime}\`);

      try {
        const response = await axios.post(CLOUD_URL, {
          deviceApiKey: API_KEY,
          deviceId: DEVICE_ID,
          employeeCode: String(data.userId),
          punchTime: data.attTime || new Date().toISOString(),
          verificationMode: data.verifyType === 1 ? 'FINGERPRINT' : 'FACE'
        }, {
          headers: { 'Content-Type': 'application/json', 'x-device-key': API_KEY }
        });

        console.log(\`[HRMS Sync Success]\`, response.data);
      } catch (postErr) {
        console.error('[Sync Error]', postErr.response?.data || postErr.message);
      }
    });

  } catch (err) {
    console.error('[Connection Failed]', err);
    console.log('Retrying in 10 seconds...');
    setTimeout(startAgent, 10000);
  }
}

startAgent();
`;
}

/**
 * Generates a ready-to-run Python Background Sync Agent Script for this company's device
 */
export function generatePythonAgentScript(device: BiometricDevice): string {
  const webhookUrl = getCloudWebhookUrl();
  return `# Paneliya HRMS - Biometric Hardware Local Sync Agent (Python)
# -------------------------------------------------------------
# Device: ${device.deviceName} (${device.brand} ${device.model})
# Serial: ${device.serialNumber}
# Company API Key: ${device.secretApiKey}
#
# Requirements:
# pip install pyzk requests
# python sync_agent.py

import time
import requests
from zk import ZK

DEVICE_IP = "${device.ipAddress}"
DEVICE_PORT = ${device.port || 4370}
API_KEY = "${device.secretApiKey}"
DEVICE_ID = "${device.id}"
CLOUD_URL = "${webhookUrl}"

def sync_punches():
    print(f"[HRMS Python Agent] Connecting to {DEVICE_IP}:{DEVICE_PORT}...")
    zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=5)
    conn = None
    try:
        conn = zk.connect()
        conn.disable_device()
        print("[HRMS Python Agent] Connected! Reading live punches...")

        attendances = conn.get_attendance()
        for att in attendances:
            payload = {
                "deviceApiKey": API_KEY,
                "deviceId": DEVICE_ID,
                "employeeCode": str(att.user_id),
                "punchTime": att.timestamp.isoformat(),
                "verificationMode": "FINGERPRINT" if att.punch == 0 else "FACE"
            }
            res = requests.post(CLOUD_URL, json=payload, headers={"x-device-key": API_KEY})
            print(f"[Synced] Code {att.user_id}: {res.status_code}")

        conn.enable_device()
    except Exception as e:
        print("[Error]", e)
    finally:
        if conn:
            conn.disconnect()

if __name__ == "__main__":
    while True:
        sync_punches()
        time.sleep(30) # Poll every 30 seconds
`;
}
