import {
  ArrowInline,
  BookOpen,
  CheckCircle2,
  Clock3,
  FolderTree,
  Map,
  PlayCircle,
  Route,
  Sparkles,
  Trophy,
  Users,
} from '@/components/icons';
import { getPageTranslations } from '@/i18n/server';
import { Badge, Button, Card, CardBody, CardDescription, CardHeader, CardTitle, ProgressBar, ProgressRing } from '@it-sum/ui';
import { Link } from '@/i18n/routing';
import { mockResources } from '@it-sum/shared/mocks';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);

  const stats = [
    { value: '223+', label: t('home.statsResources'), icon: BookOpen },
    { value: '12', label: t('home.statsCourses'), icon: FolderTree },
    { value: '35+', label: t('home.statsVideos'), icon: PlayCircle },
    { value: '348', label: t('home.statsStudents'), icon: Users },
  ];

  const features = [
    { title: t('home.feature1Title'), body: t('home.feature1Body'), icon: BookOpen, tone: 'bg-primary-container text-on-primary-container' },
    { title: t('home.feature2Title'), body: t('home.feature2Body'), icon: CheckCircle2, tone: 'bg-secondary-container text-on-secondary-container' },
    { title: t('home.feature3Title'), body: t('home.feature3Body'), icon: Trophy, tone: 'bg-reward-container text-on-reward-container' },
    { title: t('home.feature4Title'), body: t('home.feature4Body'), icon: FolderTree, tone: 'bg-tertiary-container text-on-tertiary-container' },
    { title: t('home.feature5Title'), body: t('home.feature5Body'), icon: PlayCircle, tone: 'bg-primary-container text-on-primary-container' },
    { title: t('home.feature6Title'), body: t('home.feature6Body'), icon: Users, tone: 'bg-secondary-container text-on-secondary-container' },
  ];

  const studySteps = [
    [1, t('home.howStep1Title'), t('home.howStep1Body')],
    [2, t('home.howStep2Title'), t('home.howStep2Body')],
    [3, t('home.howStep3Title'), t('home.howStep3Body')],
  ] as const;

  return (
    <>
      <section className="relative isolate overflow-hidden px-4 pb-16 pt-14 sm:px-6 md:pb-24 md:pt-20 lg:px-8 lg:pt-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_12%,color-mix(in_srgb,var(--md-sys-color-primary-container)_48%,transparent),transparent_28%),radial-gradient(circle_at_88%_22%,color-mix(in_srgb,var(--md-sys-color-tertiary-container)_40%,transparent),transparent_25%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-t from-background to-transparent" />

        <div className="mx-auto grid max-w-[var(--it-sum-content-max-width)] items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(31rem,0.8fr)] lg:gap-20">
          <div className="max-w-2xl">
            <Badge tone="primary" icon={<Sparkles />} className="rounded-full px-3 py-1.5">{t('home.heroBadge')}</Badge>
            <h1 className="mt-7 max-w-2xl text-display-small text-on-surface sm:text-display-medium lg:text-display-large">{t('home.heroTitle')}</h1>
            <p className="mt-6 max-w-xl text-body-large leading-relaxed text-on-surface-variant sm:text-title-medium">{t('home.heroSubtitle')}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register"><Button size="lg" endIcon={<ArrowInline />}>{t('home.heroPrimaryCta')}</Button></Link>
              <Link href="/departments"><Button size="lg" variant="outlined">{t('home.heroSecondaryCta')}</Button></Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-body-small text-on-surface-variant">
              <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-tertiary" aria-hidden="true" />{t('common.poweredBy')}</span>
              <span className="size-1 rounded-full bg-outline-variant" aria-hidden="true" />
              <span>{t('home.contributorsBody')}</span>
            </div>
          </div>

          <Card variant="elevated" className="relative overflow-hidden rounded-[15px] border border-outline-variant/60 glass-panel p-2 shadow-level4">
            <div className="pointer-events-none absolute -end-20 -top-20 size-56 rounded-full bg-primary-container/50 blur-3xl" />
            <CardBody className="relative overflow-hidden rounded-[15px] border border-outline-variant/50 bg-surface p-0">
              <div className="flex items-center justify-between border-b border-outline-variant/60 px-5 py-5 sm:px-6">
                <div>
                  <p className="text-label-medium uppercase tracking-[0.18em] text-primary">IT-SUM / 01</p>
                  <p className="mt-1.5 text-title-large text-on-surface">{t('app.eyebrow')}</p>
                </div>
                <ProgressRing value={68} size={54} strokeWidth={5} showLabel label={t('home.feature2Title')} />
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-body-small text-on-surface-variant">{t('app.continue')}</p>
                    <h2 className="mt-1 text-title-medium text-on-surface">{t('home.feature1Title')}</h2>
                  </div>
                  <Badge tone="success" numeric>68%</Badge>
                </div>
                <ProgressBar value={68} label={t('home.feature2Title')} />

                <div className="grid gap-3">
                  {mockResources.slice(0, 3).map((resource, index) => (
                    <div key={resource.id} className="flex items-center gap-3 rounded-[15px] border border-outline-variant/60 bg-surface-low p-3 transition-colors hover:border-primary/50 hover:bg-surface-high sm:gap-4">
                      <div className={`grid size-11 shrink-0 place-items-center rounded-[15px] ${index === 0 ? 'bg-primary-container text-on-primary-container' : index === 1 ? 'bg-reward-container text-on-reward-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                        {resource.type === 'video' ? <PlayCircle className="size-5" aria-hidden="true" /> : <BookOpen className="size-5" aria-hidden="true" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-title-small text-on-surface">{resource.displayTitle}</p>
                        <p className="mt-1 text-body-small text-on-surface-variant">{resource.type === 'pdf' ? `${resource.pageCount ?? 0} ${t('common.page')}` : t('resources.watchVideo')}</p>
                      </div>
                      <CheckCircle2 className={`size-5 shrink-0 ${index === 0 ? 'text-tertiary' : 'text-outline-variant'}`} aria-hidden="true" />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-[15px] bg-surface-container p-4">
                  <div>
                    <p data-numeric="true" className="text-headline-small text-on-surface">4</p>
                    <p className="mt-1 text-body-small text-on-surface-variant">{t('app.metrics.streak')}</p>
                  </div>
                  <div className="border-s border-outline-variant/60 ps-4 rtl:border-s-0 rtl:border-e rtl:pe-4 rtl:ps-0">
                    <p data-numeric="true" className="text-headline-small text-on-surface">86%</p>
                    <p className="mt-1 text-body-small text-on-surface-variant">{t('home.statsStudents')}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      <section aria-label={t('home.statsResources')} className="border-y border-outline-variant/60 bg-surface-low">
        <div className="mx-auto grid max-w-[var(--it-sum-content-max-width)] grid-cols-2 divide-x divide-outline-variant/60 px-4 py-4 rtl:divide-x-reverse sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-4 text-start sm:justify-center">
              <span className="hidden size-10 place-items-center rounded-[15px] bg-primary-container text-on-primary-container sm:grid"><Icon className="size-5" aria-hidden="true" /></span>
              <div>
                <p data-numeric="true" className="text-headline-small text-on-surface">{value}</p>
                <p className="mt-1 text-body-small text-on-surface-variant">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <p className="text-label-large uppercase tracking-[0.18em] text-primary">IT-SUM / 02</p>
            <h2 className="mt-4 text-headline-large text-on-surface sm:text-display-small">{t('home.featuresTitle')}</h2>
            <p className="mt-5 max-w-md text-body-large leading-relaxed text-on-surface-variant">{t('home.featuresSubtitle')}</p>
            <Link href="/resources" className="mt-7 inline-flex"><Button variant="text" endIcon={<ArrowInline />}>{t('nav.resources')}</Button></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({ title, body, icon: Icon, tone }, index) => (
              <Card key={title} variant={index % 3 === 0 ? 'elevated' : 'outlined'} className="group h-full rounded-[15px] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-level2">
                <CardHeader>
                  <div className={`mb-2 grid size-11 place-items-center rounded-[15px] ${tone}`}><Icon className="size-5" aria-hidden="true" /></div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription className="pt-1 leading-relaxed">{body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-low">
        <div className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="grid gap-10 rounded-[15px] bg-primary p-6 text-on-primary shadow-level3 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:p-12">
            <div>
              <div className="grid size-12 place-items-center rounded-[15px] bg-primary-container text-on-primary-container"><Route className="size-6" aria-hidden="true" /></div>
              <p className="mt-8 text-label-large uppercase tracking-[0.18em] text-on-primary/75">IT-SUM / 03</p>
              <h2 className="mt-3 text-headline-large sm:text-display-small">{t('home.ctaTitle')}</h2>
              <p className="mt-4 max-w-lg text-body-large leading-relaxed text-on-primary/80">{t('home.ctaBody')}</p>
              <Link href="/register" className="mt-8 inline-flex"><Button variant="reward" endIcon={<ArrowInline />}>{t('home.heroPrimaryCta')}</Button></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {studySteps.map(([number, title, body]) => (
                <Card key={number} variant="filled" className="h-full rounded-[15px] border border-on-primary/10 bg-on-primary/10 text-on-primary">
                  <CardBody className="p-5">
                    <div data-numeric="true" className="grid size-9 place-items-center rounded-full bg-reward text-label-large text-on-reward">{number}</div>
                    <h3 className="mt-6 text-title-medium">{title}</h3>
                    <p className="mt-2 text-body-medium text-on-primary/75">{body}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-20 sm:px-6 md:py-24 lg:px-8">
        <Card variant="outlined" className="relative overflow-hidden rounded-[15px] glass-panel px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
          <div className="pointer-events-none absolute -end-16 -top-24 size-64 rounded-full bg-secondary-container/50 blur-3xl" />
          <CardBody className="relative grid gap-10 p-0 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-primary"><Map className="size-5" aria-hidden="true" /><span className="text-label-large">{t('home.contributorsTitle')}</span></div>
              <h2 className="mt-4 max-w-2xl text-headline-medium text-on-surface sm:text-headline-large">{t('home.contributorsBody')}</h2>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-body-small text-on-surface-variant">
                <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-2"><Clock3 className="size-4 text-primary" aria-hidden="true" />{t('home.feature2Title')}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-2"><CheckCircle2 className="size-4 text-tertiary" aria-hidden="true" />{t('home.feature6Title')}</span>
              </div>
            </div>
            <div className="flex -space-x-3 rtl:space-x-reverse" aria-hidden="true">
              {['A', 'M', 'S', '+'].map((letter, index) => <div key={letter} className={`grid size-14 place-items-center rounded-full border-4 border-surface-container text-title-small shadow-level1 ${index === 3 ? 'bg-reward text-on-reward' : 'bg-primary-container text-on-primary-container'}`}>{letter}</div>)}
            </div>
          </CardBody>
        </Card>
      </section>
    </>
  );
}
