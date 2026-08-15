import { ArrowUpRight, Code2, HeartHandshake, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { getPageTranslations } from '@/i18n/server';
import { Button, Card, CardBody, CardHeader, CardTitle } from '@it-sum/ui';
import { Link } from '@/i18n/routing';
import { MarketingHero } from '@/components/marketing-hero';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);
  const items = [
    { title: t('about.missionTitle'), body: t('about.missionBody'), icon: HeartHandshake, number: '01' },
    { title: t('about.nonProfitTitle'), body: t('about.nonProfitBody'), icon: ShieldCheck, number: '02' },
    { title: t('about.adminsTitle'), body: t('about.adminsBody'), icon: Users, number: '03' },
    { title: t('about.openSourceTitle'), body: t('about.openSourceBody'), icon: Code2, number: '04' },
  ];

  return (
    <>
      <MarketingHero
        index="04"
        eyebrow={t('nav.about')}
        title={t('about.title')}
        description={t('meta.tagline')}
        signal={t('about.missionBody')}
      />

      <div className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-16">
          <div>
            <p className="text-label-large text-primary">01 / THE IDEA</p>
            <h2 className="mt-3 text-headline-medium text-on-surface">{t('about.missionTitle')}</h2>
          </div>
          <div className="border-s-2 border-primary ps-6 sm:ps-8">
            <p className="text-headline-small leading-relaxed text-on-surface">{t('about.missionBody')}</p>
            <div className="mt-6 flex flex-wrap gap-3"><a href="https://github.com/it-sum/it-sum" target="_blank" rel="noreferrer"><Button endIcon={<ArrowUpRight />}>{t('about.viewSource')}</Button></a><Link href="/contact"><Button variant="tonal">{t('nav.contact')}</Button></Link></div>
          </div>
        </section>

        <section className="mt-20" aria-labelledby="principles-title">
          <div className="flex items-end justify-between gap-4 border-b border-outline-variant/60 pb-5"><div><p className="text-label-large text-primary">02 / PRINCIPLES</p><h2 id="principles-title" className="mt-2 text-headline-small text-on-surface">{t('about.title')}</h2></div><Sparkles className="size-6 text-tertiary" aria-hidden="true" /></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {items.map(({ title, body, icon: Icon, number }) => (
              <Card key={title} variant="outlined" interactive className="group h-full">
                <CardHeader className="flex-row items-start justify-between gap-4 p-6 pb-3"><div className="grid size-11 place-items-center rounded-[15px] bg-primary-container text-on-primary-container"><Icon className="size-5" aria-hidden="true" /></div><span className="text-label-medium text-on-surface-variant" data-numeric="true">{number}</span></CardHeader>
                <CardBody className="p-6 pt-2"><CardTitle className="text-title-large">{title}</CardTitle><p className="mt-3 text-body-large text-on-surface-variant">{body}</p><ArrowUpRight className="mt-6 size-5 text-primary transition-transform duration-200 ease-standard group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></CardBody>
              </Card>
            ))}
          </div>
        </section>

        <Card variant="filled" className="mt-10 overflow-hidden bg-secondary-container">
          <CardBody className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between"><div className="pointer-events-none absolute -end-10 -top-16 size-48 rounded-full border-[24px] border-on-secondary-container/10" /><div className="relative"><p className="text-label-large text-on-secondary-container">03 / COMMUNITY</p><h2 className="mt-2 text-headline-small text-on-secondary-container">{t('about.creditsTitle')}</h2><p className="mt-2 max-w-2xl text-body-large text-on-secondary-container/75">{t('about.creditsBody')}</p></div><Link href="/contact" className="relative shrink-0"><Button variant="filled">{t('nav.contact')}</Button></Link></CardBody>
        </Card>
      </div>
    </>
  );
}
