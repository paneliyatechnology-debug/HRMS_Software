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

/**
 * Get map of all employees and their WFH approval status
 */
export function getEmployeeWFHMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WFH);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load WFH map:', e);
  }
  return {};
}

/**
 * Check if a specific employee has Work From Home (WFH) enabled
 * When enabled, Geofencing verification is bypassed for this employee,
 * but Selfie & Device verification remains required.
 */
export function isEmployeeWFHEnabled(employeeId?: string): boolean {
  if (!employeeId) return false;
  const map = getEmployeeWFHMap();
  const direct = map[employeeId];
  if (direct !== undefined) return Boolean(direct);
  const lower = map[employeeId.toLowerCase()];
  if (lower !== undefined) return Boolean(lower);
  return false;
}

/**
 * Admin action: Turn ON / OFF Work From Home for an employee
 */
export function setEmployeeWFHStatus(employeeId: string, enabled: boolean): void {
  if (!employeeId || typeof window === 'undefined') return;
  const map = getEmployeeWFHMap();
  map[employeeId] = enabled;
  map[employeeId.toLowerCase()] = enabled;
  try {
    localStorage.setItem(STORAGE_KEY_WFH, JSON.stringify(map));
    window.dispatchEvent(
      new CustomEvent('hrms_wfh_status_updated', {
        detail: { employeeId, enabled },
      })
    );
  } catch (e) {
    console.error('Failed to save WFH status:', e);
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

/**
 * Retrieve office geofence settings from localStorage or fallback to default
 */
export function getOfficeGeofenceConfig(): OfficeGeofenceConfig {
  if (typeof window === 'undefined') return DEFAULT_OFFICE_GEOFENCE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GEOFENCE);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_OFFICE_GEOFENCE,
        ...parsed,
        latitude: Number(parsed.latitude) || DEFAULT_OFFICE_GEOFENCE.latitude,
        longitude: Number(parsed.longitude) || DEFAULT_OFFICE_GEOFENCE.longitude,
        radiusMeters: Number(parsed.radiusMeters) || DEFAULT_OFFICE_GEOFENCE.radiusMeters,
        enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : true,
      };
    }
  } catch (e) {
    console.error('Failed to parse geofence config:', e);
  }
  return DEFAULT_OFFICE_GEOFENCE;
}

/**
 * Save office geofence settings (Admin or Calibration)
 */
export function saveOfficeGeofenceConfig(config: OfficeGeofenceConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_GEOFENCE, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('hrms_geofence_updated', { detail: config }));
  } catch (e) {
    console.error('Failed to save geofence config:', e);
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
