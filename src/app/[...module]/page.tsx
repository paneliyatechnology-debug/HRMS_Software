import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { parseRoutePath } from '../../lib/routes';
import { HrmsAppShell } from '../../components/layout/HrmsAppShell';

interface ModulePageProps {
  params: Promise<{ module?: string[] }>;
}

export default async function ModulePage({ params }: ModulePageProps) {
  const resolvedParams = await params;
  const segments = resolvedParams?.module || [];
  const fullPath = '/' + segments.join('/');

  const resolution = parseRoutePath(fullPath);

  if (!resolution.isValid) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-[#b7e4c7] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-700">Loading Paneliya HRMS...</span>
        </div>
      }
    >
      <HrmsAppShell
        initialModule={resolution.module}
        initialSubTab={resolution.subTab}
      />
    </Suspense>
  );
}

