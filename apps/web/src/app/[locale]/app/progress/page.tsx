import { ArrowRight, CalendarCheck2, Clock3, Target } from 'lucide-react';
import { Badge, Card, LinkButton, ProgressBar } from '@it-sum/ui';
import { mockResources, mockRoadmaps } from '@it-sum/shared/mocks';
import { getPageTranslations } from '@/i18n/server';

const WEEKLY_ACTIVITY = [
  { day: 'mon', minutes: 42 },
  { day: 'tue', minutes: 68 },
  { day: 'wed', minutes: 35 },
  { day: 'thu', minutes: 84 },
  { day: 'fri', minutes: 56 },
  { day: 'sat', minutes: 24 },
  { day: 'sun', minutes: 72 },
];

export default async function ProgressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);
  const inProgress = mockResources.filter((resource) => resource.progress && resource.progress.percent < 100);
  const completed = mockResources.filter((resource) => resource.progress?.percent === 100).length;
  const totalMinutes = WEEKLY_ACTIVITY.reduce((total, item) => total + item.minutes, 0);

  return (
    <div>
      <div className="mb-8">
        <Badge tone="primary">{t('progress.eyebrow')}</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-on-background">{t('progress.title')}</h1>
        <p className="mt-2 max-w-2xl text-on-surface-variant">{t('progress.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={<CalendarCheck2 className="size-5" />} label={t('progress.metrics.studyDays')} value="5 / 7" />
        <Metric icon={<Clock3 className="size-5" />} label={t('progress.metrics.studyTime')} value={`${totalMinutes} min`} />
        <Metric icon={<Target className="size-5" />} label={t('progress.metrics.completed')} value={`${completed + 4}`} />
      </div>

      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-on-surface">{t('progress.weekTitle')}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t('progress.weekSubtitle')}</p>
          </div>
          <span className="text-sm font-semibold text-primary">{t('progress.goal')}</span>
        </div>
        <div className="mt-6 grid grid-cols-7 items-end gap-2 sm:gap-4">
          {WEEKLY_ACTIVITY.map((item) => (
            <div key={item.day} className="flex flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end justify-center rounded-lg bg-surface-container-low p-1">
                <div className="w-full rounded-md bg-primary" style={{ height: `${Math.max(12, (item.minutes / 90) * 100)}%` }} aria-label={`${item.minutes} minutes`} />
              </div>
              <span className="text-xs text-on-surface-variant">{t(`progress.days.${item.day}`)}</span>
            </div>
          ))}
        </div>
      </Card>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-on-background">{t('progress.resourcesTitle')}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t('progress.resourcesSubtitle')}</p>
          </div>
          <LinkButton href={`/${locale}/resources`} variant="tonal" size="sm">{t('progress.browse')}<ArrowRight className="ms-2 size-4" /></LinkButton>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {inProgress.map((resource) => (
            <Card key={resource.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge tone="info">{t(`materialKind.${resource.materialKind}`)}</Badge>
                  <h3 className="mt-3 font-semibold text-on-surface">{resource.displayTitle}</h3>
                </div>
                <span className="text-sm font-bold text-primary">{Math.round(resource.progress?.percent ?? 0)}%</span>
              </div>
              <div className="mt-5"><ProgressBar value={resource.progress?.percent ?? 0} label={resource.displayTitle} /></div>
              <LinkButton href={`/${locale}/app/resource/${resource.id}`} variant="text" size="sm" className="mt-3">{t('progress.continue')}<ArrowRight className="ms-2 size-4" /></LinkButton>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-on-background">{t('progress.roadmapsTitle')}</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {mockRoadmaps.map((roadmap) => {
            const language = locale === 'en' ? 'en' : 'ar';
            const roadmapTitle = roadmap.title[language] ?? roadmap.slug;
            return (
              <Card key={roadmap.id} variant="outlined" className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-on-surface">{roadmapTitle}</h3>
                  <span className="text-sm font-bold text-primary">{Math.round(roadmap.progressPercent)}%</span>
                </div>
                <p className="mt-2 text-sm text-on-surface-variant">{roadmap.description[language]}</p>
                <div className="mt-4"><ProgressBar value={roadmap.progressPercent} label={roadmapTitle} /></div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <Card className="flex items-center gap-3 p-4"><div className="grid size-10 place-items-center rounded-full bg-primary-container text-on-primary-container">{icon}</div><div><div className="text-xs text-on-surface-variant">{label}</div><div className="text-xl font-semibold text-on-surface">{value}</div></div></Card>;
}
