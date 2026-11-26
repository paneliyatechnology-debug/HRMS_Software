/**
 * Geofencing & Location Verification Service
 * Punch is allowed only inside the office radius, unless the check is turned off.
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
 * Default Office Location (Paneliya Technology HQ, Surat).
 * Employees must be inside this radius to punch, unless they are marked work-from-home.
 */
export const DEFAULT_OFFICE_GEOFENCE: OfficeGeofenceConfig = {
  officeName: 'Paneliya Technology HQ',
  latitude: 21.1702,
  longitude: 72.8311,
  radiusMeters: 500,
  enabled: true,
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

function locationError(code: NonNullable<GeofenceVerificationResult['errorCode']>, message: string) {
  const error = new Error(message);
  (error as Error & { code: string }).code = code;
  return error;
}

export function getCurrentGPSLocation(): Promise<UserCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(locationError('UNSUPPORTED', 'Geolocation is not supported by your browser or device.'));
      return;
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
        if (err.code === err.PERMISSION_DENIED) {
          reject(locationError('PERMISSION_DENIED', 'Location permission was not granted.'));
          return;
        }
        if (err.code === err.TIMEOUT) {
          reject(locationError('TIMEOUT', 'Location timed out. Turn on device location and try again.'));
          return;
        }
        reject(locationError('POSITION_UNAVAILABLE', 'Location is off. Turn on location for this browser and try again.'));
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 },
    );
  });
}

export function measureOfficeDistance(userCoords: UserCoordinates): GeofenceVerificationResult {
  const config = getOfficeGeofenceConfig();
  if (!config.enabled) {
    return { isAllowed: true, distanceMeters: null, userCoords, config, errorCode: 'DISABLED' };
  }
  const distanceMeters = calculateHaversineDistance(
    userCoords.latitude,
    userCoords.longitude,
    config.latitude,
    config.longitude,
  );
  const gpsSlack = Math.min(Math.max(userCoords.accuracy || 0, 0), config.radiusMeters);
  const isAllowed = distanceMeters <= config.radiusMeters + gpsSlack;
  return {
    isAllowed,
    distanceMeters,
    userCoords,
    config,
    errorCode: isAllowed ? undefined : 'OUTSIDE_GEOFENCE',
    errorMessage: isAllowed
      ? undefined
      : `You are ${distanceMeters} m from ${config.officeName}. Punch is allowed only within ${config.radiusMeters} m.`,
  };
}

/**
 * Validate whether the current user is inside the designated office geofence.
 */
export async function verifyCurrentGeofence(already?: UserCoordinates): Promise<GeofenceVerificationResult> {
  const config = getOfficeGeofenceConfig();
  if (!config.enabled) {
    return { isAllowed: true, distanceMeters: null, userCoords: already || null, config, errorCode: 'DISABLED' };
  }
  try {
    return measureOfficeDistance(already || await getCurrentGPSLocation());
  } catch (error: unknown) {
    const failed = error as { code?: GeofenceVerificationResult['errorCode']; message?: string };
    return {
      isAllowed: false,
      distanceMeters: null,
      userCoords: null,
      config,
      errorCode: failed.code || 'POSITION_UNAVAILABLE',
      errorMessage: failed.message || 'Location is required before attendance can be saved.',
    };
  }
}
