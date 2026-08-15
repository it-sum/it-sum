import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <DashboardShell area="student">{children}</DashboardShell>;
}
