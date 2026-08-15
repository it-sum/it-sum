import Image from 'next/image';
import { ArrowUpRight, BookOpen, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { getPageTranslations } from '@/i18n/server';
import { Card, CardBody } from '@it-sum/ui';
import { Link } from '@/i18n/routing';
import { LoginForm } from '@/components/login-form';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);

  return (
    <main className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-surface-container-lowest">
      <div className="pointer-events-none absolute start-[-12rem] top-[-12rem] size-[34rem] rounded-full bg-primary-container/35 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute end-[-12rem] bottom-[-12rem] size-[34rem] rounded-full bg-secondary-container/30 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[var(--it-sum-content-max-width)] items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20 lg:px-8 lg:py-16">
        <section className="hidden lg:block" aria-labelledby="login-hero-title">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-[15px] border border-primary/20 bg-primary-container/50 backdrop-blur-sm px-3 py-1.5 text-label-large text-on-primary-container">
              <Sparkles className="size-4" aria-hidden="true" />
              <span>{t('auth.eyebrow')}</span>
            </div>
            <h1 id="login-hero-title" className="mt-7 text-display-medium text-on-surface xl:text-display-large">
              {t('auth.loginTitle')}
            </h1>
            <p className="mt-5 max-w-lg text-body-large leading-8 text-on-surface-variant">{t('auth.loginSubtitle')}</p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <div className="glass-soft flex items-start gap-3 rounded-[15px] p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-[15px] bg-primary text-on-primary"><BookOpen className="size-5" aria-hidden="true" /></div>
                <div><p className="text-title-small text-on-surface">{t('auth.featureOneTitle')}</p><p className="mt-1 text-body-small leading-5 text-on-surface-variant">{t('auth.featureOneBody')}</p></div>
              </div>
              <div className="glass-soft flex items-start gap-3 rounded-[15px] p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-[15px] bg-secondary-container/75 backdrop-blur-sm text-on-secondary-container"><ShieldCheck className="size-5" aria-hidden="true" /></div>
                <div><p className="text-title-small text-on-surface">{t('auth.featureTwoTitle')}</p><p className="mt-1 text-body-small leading-5 text-on-surface-variant">{t('auth.featureTwoBody')}</p></div>
              </div>
            </div>

            <div className="mt-9 flex items-center gap-3 text-body-small text-on-surface-variant">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                <span className="grid size-8 place-items-center rounded-full border-2 border-surface-container-lowest bg-primary text-xs font-bold text-on-primary">IT</span>
                <span className="grid size-8 place-items-center rounded-full border-2 border-surface-container-lowest bg-secondary text-xs font-bold text-on-secondary">SU</span>
                <span className="grid size-8 place-items-center rounded-full border-2 border-surface-container-lowest bg-tertiary text-xs font-bold text-on-tertiary">+</span>
              </div>
              <span>{t('common.poweredBy')}</span>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl" aria-labelledby="login-form-title">
          <Card variant="elevated" className="glass-surface overflow-hidden rounded-[15px]">
            <CardBody className="p-6 sm:p-9 lg:p-10">
              <div className="mb-8 flex items-start justify-between gap-4 border-b border-outline-variant/70 pb-6">
                <div>
                  <div className="mb-4 flex items-center gap-3 lg:hidden">
                    <Image src="/brand/it-sum-logo.webp" alt="IT-SUM" width={44} height={44} className="size-11 rounded-[15px] object-cover" priority />
                    <span className="text-title-medium font-bold text-on-surface">IT-SUM</span>
                  </div>
                  <p className="text-label-large text-primary">{t('auth.previewLabel')}</p>
                  <h2 id="login-form-title" className="mt-2 text-headline-small text-on-surface">{t('auth.loginTitle')}</h2>
                  <p className="mt-2 max-w-md text-body-medium leading-6 text-on-surface-variant">{t('auth.previewBody')}</p>
                </div>
                <div className="glass-soft hidden size-12 shrink-0 place-items-center rounded-[15px] text-on-primary-container sm:grid">
                  <CheckCircle2 className="size-6" aria-hidden="true" />
                </div>
              </div>
              <LoginForm />
              <p className="mt-7 text-center text-body-medium text-on-surface-variant">
                {t('auth.noAccount')}{' '}
                <Link href="/register" className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline">
                  {t('nav.register')}<ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </p>
            </CardBody>
          </Card>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-body-small text-on-surface-variant">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            <span>{t('auth.secureNote')}</span>
          </p>
        </section>
      </div>
    </main>
  );
}
