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
import { Button, Card, CardBody, CardHeader, CardTitle } from '@it-sum/ui';
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
      <section className="relative isolate overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(to_right,var(--md-sys-color-outline-variant)_1px,transparent_1px),linear-gradient(to_bottom,var(--md-sys-color-outline-variant)_1px,transparent_1px)] [background-size:4rem_4rem] [mask-image:linear-gradient(to_bottom,black,transparent_86%)]" />
        <div className="pointer-events-none absolute -top-48 start-1/2 -z-10 size-[34rem] -translate-x-1/2 rounded-full bg-primary-container/45 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-56 -end-20 -z-10 size-[28rem] rounded-full bg-reward-container/40 blur-3xl" />

        <div className="mx-auto grid max-w-[var(--it-sum-content-max-width)] items-center gap-14 px-4 pb-20 pt-16 sm:px-6 md:pb-28 md:pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,0.82fr)] lg:gap-20 lg:px-8 lg:pt-28">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-container/70 px-3.5 py-2 text-label-medium text-on-primary-container shadow-level1">
              <Sparkles className="size-4" aria-hidden="true" />
              {t('home.heroBadge')}
            </div>
            <h1 className="max-w-3xl text-display-small text-on-surface sm:text-display-medium lg:text-display-large">
              {t('home.heroTitle')}
            </h1>
            <p className="mt-7 max-w-2xl text-body-large leading-relaxed text-on-surface-variant sm:text-title-medium">
              {t('home.heroSubtitle')}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/register">
                <Button size="lg" endIcon={<ArrowInline />}>
                  {t('home.heroPrimaryCta')}
                </Button>
              </Link>
              <Link href="/departments">
                <Button size="lg" variant="outlined">
                  {t('home.heroSecondaryCta')}
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-body-small text-on-surface-variant">
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-tertiary" aria-hidden="true" />
                {t('common.poweredBy')}
              </span>
              <span className="hidden h-4 w-px bg-outline-variant sm:block" aria-hidden="true" />
              <span>{t('home.contributorsBody')}</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:me-0">
            <div className="absolute -inset-5 rounded-[15px] bg-primary/15 blur-2xl" />
            <div className="glass-surface relative overflow-hidden rounded-[15px] p-3 shadow-level4 sm:p-4">
              <div className="glass-soft relative overflow-hidden rounded-[15px]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-tertiary to-reward" />
                <div className="flex items-center justify-between border-b border-outline-variant/60 px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-label-medium uppercase tracking-[0.16em] text-primary">IT-SUM</p>
                    <p className="mt-1 text-title-medium text-on-surface">{t('nav.resources')}</p>
                  </div>
                  <div className="glass-soft flex items-center gap-2 rounded-[15px] px-3 py-1.5 text-label-small text-on-primary-container">
                    <span className="size-1.5 rounded-full bg-tertiary" aria-hidden="true" />
                    {t('home.statsResources')}
                  </div>
                </div>

                <div className="space-y-3 p-5 sm:p-6">
                  {mockResources.slice(0, 3).map((resource, index) => (
                    <div key={resource.id} className="glass-soft group flex items-center gap-3 rounded-[15px] p-3.5 transition-transform duration-200 hover:-translate-y-0.5 sm:gap-4">
                      <div className={`grid size-11 shrink-0 place-items-center rounded-[15px] ${index === 0 ? 'bg-primary-container/75 text-on-primary-container' : index === 1 ? 'bg-reward-container/75 text-on-reward-container' : 'bg-secondary-container/75 text-on-secondary-container'} backdrop-blur-sm`}>
                        {resource.type === 'video' ? <PlayCircle className="size-5" aria-hidden="true" /> : <BookOpen className="size-5" aria-hidden="true" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-title-small text-on-surface">{resource.displayTitle}</p>
                        <p className="mt-1 text-body-small text-on-surface-variant">
                          {resource.type === 'pdf' ? `${resource.pageCount ?? 0} ${t('common.page')}` : t('resources.watchVideo')}
                        </p>
                      </div>
                      <div className="size-2 rounded-full bg-tertiary" aria-hidden="true" />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-outline-variant/60 bg-surface-container px-5 py-4 sm:px-6">
                  <div>
                    <p data-numeric="true" className="text-headline-small text-on-surface">86%</p>
                    <p className="mt-1 text-body-small text-on-surface-variant">{t('home.statsStudents')}</p>
                  </div>
                  <div className="border-s border-outline-variant/60 ps-4 rtl:border-s-0 rtl:border-e rtl:pe-4 rtl:ps-0">
                    <p data-numeric="true" className="text-headline-small text-on-surface">24/7</p>
                    <p className="mt-1 text-body-small text-on-surface-variant">{t('home.statsVideos')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-surface absolute -bottom-7 -start-5 hidden rounded-[15px] px-4 py-3 shadow-level2 sm:block">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-[15px] bg-reward-container/75 backdrop-blur-sm text-on-reward-container"><Trophy className="size-5" aria-hidden="true" /></div>
                <div>
                  <p className="text-label-small text-on-surface-variant">{t('home.feature3Title')}</p>
                  <p className="mt-0.5 text-title-small text-on-surface">{t('home.ctaTitle')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={t('home.statsResources')} className="border-y border-outline-variant/60 bg-surface-container-lowest">
        <div className="mx-auto grid max-w-[var(--it-sum-content-max-width)] grid-cols-2 divide-x divide-outline-variant/60 px-4 py-7 rtl:divide-x-reverse sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-3 text-start sm:justify-center">
              <Icon className="hidden size-5 shrink-0 text-primary sm:block" aria-hidden="true" />
              <div>
                <p data-numeric="true" className="text-headline-small text-on-surface">{value}</p>
                <p className="mt-1 text-body-small text-on-surface-variant">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-label-large uppercase tracking-[0.18em] text-primary">{t('home.heroBadge')}</p>
            <h2 className="mt-4 text-headline-large text-on-surface sm:text-display-small">{t('home.featuresTitle')}</h2>
            <p className="mt-5 max-w-md text-body-large leading-relaxed text-on-surface-variant">{t('home.featuresSubtitle')}</p>
            <Link href="/resources" className="mt-7 inline-flex">
              <Button variant="text" endIcon={<ArrowInline />}>{t('nav.resources')}</Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({ title, body, icon: Icon, tone }, index) => (
              <Card key={title} variant="outlined" className={`group h-full overflow-hidden transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-level2 ${index === 0 ? 'sm:translate-y-5' : ''}`}>
                <CardHeader>
                  <div className={`mb-2 grid size-11 place-items-center rounded-[15px] ${tone} backdrop-blur-sm`}><Icon className="size-5" aria-hidden="true" /></div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardBody><p className="text-body-medium leading-relaxed text-on-surface-variant">{body}</p></CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low">
        <div className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="grid gap-10 rounded-[15px] bg-primary p-6 text-on-primary shadow-level3 sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:p-12">
            <div>
              <div className="grid size-12 place-items-center rounded-[15px] bg-primary-container/75 backdrop-blur-sm text-on-primary-container"><Route className="size-6" aria-hidden="true" /></div>
              <p className="mt-8 text-label-large uppercase tracking-[0.18em] text-on-primary/75">{t('home.howTitle')}</p>
              <h2 className="mt-3 text-headline-large sm:text-display-small">{t('home.ctaTitle')}</h2>
              <p className="mt-4 max-w-lg text-body-large leading-relaxed text-on-primary/80">{t('home.ctaBody')}</p>
              <Link href="/register" className="mt-8 inline-flex"><Button variant="reward" endIcon={<ArrowInline />}>{t('home.heroPrimaryCta')}</Button></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {studySteps.map(([number, title, body]) => (
                <Card key={number} variant="filled" className="h-full border border-on-primary/10 bg-on-primary/10 text-on-primary">
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
        <div className="glass-surface relative overflow-hidden rounded-[15px] px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
          <div className="pointer-events-none absolute -end-16 -top-24 size-64 rounded-full bg-secondary-container/50 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-primary"><Map className="size-5" aria-hidden="true" /><span className="text-label-large">{t('home.contributorsTitle')}</span></div>
              <h2 className="mt-4 max-w-2xl text-headline-medium text-on-surface sm:text-headline-large">{t('home.contributorsBody')}</h2>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-body-small text-on-surface-variant">
                <span className="inline-flex items-center gap-2 glass-soft rounded-[15px] px-3 py-2"><Clock3 className="size-4 text-primary" aria-hidden="true" />{t('home.feature2Title')}</span>
                <span className="inline-flex items-center gap-2 glass-soft rounded-[15px] px-3 py-2"><CheckCircle2 className="size-4 text-tertiary" aria-hidden="true" />{t('home.feature6Title')}</span>
              </div>
            </div>
            <div className="flex -space-x-3 rtl:space-x-reverse" aria-hidden="true">
              {['A', 'M', 'S', '+'].map((letter, index) => <div key={letter} className={`grid size-14 place-items-center rounded-full border-4 border-surface-container text-title-small shadow-level1 ${index === 3 ? 'bg-reward text-on-reward' : 'bg-primary-container text-on-primary-container'}`}>{letter}</div>)}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
