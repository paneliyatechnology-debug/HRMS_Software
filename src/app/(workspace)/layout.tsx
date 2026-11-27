'use client';

import { WorkspaceApp } from './workspace-app';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WorkspaceApp />
      <div hidden>{children}</div>
    </>
  );
}
