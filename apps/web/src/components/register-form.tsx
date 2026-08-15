'use client';

import { useState } from 'react';
import { LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, Button, CheckboxField, TextField } from '@it-sum/ui';

export function RegisterForm() {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    setIsSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) return <Alert tone="success" title={t('auth.verifyEmailTitle')}>{t('auth.verifyEmailBody')}</Alert>;

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <TextField label={t('auth.fullName')} name="fullName" autoComplete="name" required startIcon={<UserRound />} />
      <TextField label={t('auth.email')} name="email" type="email" placeholder={t('auth.emailPlaceholder')} autoComplete="email" required startIcon={<Mail />} />
      <TextField label={t('auth.password')} name="password" type="password" autoComplete="new-password" description={t('auth.passwordRules')} required startIcon={<LockKeyhole />} />
      <TextField label={t('auth.passwordConfirm')} name="passwordConfirm" type="password" autoComplete="new-password" required startIcon={<LockKeyhole />} />
      <CheckboxField label={t('auth.termsAgreement')} name="terms" required />
      <Button type="submit" fullWidth isLoading={isSubmitting}>{t('auth.submitRegister')}</Button>
    </form>
  );
}
