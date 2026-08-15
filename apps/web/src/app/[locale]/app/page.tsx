import Link from 'next/link';
import { ArrowRight, BookOpenCheck, Flame, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge, Card, LinkButton, ProgressBar } from '@it-sum/ui';
import { mockResources } from '@it-sum/shared/mocks';
import { getPageTranslations } from '@/i18n/server';

export default async function AppDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);
  const continueItems = mockResources.filter((item) => item.progress && item.progress.percent < 100);
  return <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><Badge tone="primary">{t('app.eyebrow')}</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight text-on-background">{t('app.title')}</h1><p className="mt-2 text-on-surface-variant">{t('app.subtitle')}</p></div><LinkButton href={`/${locale}/resources`} variant="filled">{t('app.browse')}<ArrowRight className="ms-2 size-4" /></LinkButton></div>
    <div className="grid gap-4 sm:grid-cols-3"><Metric icon={<BookOpenCheck className="size-5" />} label={t('app.metrics.resources')} value="12" /><Metric icon={<Flame className="size-5" />} label={t('app.metrics.streak')} value="4 days" /><Metric icon={<Trophy className="size-5" />} label={t('app.metrics.points')} value="185" /></div>
    <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold text-on-background">{t('app.continue')}</h2><Link href={`/${locale}/resources`} className="text-sm font-semibold text-primary">{t('app.seeAll')}</Link></div><div className="grid gap-4 lg:grid-cols-2">{continueItems.map((item) => <Card key={item.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><Badge tone="info">{item.materialKind}</Badge><h3 className="mt-3 font-semibold text-on-surface">{item.displayTitle}</h3><p className="mt-1 text-sm text-on-surface-variant">{item.examPhase}</p></div><span className="text-sm font-bold text-primary">{Math.round(item.progress?.percent ?? 0)}%</span></div><div className="mt-5"><ProgressBar value={item.progress?.percent ?? 0} label={`${item.displayTitle} progress`} /></div><LinkButton href={`/${locale}/app/resource/${item.id}`} variant="tonal" size="sm" className="mt-4">{t('app.open')}<ArrowRight className="ms-2 size-4" /></LinkButton></Card>)}</div></section>
    <Card variant="outlined" className="mt-8 p-5"><h2 className="font-semibold text-on-surface">{t('app.tipTitle')}</h2><p className="mt-2 text-sm text-on-surface-variant">{t('app.tipBody')}</p></Card>
  </main>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <Card className="flex items-center gap-3 p-4"><div className="grid size-10 place-items-center rounded-full bg-primary-container text-on-primary-container">{icon}</div><div><div className="text-xs text-on-surface-variant">{label}</div><div className="text-xl font-semibold text-on-surface">{value}</div></div></Card>;
}
