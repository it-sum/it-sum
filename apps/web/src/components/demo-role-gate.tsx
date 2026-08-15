'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getDemoSession } from '../lib/demo-auth';

export function DemoRoleGate({ requiredRole, children }: { requiredRole: 'student' | 'admin'; children: ReactNode }) {
  const router = useRouter();
  const locale = useLocale();
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const session = getDemoSession();
    if (session?.role === requiredRole || (requiredRole === 'student' && session?.role === 'admin')) setAllowed(true);
    else router.replace(`/${locale}/login?next=/${locale}/admin`);
  }, [locale, requiredRole, router]);
  return allowed ? children : <div className="mx-auto max-w-2xl px-4 py-16 text-center text-on-surface-variant">Checking demo access…</div>;
}
