'use client';

import { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Badge, Button, Card, CheckboxField, TextField } from '@it-sum/ui';
import { authenticateDemo, DEMO_ACCOUNTS, setDemoSession, type DemoRole } from '../lib/demo-auth';

export function LoginForm() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function enterDemo(role: DemoRole) {
    setDemoSession({ role, email: DEMO_ACCOUNTS[role].email, name: DEMO_ACCOUNTS[role].name });
    router.push(searchParams.get('next') ?? `/${locale}/app`);
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    await new Promise((resolve) => window.setTimeout(resolve, 220));
    const session = authenticateDemo(String(form.get('email') ?? ''), String(form.get('password') ?? ''));
    if (!session) {
      setError('Demo login only: use one of the credentials shown below. Production Supabase login is not connected in this preview.');
      setIsSubmitting(false);
      return;
    }
    setDemoSession(session);
    router.push(searchParams.get('next') ?? `/${locale}/app`);
    router.refresh();
  }

  return <div className="space-y-6">
    <Alert tone="info"><strong>Preview mode:</strong> explore the complete interface without Supabase, API, or Google Drive secrets. These accounts are local demo sessions only.</Alert>
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {error != null && <Alert tone="error">{error}</Alert>}
      <TextField label={t('auth.email')} name="email" type="email" placeholder={t('auth.emailPlaceholder')} autoComplete="email" required startIcon={<Mail />} />
      <TextField label={t('auth.password')} name="password" type="password" autoComplete="current-password" required startIcon={<LockKeyhole />} />
      <div className="flex flex-wrap items-center justify-between gap-3"><CheckboxField label={t('auth.rememberMe')} name="remember" /><a href="#forgot-password" className="text-body-small text-primary underline-offset-4 hover:underline">{t('auth.forgotPassword')}</a></div>
      <Button type="submit" fullWidth isLoading={isSubmitting} endIcon={<ArrowRight />}>{t('auth.submitLogin')}</Button>
    </form>
    <div className="grid gap-3 sm:grid-cols-2">
      <DemoAccountCard accountRole="student" onEnter={enterDemo} />
      <DemoAccountCard accountRole="admin" onEnter={enterDemo} />
    </div>
  </div>;
}

function DemoAccountCard({ accountRole, onEnter }: { accountRole: DemoRole; onEnter: (role: DemoRole) => void }) {
  const account = DEMO_ACCOUNTS[accountRole];
  const isAdmin = accountRole === 'admin';
  return <Card variant="outlined" className="p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2">{isAdmin ? <ShieldCheck className="size-5 text-primary" /> : <UserRound className="size-5 text-primary" />}<span className="font-semibold text-on-surface">{isAdmin ? 'Admin demo' : 'Student demo'}</span></div><Badge tone={isAdmin ? 'primary' : 'info'}>{accountRole}</Badge></div><p className="mt-3 break-all text-xs text-on-surface-variant">{account.email}</p><p className="mt-1 text-xs text-on-surface-variant">Password: <code>{account.password}</code></p><Button type="button" variant="tonal" size="sm" className="mt-4 w-full" onClick={() => onEnter(accountRole)}>Enter demo</Button></Card>;
}
