import { Mail, MessageCircle } from 'lucide-react';
import { getPageTranslations } from '@/i18n/server';
import { Card, CardBody } from '@it-sum/ui';
import { PageHeader } from '@/components/page-header';
import { ContactForm } from '@/components/contact-form';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);

  return (
    <>
      <PageHeader title={t('contact.title')} description={t('contact.subtitle')} />
      <div className="mx-auto grid max-w-[var(--it-sum-content-max-width)] gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[0.7fr_1.3fr] lg:px-8">
        <div className="space-y-4">
          <Card variant="filled"><CardBody className="p-5"><div className="grid size-11 place-items-center rounded-xl bg-primary-container text-on-primary-container"><MessageCircle className="size-5" aria-hidden="true" /></div><h2 className="mt-4 text-title-medium text-on-surface">{t('contact.categoryGeneral')}</h2><p className="mt-2 text-body-medium text-on-surface-variant">{t('contact.responseTime')}</p></CardBody></Card>
          <Card variant="outlined"><CardBody className="flex items-center gap-3 p-5"><Mail className="size-5 text-primary" aria-hidden="true" /><span className="text-body-medium text-on-surface-variant">support@it-sum.org</span></CardBody></Card>
        </div>
        <Card variant="outlined"><CardBody className="p-5 sm:p-8"><ContactForm /></CardBody></Card>
      </div>
    </>
  );
}
