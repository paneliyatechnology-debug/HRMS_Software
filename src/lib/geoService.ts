/**
 * Geofencing & Location Verification Service
 * Note: Geofence enforcement is disabled for Phase 1.
 * All verification checks return isAllowed: true so users can punch freely.
 */

export interface OfficeGeofenceConfig {
  officeName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  enabled: boolean;
}

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeofenceVerificationResult {
  isAllowed: boolean;
  distanceMeters: number | null;
  userCoords: UserCoordinates | null;
  config: OfficeGeofenceConfig;
  errorMessage?: string;
  errorCode?: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'OUTSIDE_GEOFENCE' | 'UNSUPPORTED' | 'DISABLED';
}

const STORAGE_KEY_GEOFENCE = 'hrms_geofence_config';
const STORAGE_KEY_WFH = 'hrms_employee_wfh_status';

let liveWfhMap: Record<string, boolean> = {};

export function getEmployeeWFHMap(): Record<string, boolean> {
  return liveWfhMap;
}

export function isEmployeeWFHEnabled(employeeId?: string): boolean {
  if (!employeeId) return false;
  const direct = liveWfhMap[employeeId];
  if (direct !== undefined) return Boolean(direct);
  const lower = liveWfhMap[employeeId.toLowerCase()];
  if (lower !== undefined) return Boolean(lower);
  return false;
}

export function setEmployeeWFHStatus(employeeId: string, enabled: boolean): void {
  if (!employeeId) return;
  liveWfhMap[employeeId] = enabled;
  liveWfhMap[employeeId.toLowerCase()] = enabled;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_WFH);
    } catch {}
    window.dispatchEvent(
      new CustomEvent('hrms_wfh_status_updated', {
        detail: { employeeId, enabled },
      })
    );
  }
}

/**
 * Default Office Location (Paneliya Technology HQ)
 * Geofence enforcement is disabled for Phase 1.
 */
export const DEFAULT_OFFICE_GEOFENCE: OfficeGeofenceConfig = {
  officeName: 'Paneliya Technology HQ',
  latitude: 21.1702,
  longitude: 72.8311,
  radiusMeters: 500,
  enabled: false,
};

let liveGeofenceConfig: OfficeGeofenceConfig = { ...DEFAULT_OFFICE_GEOFENCE };

export function getOfficeGeofenceConfig(): OfficeGeofenceConfig {
  return liveGeofenceConfig;
}

export function saveOfficeGeofenceConfig(config: OfficeGeofenceConfig): void {
  liveGeofenceConfig = { ...config };
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_GEOFENCE);
    } catch {}
    window.dispatchEvent(new CustomEvent('hrms_geofence_updated', { detail: config }));
  }
}

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function getCurrentGPSLocation(): Promise<UserCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject({
        code: 'UNSUPPORTED',
        message: 'Geolocation is not supported by your browser or device.',
      });
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 0),
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        let code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' = 'POSITION_UNAVAILABLE';
        let message = 'Unable to determine your GPS location.';

        if (err.code === err.PERMISSION_DENIED) {
          code = 'PERMISSION_DENIED';
          message = 'Location permission was denied.';
        } else if (err.code === err.TIMEOUT) {
          code = 'TIMEOUT';
          message = 'GPS location request timed out.';
        }

        reject({ code, message, nativeError: err });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      }
    );
  });
}

/**
 * Validate whether the current user is inside the designated office geofence.
 * Phase 1: Always returns isAllowed: true (Geofence bypassed).
 */
export async function verifyCurrentGeofence(): Promise<GeofenceVerificationResult> {
  const config = getOfficeGeofenceConfig();
  return {
    isAllowed: true,
    distanceMeters: 0,
    userCoords: null,
    config: { ...config, enabled: false },
  };
}
