'use client';

import { useEffect } from 'react';

export function PhoneSecureLink() {
  useEffect(() => {
    if (window.isSecureContext) return;
    const phone = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    const lan = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(window.location.hostname);
    if (!phone || !lan) return;
    const port = window.location.port || '3000';
    const next = `https://${window.location.hostname}:${port}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(next);
  }, []);
  return null;
}
