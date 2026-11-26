'use client';

import { useEffect, useRef } from 'react';

export function useCompanyLive(scopes: string[], reload: () => void) {
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  const scopeKey = scopes.join('|');

  useEffect(() => {
    const allowed = new Set(scopeKey.split('|').filter(Boolean));
    let timer = 0;
    const onChange = (event: Event) => {
      const scope = String((event as CustomEvent).detail?.scope || '');
      if (!allowed.has('all') && scope !== 'all' && !allowed.has(scope)) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => reloadRef.current(), 300);
    };
    window.addEventListener('hrms_company_data', onChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hrms_company_data', onChange);
    };
  }, [scopeKey]);
}
