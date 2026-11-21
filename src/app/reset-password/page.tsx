'use client';

import React, { Suspense } from 'react';
import { ResetPasswordPage } from '../../components/auth/ResetPasswordPage';

export default function DirectResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-[3px] border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordPage />
    </Suspense>
  );
}
