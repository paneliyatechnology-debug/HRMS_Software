/**
 * Geofencing & Location Verification Service
 * Handles GPS coordinate retrieval, Haversine distance calculations,
 * and office geofence verification for employee Check-In and Check-Out.
 */

export interface OfficeGeofenceConfig {
  officeName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // Maximum allowed distance in meters (e.g. 200m)
  enabled: boolean;     // Toggle geofencing on/off
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

/**
 * Get map of all employees and their WFH approval status
 */
export function getEmployeeWFHMap(): Record<string, boolean> {
  return liveWfhMap;
}

/**
 * Check if a specific employee has Work From Home (WFH) enabled
 * When enabled, Geofencing verification is bypassed for this employee,
 * but Selfie & Device verification remains required.
 */
export function isEmployeeWFHEnabled(employeeId?: string): boolean {
  if (!employeeId) return false;
  const direct = liveWfhMap[employeeId];
  if (direct !== undefined) return Boolean(direct);
  const lower = liveWfhMap[employeeId.toLowerCase()];
  if (lower !== undefined) return Boolean(lower);
  return false;
}

/**
 * Admin action: Turn ON / OFF Work From Home for an employee (in-memory)
 */
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
 * Default Office Location (Paneliya Technology HQ, Surat)
 */
export const DEFAULT_OFFICE_GEOFENCE: OfficeGeofenceConfig = {
  officeName: 'Paneliya Technology HQ (Surat)',
  latitude: 21.1702,
  longitude: 72.8311,
  radiusMeters: 250, // 250m radius
  enabled: true,
};

let liveGeofenceConfig: OfficeGeofenceConfig = { ...DEFAULT_OFFICE_GEOFENCE };

/**
 * Retrieve office geofence settings
 */
export function getOfficeGeofenceConfig(): OfficeGeofenceConfig {
  return liveGeofenceConfig;
}

/**
 * Save office geofence settings (in-memory, strictly avoids localStorage persistence)
 */
export function saveOfficeGeofenceConfig(config: OfficeGeofenceConfig): void {
  liveGeofenceConfig = { ...config };
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_GEOFENCE);
    } catch {}
    window.dispatchEvent(new CustomEvent('hrms_geofence_updated', { detail: config }));
  }
}

/**
 * Haversine formula to compute great-circle distance between two GPS coordinates in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Retrieve current GPS coordinates using the Browser Geolocation API
 */
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
        let message = 'Unable to determine your GPS location. Please check your device location settings.';

        if (err.code === err.PERMISSION_DENIED) {
          code = 'PERMISSION_DENIED';
          message = 'Location permission was denied. Please allow location access in your browser to punch attendance.';
        } else if (err.code === err.TIMEOUT) {
          code = 'TIMEOUT';
          message = 'GPS location request timed out. Please try again with clear sky / good connection.';
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
 * Validate whether the current user is physically inside the designated office geofence.
 */
export async function verifyCurrentGeofence(): Promise<GeofenceVerificationResult> {
  const config = getOfficeGeofenceConfig();

  // If admin has turned geofencing off
  if (!config.enabled) {
    return {
      isAllowed: true,
      distanceMeters: 0,
      userCoords: null,
      config,
    };
  }

  try {
    const coords = await getCurrentGPSLocation();
    const distance = calculateHaversineDistance(
      coords.latitude,
      coords.longitude,
      config.latitude,
      config.longitude
    );

    const isInside = distance <= config.radiusMeters;

    if (isInside) {
      return {
        isAllowed: true,
        distanceMeters: distance,
        userCoords: coords,
        config,
      };
    } else {
      return {
        isAllowed: false,
        distanceMeters: distance,
        userCoords: coords,
        config,
        errorCode: 'OUTSIDE_GEOFENCE',
        errorMessage: `You are ${distance}m away from ${config.officeName}. Maximum allowed radius is ${config.radiusMeters}m. Please move inside the office perimeter to punch attendance.`,
      };
    }
  } catch (error: any) {
    return {
      isAllowed: false,
      distanceMeters: null,
      userCoords: null,
      config,
      errorCode: error.code || 'POSITION_UNAVAILABLE',
      errorMessage: error.message || 'Could not verify your location. Please enable GPS and allow location permission.',
    };
  }
}
