import { Clock3, Mail, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { getPageTranslations } from '@/i18n/server';
import { Card, CardBody } from '@it-sum/ui';
import { ContactForm } from '@/components/contact-form';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);

  return (
    <main className="relative overflow-hidden bg-surface-container-lowest">
      <div className="pointer-events-none absolute -top-32 start-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-primary-container/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute end-[-10rem] top-1/2 size-[22rem] rounded-full bg-secondary-container/25 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-[var(--it-sum-content-max-width)] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-16">
          <section className="lg:sticky lg:top-24" aria-labelledby="contact-title">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-container/50 px-3 py-1.5 text-label-large text-on-primary-container">
              <Sparkles className="size-4" aria-hidden="true" />
              <span>{t('contact.eyebrow')}</span>
            </div>
            <h1 id="contact-title" className="mt-6 max-w-xl text-display-small text-on-surface sm:text-display-medium">
              {t('contact.title')}
            </h1>
            <p className="mt-5 max-w-lg text-body-large leading-8 text-on-surface-variant">
              {t('contact.subtitle')}
            </p>

            <div className="mt-8 flex items-start gap-4 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-4 sm:p-5">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-on-primary shadow-sm">
                <MessageCircle className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-title-small text-on-surface">{t('contact.helperTitle')}</h2>
                <p className="mt-1 text-body-small leading-6 text-on-surface-variant">{t('contact.helperBody')}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Card variant="outlined" className="bg-surface/80">
                <CardBody className="flex items-start gap-3 p-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary-container text-on-secondary-container">
                    <Mail className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-label-medium text-on-surface-variant">{t('contact.emailLabel')}</p>
                    <a href="mailto:support@it-sum.org" className="mt-1 block truncate text-body-medium font-semibold text-primary underline-offset-4 hover:underline">
                      support@it-sum.org
                    </a>
                  </div>
                </CardBody>
              </Card>
              <Card variant="outlined" className="bg-surface/80">
                <CardBody className="flex items-start gap-3 p-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-tertiary-container text-on-tertiary-container">
                    <Clock3 className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-label-medium text-on-surface-variant">{t('contact.responseLabel')}</p>
                    <p className="mt-1 text-body-medium font-semibold text-on-surface">{t('contact.responseTime')}</p>
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="mt-6 flex items-center gap-2 text-body-small text-on-surface-variant">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              <span>{t('contact.secureNote')}</span>
            </div>
          </section>

          <section aria-labelledby="contact-form-title">
            <Card variant="elevated" className="overflow-hidden rounded-[1.75rem] border border-outline-variant/60 bg-surface/95 shadow-[0_24px_70px_rgba(32,45,60,0.12)]">
              <CardBody className="p-6 sm:p-8 lg:p-10">
                <div className="mb-8 border-b border-outline-variant/70 pb-6">
                  <p className="text-label-large text-primary">IT-SUM SUPPORT</p>
                  <h2 id="contact-form-title" className="mt-2 text-headline-small text-on-surface">{t('contact.quickTitle')}</h2>
                  <p className="mt-2 max-w-xl text-body-medium leading-6 text-on-surface-variant">{t('contact.quickBody')}</p>
                </div>
                <ContactForm />
              </CardBody>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
