import { Clock3, Mail, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { getPageTranslations } from '@/i18n/server';
import { Card, CardBody } from '@it-sum/ui';
import { ContactForm } from '@/components/contact-form';
import { MarketingHero } from '@/components/marketing-hero';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);

  return (
    <>
      <MarketingHero index="05" eyebrow={t('nav.contact')} title={t('contact.title')} description={t('contact.subtitle')} signal={t('contact.responseTime')} />
      <div className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <aside>
            <p className="text-label-large text-primary">01 / SAY HELLO</p>
            <h2 className="mt-3 text-headline-medium text-on-surface">{t('contact.subtitle')}</h2>
            <p className="mt-4 text-body-large leading-8 text-on-surface-variant">{t('contact.helperBody')}</p>
            <div className="mt-8 space-y-3">
              <Card variant="filled" className="bg-surface-container-low"><CardBody className="flex gap-4 p-5"><div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-on-primary"><MessageCircle className="size-5" aria-hidden="true" /></div><div><h3 className="text-title-small text-on-surface">{t('contact.helperTitle')}</h3><p className="mt-1 text-body-medium text-on-surface-variant">{t('contact.responseTime')}</p></div></CardBody></Card>
              <Card variant="outlined"><CardBody className="flex items-center gap-4 p-5"><div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-container text-on-primary-container"><Mail className="size-5" aria-hidden="true" /></div><div><p className="text-label-large text-on-surface-variant">{t('contact.emailLabel')}</p><a href="mailto:support@it-sum.org" className="mt-1 block text-body-medium font-semibold text-primary underline-offset-4 hover:underline">support@it-sum.org</a></div></CardBody></Card>
              <Card variant="outlined"><CardBody className="flex gap-4 p-5"><Clock3 className="mt-0.5 size-5 shrink-0 text-tertiary" aria-hidden="true" /><div><p className="text-label-large text-on-surface-variant">{t('contact.responseLabel')}</p><p className="mt-1 text-body-medium font-semibold text-on-surface">{t('contact.responseTime')}</p></div></CardBody></Card>
            </div>
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><p className="text-body-small text-on-surface-variant">{t('contact.secureNote')}</p></div>
          </aside>
          <section aria-labelledby="contact-form-title">
            <Card variant="elevated" className="overflow-hidden rounded-[1.75rem] border border-outline-variant/60 bg-surface/95 shadow-[0_24px_70px_rgba(32,45,60,0.12)]">
              <CardBody className="p-6 sm:p-8 lg:p-10">
                <div className="mb-8 flex items-start justify-between gap-4 border-b border-outline-variant/70 pb-6"><div><p className="text-label-large text-primary">02 / MESSAGE</p><h2 id="contact-form-title" className="mt-2 text-headline-small text-on-surface">{t('contact.quickTitle')}</h2><p className="mt-2 max-w-xl text-body-medium leading-6 text-on-surface-variant">{t('contact.quickBody')}</p></div><Sparkles className="mt-1 size-5 text-tertiary" aria-hidden="true" /></div>
                <ContactForm />
              </CardBody>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
