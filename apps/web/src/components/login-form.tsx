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
      setError(t('auth.previewError'));
      setIsSubmitting(false);
      return;
    }
    setDemoSession(session);
    router.push(searchParams.get('next') ?? `/${locale}/app`);
    router.refresh();
  }

  return (
    <div className="space-y-7">
      <Alert tone="info" title={t('auth.previewLabel')}>
        {t('auth.previewBody')}
      </Alert>
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {error != null && <Alert tone="error" title={t('auth.invalidCredentials')}>{error}</Alert>}
        <TextField label={t('auth.email')} name="email" type="email" placeholder={t('auth.emailPlaceholder')} autoComplete="email" required startIcon={<Mail />} />
        <TextField label={t('auth.password')} name="password" type="password" autoComplete="current-password" required startIcon={<LockKeyhole />} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CheckboxField label={t('auth.rememberMe')} name="remember" />
          <a href="#forgot-password" className="text-body-small font-semibold text-primary underline-offset-4 hover:underline">{t('auth.forgotPassword')}</a>
        </div>
        <Button type="submit" fullWidth isLoading={isSubmitting} endIcon={<ArrowRight />}>
          {t('auth.submitLogin')}
        </Button>
      </form>
      <div className="border-t border-outline-variant/70 pt-6">
        <div className="mb-4">
          <h3 className="text-title-medium text-on-surface">{t('auth.demoTitle')}</h3>
          <p className="mt-1 text-body-small text-on-surface-variant">{t('auth.demoBody')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <DemoAccountCard accountRole="student" onEnter={enterDemo} t={t} />
          <DemoAccountCard accountRole="admin" onEnter={enterDemo} t={t} />
        </div>
      </div>
    </div>
  );
}

function DemoAccountCard({ accountRole, onEnter, t }: { accountRole: DemoRole; onEnter: (role: DemoRole) => void; t: ReturnType<typeof useTranslations> }) {
  const account = DEMO_ACCOUNTS[accountRole];
  const isAdmin = accountRole === 'admin';
  return (
    <Card variant="outlined" className="bg-surface-container-low/60 p-4 transition-colors hover:border-primary/50 hover:bg-surface-container-low">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isAdmin ? <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden="true" /> : <UserRound className="size-5 shrink-0 text-primary" aria-hidden="true" />}
          <span className="truncate font-semibold text-on-surface">{isAdmin ? t('auth.adminDemo') : t('auth.studentDemo')}</span>
        </div>
        <Badge tone={isAdmin ? 'primary' : 'info'}>{isAdmin ? t('auth.adminDemo') : t('auth.studentDemo')}</Badge>
      </div>
      <p className="mt-3 break-all text-xs text-on-surface-variant">{account.email}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{t('auth.password')}: <code className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-on-surface">{account.password}</code></p>
      <Button type="button" variant="tonal" size="sm" className="mt-4 w-full" onClick={() => onEnter(accountRole)}>{t('auth.enterDemo')}</Button>
    </Card>
  );
}
