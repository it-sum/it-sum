'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { BarChart3, BookOpen, Bookmark, ChevronLeft, ChevronRight, ClipboardCheck, FolderOpen, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Trophy, X } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Badge, Card } from '@it-sum/ui';
import { clearDemoSession, getDemoSession, type DemoSession } from '../lib/demo-auth';

export function DashboardShell({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rtl = locale === 'ar';
  const Arrow = rtl ? ChevronLeft : ChevronRight;

  useEffect(() => setSession(getDemoSession()), []);

  const items = [
    { href: `/${locale}/app`, label: rtl ? 'نظرة عامة' : 'Overview', icon: LayoutDashboard },
    { href: `/${locale}/app/progress`, label: rtl ? 'تقدمي' : 'My progress', icon: BarChart3 },
    { href: `/${locale}/app/bookmarks`, label: rtl ? 'المحفوظات' : 'Bookmarks', icon: Bookmark },
    { href: `/${locale}/app/achievements`, label: rtl ? 'الإنجازات' : 'Achievements', icon: Trophy },
    { href: `/${locale}/app/settings`, label: rtl ? 'الإعدادات' : 'Settings', icon: Settings },
    { href: `/${locale}/resources`, label: rtl ? 'مكتبة الموارد' : 'Resource library', icon: FolderOpen },
    { href: `/${locale}/app/quiz/00000000-0000-4000-8000-000000000600`, label: rtl ? 'الاختبارات' : 'Practice quizzes', icon: ClipboardCheck },
    ...(session?.role === 'admin' ? [{ href: `/${locale}/admin`, label: rtl ? 'لوحة المشرف' : 'Admin console', icon: ShieldCheck }] : []),
  ];

  function logout() {
    clearDemoSession();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return <div className="bg-surface-container-low lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]" dir={rtl ? 'rtl' : 'ltr'}>
    <aside className="sticky top-0 z-30 hidden h-[calc(100dvh-4rem)] flex-col border-e border-outline-variant/50 bg-surface lg:flex">
      <div className="border-b border-outline-variant/50 p-5"><p className="text-label-medium text-primary">IT-SUM WORKSPACE</p><p className="mt-2 text-title-medium text-on-surface">{rtl ? 'مساحة التعلم' : 'Learning workspace'}</p></div>
      <nav className="flex-1 space-y-1 p-3" aria-label={rtl ? 'تنقل مساحة التعلم' : 'Learning workspace navigation'}>{items.map(({ href, label, icon: Icon }) => { const active = pathname === href || (href.includes('/resources') && pathname.includes('/resources')); return <a key={href} href={href} className={`group flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${active ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`} aria-current={active ? 'page' : undefined}><Icon className="size-5 shrink-0" aria-hidden="true" /><span className="flex-1">{label}</span>{active && <Arrow className="size-4 opacity-70" aria-hidden="true" />}</a>; })}</nav>
      <div className="border-t border-outline-variant/50 p-3"><Card variant="filled" className="p-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-full bg-primary text-on-primary">{session?.role === 'admin' ? <ShieldCheck className="size-5" /> : <BookOpen className="size-5" />}</div><div className="min-w-0"><p className="truncate text-title-small text-on-surface">{session?.name ?? (rtl ? 'طالب IT-SUM' : 'IT-SUM student')}</p><Badge tone={session?.role === 'admin' ? 'primary' : 'info'}>{session?.role ?? 'demo'}</Badge></div></div><button type="button" onClick={logout} className="mt-4 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start text-xs font-semibold text-on-surface-variant hover:bg-surface-high hover:text-on-surface"><LogOut className="size-4" />{rtl ? 'تسجيل الخروج' : 'Sign out'}</button></Card></div>
    </aside>
    <div className="min-w-0">
      <div className="flex items-center justify-between border-b border-outline-variant/50 bg-surface/90 px-4 py-3 backdrop-blur lg:hidden"><button type="button" onClick={() => setMobileOpen((value) => !value)} className="grid size-10 place-items-center rounded-full text-on-surface" aria-label={mobileOpen ? (rtl ? 'إغلاق القائمة' : 'Close menu') : (rtl ? 'فتح القائمة' : 'Open menu')} aria-expanded={mobileOpen}>{mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button><div className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" /><span className="text-title-small text-on-surface">IT-SUM</span></div><button type="button" onClick={logout} className="grid size-10 place-items-center rounded-full text-on-surface" aria-label={rtl ? 'تسجيل الخروج' : 'Sign out'}><LogOut className="size-5" /></button></div>
      {mobileOpen && <nav className="border-b border-outline-variant/50 bg-surface p-3 lg:hidden" aria-label={rtl ? 'تنقل مساحة التعلم' : 'Learning navigation'}>{items.map(({ href, label, icon: Icon }) => <a key={href} href={href} onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-on-surface hover:bg-surface-container"><Icon className="size-5" />{label}</a>)}</nav>}
      <div className="min-h-[calc(100dvh-4rem)]">{children}</div>
    </div>
  </div>;
}
