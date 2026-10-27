/**
 * Device & Browser Detection Utility for HRMS Employee Punches
 * Accurately detects device type (Mobile, Tablet, Desktop), Operating System,
 * Browser name & version, screen resolution, and hardware characteristics.
 */

export interface DevicePunchInfo {
  deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown';
  deviceModel: string;
  os: string;
  browser: string;
  screenResolution: string;
  orientation?: string;
  userAgent?: string;
  platform?: string;
  language?: string;
  timestamp?: string;
  ipAddress?: string;
}

export function detectUserDevice(): DevicePunchInfo {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'Unknown',
      deviceModel: 'Server',
      os: 'Unknown OS',
      browser: 'Unknown Browser',
      screenResolution: 'N/A',
      timestamp: new Date().toISOString(),
    };
  }

  const ua = navigator.userAgent || '';
  const screenW = window.screen.width || window.innerWidth;
  const screenH = window.screen.height || window.innerHeight;
  const dpr = window.devicePixelRatio ? Math.round(window.devicePixelRatio * 10) / 10 : 1;
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // 1. Detect Operating System & Model
  let os = 'Unknown OS';
  let deviceModel = 'Generic Device';
  let deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown' = 'Desktop';

  if (/iPhone/i.test(ua)) {
    os = 'iOS';
    deviceType = 'Mobile';
    deviceModel = 'Apple iPhone';
    const match = ua.match(/OS (\d+[_\d]*)/i);
    if (match) os = `iOS ${match[1].replace(/_/g, '.')}`;
  } else if (/iPad/i.test(ua) || (navigator.platform === 'MacIntel' && maxTouchPoints > 1)) {
    os = 'iPadOS';
    deviceType = 'Tablet';
    deviceModel = 'Apple iPad';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
    const match = ua.match(/Android\s+([0-9\.]+)/i);
    if (match) os = `Android ${match[1]}`;

    // Extract device model if present in Android UA e.g. "SM-G998B", "Pixel 7"
    const modelMatch = ua.match(/;\s*([A-Za-z0-9\s_\-]+)\s+Build/i);
    if (modelMatch && modelMatch[1]) {
      deviceModel = modelMatch[1].trim();
    } else {
      deviceModel = 'Android Device';
    }

    if (/Tablet|Nexus 7|Nexus 10|SM-T/i.test(ua) || screenW >= 600) {
      deviceType = 'Tablet';
    } else {
      deviceType = 'Mobile';
    }
  } else if (/Windows NT 10\.0/i.test(ua)) {
    os = 'Windows 10/11';
    deviceType = 'Desktop';
    deviceModel = 'Windows PC';
  } else if (/Windows NT/i.test(ua)) {
    os = 'Windows';
    deviceType = 'Desktop';
    deviceModel = 'Windows PC';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
    deviceType = 'Desktop';
    deviceModel = 'Apple Mac';
    const match = ua.match(/Mac OS X (\d+[_\d]*)/i);
    if (match) os = `macOS ${match[1].replace(/_/g, '.')}`;
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
    deviceType = 'Desktop';
    deviceModel = 'Linux Workstation';
  } else if (/CrOS/i.test(ua)) {
    os = 'ChromeOS';
    deviceType = 'Desktop';
    deviceModel = 'Chromebook';
  }

  // Refine mobile vs desktop based on touch & dimensions
  if (deviceType === 'Desktop' && maxTouchPoints > 0 && screenW <= 768) {
    deviceType = 'Mobile';
  }

  // 2. Detect Browser
  let browser = 'Unknown Browser';
  if (/Edg\/|Edge\//i.test(ua)) {
    const match = ua.match(/Edg\/([0-9\.]+)/i);
    browser = `Microsoft Edge ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/OPR\/|Opera\//i.test(ua)) {
    const match = ua.match(/OPR\/([0-9\.]+)/i);
    browser = `Opera ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Chrome\/([0-9\.]+)/i.test(ua) && !/Chromium/i.test(ua)) {
    const match = ua.match(/Chrome\/([0-9\.]+)/i);
    browser = `Chrome ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    const match = ua.match(/Version\/([0-9\.]+)/i);
    browser = `Safari ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Firefox\/([0-9\.]+)/i.test(ua)) {
    const match = ua.match(/Firefox\/([0-9\.]+)/i);
    browser = `Firefox ${match ? match[1].split('.')[0] : ''}`.trim();
  }

  const orientation =
    typeof window !== 'undefined' && window.screen?.orientation
      ? window.screen.orientation.type.includes('portrait')
        ? 'Portrait'
        : 'Landscape'
      : screenH > screenW
      ? 'Portrait'
      : 'Landscape';

  return {
    deviceType,
    deviceModel,
    os,
    browser,
    screenResolution: `${screenW}×${screenH} (DPR ${dpr})`,
    orientation,
    userAgent: ua,
    platform: navigator.platform || 'Unknown',
    language: navigator.language || 'en-US',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Returns a human-friendly short summary of the device, e.g. "Mobile • Chrome on Android"
 */
export function formatDeviceSummary(info?: DevicePunchInfo | null): string {
  if (!info) return 'Unknown Device';
  const icon =
    info.deviceType === 'Mobile' ? '📱' : info.deviceType === 'Tablet' ? '📟' : '💻';
  return `${icon} ${info.deviceModel || info.os} (${info.browser})`;
}
