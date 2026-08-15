'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, Button, SelectField, TextAreaField, TextField } from '@it-sum/ui';

export function ContactForm() {
  const t = useTranslations();
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    setIsSending(false);
    setSubmitted(true);
  }

  if (submitted) {
    return <Alert tone="success" title={t('contact.successTitle')}>{t('contact.successBody')}</Alert>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label={t('contact.name')} name="name" autoComplete="name" required />
        <TextField label={t('contact.email')} name="email" type="email" autoComplete="email" required />
      </div>
      <TextField label={t('contact.subject')} name="subject" required />
      <SelectField label={t('contact.category')} name="category" required placeholder={t('contact.categoryGeneral')} options={[
        { value: 'general', label: t('contact.categoryGeneral') },
        { value: 'content', label: t('contact.categoryContent') },
        { value: 'bug', label: t('contact.categoryBug') },
        { value: 'join', label: t('contact.categoryJoin') },
      ]} />
      <TextAreaField label={t('contact.message')} name="message" placeholder={t('contact.messagePlaceholder')} required rows={7} />
      <div className="flex flex-wrap items-center gap-4"><Button type="submit" isLoading={isSending} startIcon={<Send />}>{isSending ? t('contact.sending') : t('contact.send')}</Button><p className="text-body-small text-on-surface-variant">{t('contact.responseTime')}</p></div>
    </form>
  );
}
