import { Bell, Globe2, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Badge, Card, CheckboxField, SelectField, TextField } from '@it-sum/ui';
import { getPageTranslations } from '@/i18n/server';

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);
  const account = { name: 'Demo Student', email: 'student@demo.itsum.test' };

  return (
    <div>
      <div className="mb-8">
        <Badge tone="primary">{t('settings.eyebrow')}</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-on-background">{t('settings.title')}</h1>
        <p className="mt-2 max-w-2xl text-on-surface-variant">{t('settings.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-5">
            <div className="grid size-11 place-items-center rounded-full bg-primary-container text-on-primary-container"><UserRound className="size-5" aria-hidden="true" /></div>
            <div><h2 className="font-semibold text-on-surface">{t('settings.profileTitle')}</h2><p className="text-sm text-on-surface-variant">{t('settings.profileSubtitle')}</p></div>
          </div>
          <div className="mt-5 space-y-5">
            <TextField label={t('settings.name')} name="name" defaultValue={account.name} startIcon={<UserRound />} />
            <TextField label={t('settings.email')} name="email" type="email" defaultValue={account.email} startIcon={<Mail />} readOnly />
            <div className="flex items-center gap-2 rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant"><ShieldCheck className="size-5 text-primary" aria-hidden="true" />{t('settings.verified')}</div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-5">
            <div className="grid size-11 place-items-center rounded-full bg-secondary-container text-on-secondary-container"><Globe2 className="size-5" aria-hidden="true" /></div>
            <div><h2 className="font-semibold text-on-surface">{t('settings.preferencesTitle')}</h2><p className="text-sm text-on-surface-variant">{t('settings.preferencesSubtitle')}</p></div>
          </div>
          <div className="mt-5 space-y-5">
            <SelectField label={t('settings.language')} name="language" defaultValue={locale} options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]} />
            <div className="space-y-3 rounded-xl border border-outline-variant/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-on-surface"><Bell className="size-4 text-primary" aria-hidden="true" />{t('settings.notificationsTitle')}</div>
              <CheckboxField label={t('settings.weeklyReminder')} name="weeklyReminder" defaultChecked />
              <CheckboxField label={t('settings.newResources')} name="newResources" defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
