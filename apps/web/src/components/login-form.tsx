'use client';

import { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, Button, CheckboxField, TextField } from '@it-sum/ui';

export function LoginForm() {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    setIsSubmitting(false);
    setError(t('auth.invalidCredentials'));
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {error != null && <Alert tone="error">{error}</Alert>}
      <TextField label={t('auth.email')} name="email" type="email" placeholder={t('auth.emailPlaceholder')} autoComplete="email" required startIcon={<Mail />} />
      <TextField label={t('auth.password')} name="password" type="password" autoComplete="current-password" required startIcon={<LockKeyhole />} />
      <div className="flex flex-wrap items-center justify-between gap-3"><CheckboxField label={t('auth.rememberMe')} name="remember" /><a href="#forgot-password" className="text-body-small text-primary underline-offset-4 hover:underline">{t('auth.forgotPassword')}</a></div>
      <Button type="submit" fullWidth isLoading={isSubmitting} endIcon={<ArrowRight />}>{t('auth.submitLogin')}</Button>
    </form>
  );
}
