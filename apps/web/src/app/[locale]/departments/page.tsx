import { ArrowUpRight, BookOpen, ChevronDown, FolderTree, Layers3, Sparkles } from 'lucide-react';
import { getPageTranslations } from '@/i18n/server';
import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState } from '@it-sum/ui';
import { Link } from '@/i18n/routing';
import { MarketingHero } from '@/components/marketing-hero';
import { mockDepartments, mockDepartmentTree } from '@it-sum/shared/mocks';

export default async function DepartmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);
  const language = locale === 'ar' ? 'ar' : 'en';
  const courseTotal = mockDepartmentTree.batches.reduce(
    (total, batch) => total + batch.semesters.reduce((semesterTotal, semester) => semesterTotal + semester.courses.length, 0),
    0,
  );
  const availableLevels = mockDepartmentTree.batches.filter((batch) => (batch.resourceCount ?? 0) > 0).length;

  return (
    <>
      <MarketingHero
        index="01"
        eyebrow={t('nav.departments')}
        title={t('departments.title')}
        description={t('departments.subtitle')}
        signal={t('departments.comingSoonReason')}
      />

      <div className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card variant="filled" className="bg-surface-container-low">
            <CardBody className="p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-label-large text-on-surface-variant">{t('nav.departments')}</p>
                <FolderTree className="size-5 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-6 text-display-small text-on-surface" data-numeric="true">{mockDepartments.length}</p>
              <p className="mt-1 text-body-small text-on-surface-variant">{t('departments.coursesCount', { count: courseTotal })}</p>
            </CardBody>
          </Card>
          <Card variant="filled" className="bg-surface-container-low">
            <CardBody className="p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-label-large text-on-surface-variant">{t('departments.levelLabel', { level: '01—04' })}</p>
                <Layers3 className="size-5 text-tertiary" aria-hidden="true" />
              </div>
              <p className="mt-6 text-display-small text-on-surface" data-numeric="true">{availableLevels}</p>
              <p className="mt-1 text-body-small text-on-surface-variant">{t('departments.comingSoonLevel')}</p>
            </CardBody>
          </Card>
          <Card variant="filled" className="bg-surface-container-low">
            <CardBody className="p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-label-large text-on-surface-variant">{t('resources.title')}</p>
                <Sparkles className="size-5 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-6 text-display-small text-on-surface" data-numeric="true">{mockDepartmentTree.resourceCount ?? 0}</p>
              <p className="mt-1 text-body-small text-on-surface-variant">{t('departments.resourcesCount', { count: mockDepartmentTree.resourceCount ?? 0 })}</p>
            </CardBody>
          </Card>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <aside>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-label-large text-primary">01 / INDEX</p>
                <h2 className="mt-2 text-headline-small text-on-surface">{t('nav.departments')}</h2>
              </div>
              <span className="text-body-small text-on-surface-variant" data-numeric="true">{String(mockDepartments.length).padStart(2, '0')}</span>
            </div>
            <div className="mt-5 space-y-3">
              {mockDepartments.map((department, index) => (
                <Card
                  key={department.id}
                  variant={index === 0 ? 'elevated' : 'outlined'}
                  interactive
                  className={`group ${index === 0 ? 'border-2 border-primary/30' : ''}`}
                >
                  <CardBody className="flex items-center gap-3 p-4">
                    <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${index === 0 ? 'bg-primary text-on-primary' : 'bg-primary-container text-on-primary-container'}`}>
                      <FolderTree className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-title-small text-on-surface">{department.name[language]}</h3>
                      <p className="mt-1 text-body-small text-on-surface-variant">{t('departments.coursesCount', { count: department.courseCount ?? 0 })}</p>
                    </div>
                    {index === 0 ? <Badge tone="primary">{t('common.all')}</Badge> : <ArrowUpRight className="size-4 text-on-surface-variant transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />}
                  </CardBody>
                </Card>
              ))}
            </div>
          </aside>

          <section aria-labelledby="it-department-title">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant/60 pb-5">
              <div>
                <p className="text-label-large text-primary">02 / CURRICULUM</p>
                <h2 id="it-department-title" className="mt-2 text-headline-medium text-on-surface">{mockDepartmentTree.name[language]}</h2>
                <p className="mt-2 max-w-2xl text-body-medium text-on-surface-variant">{mockDepartmentTree.description[language]}</p>
              </div>
              <Badge tone="primary" numeric>{mockDepartmentTree.resourceCount}</Badge>
            </div>

            <div className="mt-6 space-y-4">
              {mockDepartmentTree.batches.map((batch) => (
                <Card key={batch.id} variant="outlined" className="overflow-hidden transition-colors hover:border-primary/60">
                  <CardHeader className="flex-row items-center justify-between gap-3 bg-surface-container-low">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-2xl bg-secondary-container text-on-secondary-container text-label-large" data-numeric="true">{batch.level}</div>
                      <div>
                        <CardTitle>{batch.name[language]}</CardTitle>
                        <p className="mt-1 text-body-small text-on-surface-variant">{t('departments.coursesCount', { count: batch.semesters.reduce((sum, semester) => sum + semester.courses.length, 0) })}</p>
                      </div>
                    </div>
                    {batch.resourceCount === 0 ? <Badge tone="neutral">{t('departments.comingSoonLevel')}</Badge> : <ChevronDown className="size-5 text-on-surface-variant" aria-hidden="true" />}
                  </CardHeader>
                  <CardBody className="space-y-3 p-4">
                    {batch.resourceCount === 0 ? (
                      <p className="rounded-2xl bg-surface-container px-4 py-4 text-body-medium text-on-surface-variant">{t('departments.comingSoonReason')}</p>
                    ) : (
                      batch.semesters.map((semester) => (
                        <div key={semester.id} className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="text-title-small text-on-surface">{semester.name[language]}</h3>
                              <p className="mt-1 text-body-small text-on-surface-variant">{t('departments.resourcesCount', { count: semester.resourceCount ?? 0 })}</p>
                            </div>
                            <Badge tone="neutral" numeric>{semester.courseCount}</Badge>
                          </div>
                          {semester.courses.length > 0 && (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              {semester.courses.map((course) => (
                                <Link key={course.id} href={`/resources?course=${course.id}` as never} className="state-layer group flex items-center gap-3 rounded-2xl border border-outline-variant/60 bg-surface p-3 transition-colors hover:border-primary">
                                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary-container"><BookOpen className="size-4" aria-hidden="true" /></div>
                                  <div className="min-w-0 flex-1"><p className="truncate text-title-small text-on-surface">{course.name[language]}</p><p className="mt-0.5 text-body-small text-on-surface-variant">{course.code} · {course.resourceCount} {t('resources.pages')}</p></div>
                                  <ArrowUpRight className="size-4 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>

      {mockDepartments.length === 0 && <EmptyState title={t('departments.emptyTitle')} reason={t('departments.emptyReason')} />}
    </>
  );
}
