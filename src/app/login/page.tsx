'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginPage } from '../../components/auth/LoginPage';
import { useAuth } from '../../context/AuthContext';

export default function DirectLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <LoginPage onBackToHome={() => router.push('/')} />;
}
