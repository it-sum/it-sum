'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FolderOpen,
  FolderSync,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Badge, Button, Card } from '@it-sum/ui';
import { clearDemoSession, getDemoSession, type DemoSession } from '../lib/demo-auth';

export function DashboardShell({ children, area = 'student' }: { children: ReactNode; area?: 'student' | 'admin' }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rtl = locale === 'ar';
  const Arrow = rtl ? ChevronLeft : ChevronRight;
  const isAdminArea = area === 'admin';

  useEffect(() => {
    setSession(getDemoSession());
    const onSessionChange = () => setSession(getDemoSession());
    window.addEventListener('it_sum_session_change', onSessionChange);
    window.addEventListener('storage', onSessionChange);
    return () => {
      window.removeEventListener('it_sum_session_change', onSessionChange);
      window.removeEventListener('storage', onSessionChange);
    };
  }, []);

  const items = isAdminArea
    ? [
        { href: `/${locale}/admin`, label: rtl ? 'نظرة عامة' : 'Overview', icon: LayoutDashboard },
        { href: `/${locale}/admin/users`, label: rtl ? 'المستخدمون' : 'Users', icon: UsersRound },
        { href: `/${locale}/admin/content`, label: rtl ? 'المحتوى' : 'Content', icon: FolderOpen },
        { href: `/${locale}/admin/quizzes`, label: rtl ? 'الاختبارات' : 'Quizzes', icon: ClipboardCheck },
        { href: `/${locale}/admin/sync`, label: rtl ? 'المزامنة' : 'Drive sync', icon: FolderSync },
      ]
    : [
        { href: `/${locale}/student`, label: rtl ? 'نظرة عامة' : 'Overview', icon: LayoutDashboard },
        { href: `/${locale}/student/resources`, label: rtl ? 'مكتبة الموارد' : 'Resource library', icon: FolderOpen },
        { href: `/${locale}/student/quizzes`, label: rtl ? 'الاختبارات' : 'Practice quizzes', icon: ClipboardCheck },
        { href: `/${locale}/student/progress`, label: rtl ? 'التقدم' : 'My progress', icon: BarChart3 },
        { href: `/${locale}/student/rewards`, label: rtl ? 'المكافآت' : 'Rewards', icon: ShieldCheck },
      ];

  function logout() {
    clearDemoSession();
    setMobileOpen(false);
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-background/60" dir={rtl ? 'rtl' : 'ltr'}>
      <aside className="glass-panel sticky top-0 z-30 hidden h-dvh w-[18.5rem] shrink-0 flex-col rounded-none border-y-0 border-s-0 border-e border-outline-variant/70 bg-surface/60 shadow-level3 backdrop-blur-2xl lg:flex">
        <div className="border-b border-outline-variant/50 p-5">
          <div className="mb-5 flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-error/80" />
            <span className="size-2.5 rounded-full bg-reward/80" />
            <span className="size-2.5 rounded-full bg-success/80" />
          </div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-[15px] border border-primary/20 bg-primary/[0.12] text-primary shadow-level1">
              {isAdminArea ? <ShieldCheck className="size-4" /> : <BarChart3 className="size-4" />}
            </span>
            <p className="text-label-medium tracking-[0.12em] text-primary">IT-SUM WORKSPACE</p>
          </div>
          <p className="mt-2 text-title-medium text-on-surface">
            {isAdminArea ? (rtl ? 'مركز الإدارة' : 'Admin center') : rtl ? 'مساحة التعلم' : 'Learning workspace'}
          </p>
        </div>
        <nav className="flex-1 space-y-1.5 p-4" aria-label={rtl ? 'تنقل مساحة التعلم' : 'Learning workspace navigation'}>
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href.includes('/resources') && pathname.includes('/resources'));
            return (
              <a
                key={href}
                href={href}
                className={`state-layer flex min-h-12 items-center gap-3 rounded-[15px] border px-3.5 text-label-large transition-[background-color,border-color,box-shadow,color,transform] ${active ? 'border-primary/25 bg-primary/[0.12] text-on-surface shadow-level1' : 'border-transparent text-on-surface-variant hover:-translate-y-0.5 hover:border-outline-variant/70 hover:bg-surface-high/70 hover:text-on-surface'}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {active && <Arrow className="size-4 opacity-70" aria-hidden="true" />}
              </a>
            );
          })}
        </nav>
        <div className="border-t border-outline-variant/50 p-4">
          <Card variant="outlined" className="border-outline-variant/70 bg-surface/45 p-4 shadow-level1 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
                {session?.role === 'admin' ? <ShieldCheck className="size-5" /> : <BookOpen className="size-5" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-title-small text-on-surface">{session?.name ?? (rtl ? 'طالب IT-SUM' : 'IT-SUM student')}</p>
                <Badge tone={session?.role === 'admin' ? 'primary' : 'info'}>{session?.role ?? 'demo'}</Badge>
              </div>
            </div>
            <Button variant="text" size="sm" fullWidth startIcon={<LogOut />} onClick={logout} className="mt-4 justify-start">
              {rtl ? 'تسجيل الخروج' : 'Sign out'}
            </Button>
          </Card>
        </div>
      </aside>

      <div className="min-w-0 lg:ms-72">
        <div className="glass-panel sticky top-0 z-20 flex items-center justify-between rounded-none border-x-0 border-t-0 border-outline-variant/70 bg-surface/60 px-4 py-3 shadow-level2 backdrop-blur-2xl lg:hidden">
          <Button variant="text" size="sm" className="size-11 min-h-11 !p-0" startIcon={mobileOpen ? <X /> : <Menu />} onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? (rtl ? 'إغلاق القائمة' : 'Close menu') : (rtl ? 'فتح القائمة' : 'Open menu')} aria-expanded={mobileOpen} />
          <div className="flex items-center gap-2 text-title-small text-on-surface">
            {isAdminArea ? <ShieldCheck className="size-5 text-primary" /> : <BarChart3 className="size-5 text-primary" />}
            <span>IT-SUM</span>
          </div>
          <Button variant="text" size="sm" className="size-11 min-h-11 !p-0" startIcon={<LogOut />} onClick={logout} aria-label={rtl ? 'تسجيل الخروج' : 'Sign out'} />
        </div>
        {mobileOpen && (
          <nav className="glass-panel relative z-10 border-x-0 border-outline-variant/70 bg-surface/75 p-3 shadow-level3 backdrop-blur-2xl lg:hidden" aria-label={rtl ? 'تنقل مساحة التعلم' : 'Learning navigation'}>
            <div className="flex flex-col gap-1.5">
              {items.map(({ href, label, icon: Icon }) => (
                <a key={href} href={href} onClick={() => setMobileOpen(false)} className="state-layer flex min-h-12 items-center gap-3 rounded-[15px] border border-transparent px-3.5 text-label-large text-on-surface hover:border-outline-variant/60 hover:bg-surface-high/70">
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </a>
              ))}
            </div>
          </nav>
        )}
        <div className="min-h-[calc(100dvh-4rem)] bg-background/35">{children}</div>
      </div>
    </div>
  );
}
