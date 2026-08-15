import { ArrowInline, BookOpen, CheckCircle2, FolderTree, PlayCircle, Sparkles, Trophy, Users } from '@/components/icons';
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
    { title: t('home.feature1Title'), body: t('home.feature1Body'), icon: BookOpen },
    { title: t('home.feature2Title'), body: t('home.feature2Body'), icon: CheckCircle2 },
    { title: t('home.feature3Title'), body: t('home.feature3Body'), icon: Trophy },
    { title: t('home.feature4Title'), body: t('home.feature4Body'), icon: FolderTree },
    { title: t('home.feature5Title'), body: t('home.feature5Body'), icon: PlayCircle },
    { title: t('home.feature6Title'), body: t('home.feature6Body'), icon: Users },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-outline-variant/50 bg-surface-container-lowest">
        <div className="pointer-events-none absolute -top-32 start-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-primary-container/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 -end-16 size-[24rem] rounded-full bg-reward-container/30 blur-3xl" />
        <div className="relative mx-auto grid max-w-[var(--it-sum-content-max-width)] items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-container px-3 py-1.5 text-label-medium text-on-primary-container">
              <Sparkles className="size-4" aria-hidden="true" />
              {t('home.heroBadge')}
            </div>
            <h1 className="text-display-small text-on-surface sm:text-display-medium lg:text-display-large">{t('home.heroTitle')}</h1>
            <p className="mt-6 max-w-2xl text-body-large text-on-surface-variant sm:text-title-medium">{t('home.heroSubtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register"><Button size="lg" endIcon={<ArrowInline />}>{t('home.heroPrimaryCta')}</Button></Link>
              <Link href="/departments"><Button size="lg" variant="outlined">{t('home.heroSecondaryCta')}</Button></Link>
            </div>
            <p className="mt-5 text-body-small text-on-surface-variant">{t('common.poweredBy')}</p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-5 rounded-[2rem] bg-primary/10 blur-2xl" />
            <Card variant="elevated" className="relative overflow-hidden rounded-[2rem] border border-outline-variant/60">
              <div className="flex items-center justify-between border-b border-outline-variant/60 bg-surface-container px-5 py-4">
                <div>
                  <p className="text-label-medium text-on-surface-variant">IT-SUM</p>
                  <p className="text-title-medium text-on-surface">{t('nav.resources')}</p>
                </div>
                <div className="grid size-11 place-items-center rounded-full bg-primary text-on-primary"><BookOpen className="size-5" aria-hidden="true" /></div>
              </div>
              <CardBody className="space-y-3 p-5">
                {mockResources.slice(0, 3).map((resource, index) => (
                  <Link key={resource.id} href="/resources" className="group flex items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface p-3 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-level1">
                    <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${index === 0 ? 'bg-primary-container text-on-primary-container' : index === 1 ? 'bg-reward-container text-on-reward-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                      {resource.type === 'video' ? <PlayCircle className="size-5" aria-hidden="true" /> : <BookOpen className="size-5" aria-hidden="true" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-title-small text-on-surface">{resource.displayTitle}</p>
                      <p className="mt-1 text-body-small text-on-surface-variant">{resource.type === 'pdf' ? `${resource.pageCount ?? 0} ${t('common.page')}` : t('resources.watchVideo')}</p>
                    </div>
                    <div className="size-2 rounded-full bg-tertiary" aria-hidden="true" />
                  </Link>
                ))}
              </CardBody>
              <div className="flex items-center justify-between bg-primary px-5 py-4 text-on-primary">
                <span className="text-label-large">{t('resources.continueReading')}</span>
                <ArrowInline />
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section aria-label={t('home.statsResources')} className="border-b border-outline-variant/50 bg-surface">
        <div className="mx-auto grid max-w-[var(--it-sum-content-max-width)] grid-cols-2 divide-x divide-outline-variant/60 rtl:divide-x-reverse md:grid-cols-4 px-4 py-8 sm:px-6 lg:px-8">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2 px-3 text-center">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <p data-numeric="true" className="text-headline-small text-on-surface">{value}</p>
              <p className="text-body-small text-on-surface-variant">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-headline-large text-on-surface">{t('home.featuresTitle')}</h2>
          <p className="mt-3 text-body-large text-on-surface-variant">{t('home.featuresSubtitle')}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, body, icon: Icon }) => (
            <Card key={title} variant="outlined" className="h-full">
              <CardHeader>
                <div className="mb-2 grid size-11 place-items-center rounded-xl bg-primary-container text-on-primary-container"><Icon className="size-5" aria-hidden="true" /></div>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardBody><p className="text-body-medium text-on-surface-variant">{body}</p></CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-surface-container-low">
        <div className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-label-large text-primary">{t('home.howTitle')}</p>
              <h2 className="mt-2 text-headline-large text-on-surface">{t('home.ctaTitle')}</h2>
              <p className="mt-3 text-body-large text-on-surface-variant">{t('home.ctaBody')}</p>
              <Link href="/register" className="mt-6 inline-flex"><Button variant="reward" endIcon={<ArrowInline />}>{t('home.heroPrimaryCta')}</Button></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [1, t('home.howStep1Title'), t('home.howStep1Body')],
                [2, t('home.howStep2Title'), t('home.howStep2Body')],
                [3, t('home.howStep3Title'), t('home.howStep3Body')],
              ].map(([number, title, body]) => (
                <Card key={number} variant="filled" className="h-full">
                  <CardBody className="p-5">
                    <div data-numeric="true" className="grid size-9 place-items-center rounded-full bg-primary text-label-large text-on-primary">{number}</div>
                    <h3 className="mt-5 text-title-medium text-on-surface">{title}</h3>
                    <p className="mt-2 text-body-medium text-on-surface-variant">{body}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-[2rem] bg-primary px-6 py-10 text-on-primary sm:px-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-headline-medium">{t('home.contributorsTitle')}</h2>
            <p className="mt-2 max-w-2xl text-body-large text-on-primary/85">{t('home.contributorsBody')}</p>
          </div>
          <div className="flex -space-x-3 rtl:space-x-reverse" aria-hidden="true">
            {['A', 'M', 'S', '+'].map((letter, index) => <div key={letter} className={`grid size-12 place-items-center rounded-full border-2 border-primary text-title-small ${index === 3 ? 'bg-reward text-on-reward' : 'bg-primary-container text-on-primary-container'}`}>{letter}</div>)}
          </div>
        </div>
      </section>
    </>
  );
}
