import { Code2, HeartHandshake, ShieldCheck, Users } from 'lucide-react';
import { getPageTranslations } from '@/i18n/server';
import { Button, Card, CardBody, CardHeader, CardTitle } from '@it-sum/ui';
import { PageHeader } from '@/components/page-header';
import { Link } from '@/i18n/routing';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);
  const items = [
    { title: t('about.missionTitle'), body: t('about.missionBody'), icon: HeartHandshake },
    { title: t('about.nonProfitTitle'), body: t('about.nonProfitBody'), icon: ShieldCheck },
    { title: t('about.adminsTitle'), body: t('about.adminsBody'), icon: Users },
    { title: t('about.openSourceTitle'), body: t('about.openSourceBody'), icon: Code2 },
  ];

  return (
    <>
      <PageHeader title={t('about.title')} description={t('meta.tagline')} />
      <div className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(({ title, body, icon: Icon }) => (
            <Card key={title} variant="outlined" className="h-full">
              <CardHeader>
                <div className="grid size-11 place-items-center rounded-xl bg-primary-container text-on-primary-container"><Icon className="size-5" aria-hidden="true" /></div>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardBody><p className="text-body-large text-on-surface-variant">{body}</p></CardBody>
            </Card>
          ))}
        </div>
        <Card variant="filled" className="mt-8 overflow-hidden">
          <CardBody className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div><h2 className="text-headline-small text-on-surface">{t('about.creditsTitle')}</h2><p className="mt-2 max-w-2xl text-body-large text-on-surface-variant">{t('about.creditsBody')}</p></div>
            <Link href="/contact"><Button variant="tonal">{t('nav.contact')}</Button></Link>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
