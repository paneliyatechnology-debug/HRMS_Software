'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { LandingPage } from '../components/landing/LandingPage';
import { HrmsAppShell } from '../components/layout/HrmsAppShell';
import { getRouteForModule } from '../lib/routes';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  // Backward compatibility: If an old URL such as /?module=attendance is accessed, redirect to clean path /attendance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const mod = urlParams.get('module');
      if (mod) {
        urlParams.delete('module');
        const rest = urlParams.toString();
        const cleanPath = getRouteForModule(mod) + (rest ? `?${rest}` : '');
        router.replace(cleanPath);
        return;
      }
      if (isAuthenticated && !isLoading) {
        router.replace('/dashboard');
      }
    }
  }, [searchParams, router, isAuthenticated, isLoading]);

  if (isLoading && !isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#b7e4c7] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-700">Loading Paneliya HRMS...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage onOpenLogin={() => router.push('/login')} />;
  }

  return <HrmsAppShell initialModule="dashboard" />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-[#b7e4c7] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-700">Loading Paneliya HRMS...</span>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
