import Image from 'next/image';
import { getPageTranslations } from '@/i18n/server';
import { Card, CardBody } from '@it-sum/ui';
import { Link } from '@/i18n/routing';
import { RegisterForm } from '@/components/register-form';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] items-center bg-surface-container-lowest px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <Card variant="elevated" className="overflow-hidden rounded-[1.75rem]">
          <CardBody className="p-6 sm:p-8">
            <div className="mb-8 text-center"><Image src="/brand/it-sum-logo.webp" alt="" width={76} height={76} className="mx-auto size-19 rounded-full object-cover" priority /><h1 className="mt-5 text-headline-medium text-on-surface">{t('auth.registerTitle')}</h1><p className="mt-2 text-body-medium text-on-surface-variant">{t('auth.registerSubtitle')}</p></div>
            <RegisterForm />
            <p className="mt-6 text-center text-body-medium text-on-surface-variant">{t('auth.haveAccount')} <Link href="/login" className="text-primary underline-offset-4 hover:underline">{t('nav.login')}</Link></p>
          </CardBody>
        </Card>
      </div>
      <div className="hidden px-12 lg:block"><div className="mx-auto max-w-xl"><p className="text-label-large text-primary">{t('home.heroBadge')}</p><h2 className="mt-3 text-display-small text-on-surface">{t('home.howStep3Title')}</h2><p className="mt-5 text-body-large text-on-surface-variant">{t('auth.pendingBody')}</p></div></div>
    </div>
  );
}
