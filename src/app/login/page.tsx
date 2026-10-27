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
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading && isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#FFFDF7] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-black border-t-[#FFE600] rounded-full animate-spin" />
      </div>
    );
  }

  return <LoginPage onBackToHome={() => router.push('/')} />;
}
