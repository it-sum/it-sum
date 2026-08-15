import { ArrowUpRight, CheckCircle2, Clock3, Compass, Map, Route, Sparkles } from 'lucide-react';
import { getPageTranslations } from '@/i18n/server';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, ProgressBar } from '@it-sum/ui';
import { Link } from '@/i18n/routing';
import { MarketingHero } from '@/components/marketing-hero';
import { mockRoadmaps } from '@it-sum/shared/mocks';

export default async function RoadmapsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);
  const language = locale === 'ar' ? 'ar' : 'en';

  return (
    <>
      <MarketingHero
        index="03"
        eyebrow={t('nav.roadmaps')}
        title={t('roadmaps.title')}
        description={t('roadmaps.subtitle')}
        signal={t('roadmaps.info')}
      />

      <div className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card variant="filled" className="bg-surface-container-low"><CardBody className="p-5"><div className="flex items-center justify-between"><p className="text-label-large text-on-surface-variant">{t('nav.roadmaps')}</p><Compass className="size-5 text-primary" aria-hidden="true" /></div><p className="mt-6 text-display-small text-on-surface" data-numeric="true">{mockRoadmaps.length}</p><p className="mt-1 text-body-small text-on-surface-variant">{t('roadmaps.title')}</p></CardBody></Card>
          <Card variant="filled" className="bg-surface-container-low"><CardBody className="p-5"><div className="flex items-center justify-between"><p className="text-label-large text-on-surface-variant">{t('roadmaps.info')}</p><Sparkles className="size-5 text-tertiary" aria-hidden="true" /></div><p className="mt-6 text-display-small text-on-surface" data-numeric="true">100%</p><p className="mt-1 text-body-small text-on-surface-variant">{t('roadmaps.start')}</p></CardBody></Card>
          <Card variant="filled" className="bg-surface-container-low"><CardBody className="p-5"><div className="flex items-center justify-between"><p className="text-label-large text-on-surface-variant">{t('roadmaps.external')}</p><Route className="size-5 text-primary" aria-hidden="true" /></div><p className="mt-6 text-display-small text-on-surface">{t('roadmaps.hours', { count: mockRoadmaps.reduce((sum, roadmap) => sum + (roadmap.estimatedHours ?? 0), 0) })}</p><p className="mt-1 text-body-small text-on-surface-variant">{t('roadmaps.subtitle')}</p></CardBody></Card>
        </div>

        <div className="mt-16 flex items-end justify-between gap-4 border-b border-outline-variant/60 pb-5">
          <div>
            <p className="text-label-large text-primary">01 / PATHS</p>
            <h2 className="mt-2 text-headline-small text-on-surface">{t('roadmaps.title')}</h2>
          </div>
          <span className="hidden text-body-small text-on-surface-variant sm:inline">{t('roadmaps.info')}</span>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {mockRoadmaps.map((roadmap, index) => (
            <Card key={roadmap.id} variant="outlined" interactive className="group overflow-hidden">
              <div className="relative flex h-44 items-end overflow-hidden bg-primary-container p-5 text-on-primary-container">
                <div className="pointer-events-none absolute -end-8 -top-14 size-48 rounded-full border-[28px] border-current opacity-10" />
                <div className="relative flex w-full items-end justify-between gap-4">
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary text-on-primary shadow-level1"><Route className="size-6" aria-hidden="true" /></div>
                  <span className="text-display-small opacity-30" data-numeric="true">{String(index + 1).padStart(2, '0')}</span>
                </div>
              </div>
              <CardHeader className="pt-6">
                <div className="flex items-start justify-between gap-3"><CardTitle className="text-headline-small">{roadmap.title[language]}</CardTitle><Badge tone="primary" numeric>{Math.round(roadmap.progressPercent)}%</Badge></div>
                <p className="text-body-medium text-on-surface-variant">{roadmap.description[language]}</p>
              </CardHeader>
              <CardBody className="pt-3">
                <ProgressBar value={roadmap.progressPercent} label={`${Math.round(roadmap.progressPercent)}%`} tone="reward" />
                <div className="mt-4 flex flex-wrap gap-4 text-body-small text-on-surface-variant"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-tertiary" aria-hidden="true" />{roadmap.completedNodeCount} / {roadmap.nodeCount}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" aria-hidden="true" />{roadmap.estimatedHours == null ? '—' : t('roadmaps.hours', { count: roadmap.estimatedHours })}</span></div>
                <div className="mt-6 flex flex-wrap gap-2"><Link href={`/app/roadmaps/${roadmap.slug}` as never}><Button endIcon={<ArrowUpRight />}>{t('roadmaps.start')}</Button></Link>{roadmap.externalReferenceUrl != null && <a href={roadmap.externalReferenceUrl} target="_blank" rel="noreferrer"><Button variant="text">{t('roadmaps.external')}</Button></a>}</div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low px-5 py-4 text-on-surface-variant"><Map className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><p className="text-body-medium">{t('roadmaps.info')}</p></div>
      </div>
    </>
  );
}
