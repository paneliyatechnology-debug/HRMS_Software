'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginPage } from '../../components/auth/LoginPage';
import { useAuth } from '../../context/AuthContext';

export default function DirectLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
<<<<<<< HEAD
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);
=======
    if (isLoading || !isAuthenticated) return;
    const role = String(user?.role || '').toUpperCase();
    if (!role) return;
    const pendingPlan = window.sessionStorage.getItem('hrms_pending_plan');
    const canBuy = role === 'ADMIN' || role === 'COMPANY_ADMIN' || role === 'ORG_ADMIN';
    if (!pendingPlan || !canBuy) window.sessionStorage.removeItem('hrms_pending_plan');
    router.push(pendingPlan && canBuy ? '/settings' : '/dashboard');
  }, [isAuthenticated, isLoading, router, user?.role]);
>>>>>>> fc7234f7761e53c36c8bb346462e72bd91dbddd4

  if (isLoading || isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <LoginPage onBackToHome={() => router.push('/')} />;
}
