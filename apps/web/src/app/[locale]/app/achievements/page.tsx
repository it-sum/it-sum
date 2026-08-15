import { Flame, Footprints, LockKeyhole, Trophy } from 'lucide-react';
import { Badge, Card } from '@it-sum/ui';
import { mockBadges } from '@it-sum/shared/mocks';
import { getPageTranslations } from '@/i18n/server';

const ICONS = { footprints: Footprints, trophy: Trophy, flame: Flame } as const;

export default async function AchievementsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);
  const earned = mockBadges.slice(0, 1);
  const upcoming = mockBadges.slice(1);

  return (
    <div>
      <div className="mb-8">
        <Badge tone="reward">{t('achievements.eyebrow')}</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-on-background">{t('achievements.title')}</h1>
        <p className="mt-2 max-w-2xl text-on-surface-variant">{t('achievements.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-on-surface-variant">{t('achievements.metrics.earned')}</p><p className="mt-2 text-3xl font-semibold text-on-surface">{earned.length}</p></Card>
        <Card className="p-5"><p className="text-sm text-on-surface-variant">{t('achievements.metrics.available')}</p><p className="mt-2 text-3xl font-semibold text-on-surface">{mockBadges.length}</p></Card>
        <Card className="p-5"><p className="text-sm text-on-surface-variant">{t('achievements.metrics.points')}</p><p className="mt-2 text-3xl font-semibold text-primary">{earned.reduce((total, badge) => total + badge.pointsReward, 0)}</p></Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-on-background">{t('achievements.earnedTitle')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {earned.map((badge) => <AchievementCard key={badge.id} badge={badge} locale={locale} earned t={t} />)}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-on-background">{t('achievements.upcomingTitle')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {upcoming.map((badge) => <AchievementCard key={badge.id} badge={badge} locale={locale} t={t} />)}
        </div>
      </section>
    </div>
  );
}

function AchievementCard({ badge, locale, earned = false, t }: { badge: (typeof mockBadges)[number]; locale: string; earned?: boolean; t: (key: string) => string }) {
  const Icon = ICONS[badge.iconName as keyof typeof ICONS] ?? Trophy;
  const language = locale === 'en' ? 'en' : 'ar';
  return (
    <Card variant={earned ? 'filled' : 'outlined'} className={`flex items-center gap-4 p-5 ${earned ? '' : 'opacity-80'}`}>
      <div className={`grid size-14 shrink-0 place-items-center rounded-[15px] ${earned ? 'bg-reward text-on-reward' : 'bg-surface-container-high text-on-surface-variant'}`}>
        {earned ? <Icon className="size-7" aria-hidden="true" /> : <LockKeyhole className="size-6" aria-hidden="true" />}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-on-surface">{badge.name[language]}</h3>
          <Badge tone={earned ? 'reward' : 'neutral'}>{badge.tier}</Badge>
        </div>
        <p className="mt-1 text-sm text-on-surface-variant">{badge.description[language]}</p>
        <p className="mt-2 text-xs font-semibold text-primary">+{badge.pointsReward} {t('achievements.points')}</p>
      </div>
    </Card>
  );
}
