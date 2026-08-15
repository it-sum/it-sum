import { ArrowInline, BookOpen, ChevronDown, FolderTree } from '@/components/icons';
import { getPageTranslations } from '@/i18n/server';
import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState } from '@it-sum/ui';
import { Link } from '@/i18n/routing';
import { mockDepartments, mockDepartmentTree } from '@it-sum/shared/mocks';

export default async function DepartmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);

  return (
    <>
      <section className="border-b border-outline-variant/60 bg-surface-container-lowest px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-[var(--it-sum-content-max-width)]">
          <p className="text-label-large text-primary">IT-SUM</p>
          <h1 className="mt-2 text-display-small text-on-surface">{t('departments.title')}</h1>
          <p className="mt-3 max-w-2xl text-body-large text-on-surface-variant">{t('departments.subtitle')}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-[var(--it-sum-content-max-width)] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <aside>
          <h2 className="text-title-medium text-on-surface">{t('nav.departments')}</h2>
          <div className="mt-4 space-y-3">
            {mockDepartments.map((department, index) => (
              <Card key={department.id} variant={index === 0 ? 'elevated' : 'outlined'} interactive={index === 0} className={index === 0 ? 'border-2 border-primary/30' : ''}>
                <CardBody className="flex items-center gap-3 p-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary-container"><FolderTree className="size-5" aria-hidden="true" /></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-title-small text-on-surface">{department.name.ar}</h3>
                    <p className="mt-1 text-body-small text-on-surface-variant">{t('departments.coursesCount', { count: department.courseCount ?? 0 })}</p>
                  </div>
                  {index === 0 && <Badge tone="primary">{t('common.all')}</Badge>}
                </CardBody>
              </Card>
            ))}
          </div>
        </aside>

        <section aria-labelledby="it-department-title">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="it-department-title" className="text-headline-small text-on-surface">{mockDepartmentTree.name.ar}</h2>
              <p className="mt-1 text-body-medium text-on-surface-variant">{mockDepartmentTree.description.ar}</p>
            </div>
            <Badge tone="primary" numeric>{mockDepartmentTree.resourceCount}</Badge>
          </div>

          <div className="mt-6 space-y-4">
            {mockDepartmentTree.batches.map((batch) => (
              <Card key={batch.id} variant="outlined">
                <CardHeader className="flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-secondary-container text-on-secondary-container" data-numeric="true">{batch.level}</div><CardTitle>{batch.name.ar}</CardTitle></div>
                  {batch.resourceCount === 0 ? <Badge tone="neutral">{t('departments.comingSoonLevel')}</Badge> : <ChevronDown className="size-5 text-on-surface-variant" aria-hidden="true" />}
                </CardHeader>
                <CardBody className="space-y-3">
                  {batch.resourceCount === 0 ? (
                    <p className="rounded-md bg-surface-container px-4 py-3 text-body-medium text-on-surface-variant">{t('departments.comingSoonReason')}</p>
                  ) : (
                    batch.semesters.map((semester) => (
                      <div key={semester.id} className="rounded-xl bg-surface-container px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div><h3 className="text-title-small text-on-surface">{semester.name.ar}</h3><p className="mt-1 text-body-small text-on-surface-variant">{t('departments.resourcesCount', { count: semester.resourceCount ?? 0 })}</p></div>
                          <Badge tone="neutral" numeric>{semester.courseCount}</Badge>
                        </div>
                        {semester.courses.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {semester.courses.map((course) => (
                            <Link key={course.id} href={`/resources?course=${course.id}` as never} className="state-layer flex items-center gap-3 rounded-lg border border-outline-variant/60 bg-surface p-3 hover:border-primary">
                              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-container text-on-primary-container"><BookOpen className="size-4" aria-hidden="true" /></div>
                              <div className="min-w-0 flex-1"><p className="truncate text-title-small text-on-surface">{course.name.ar}</p><p className="mt-0.5 text-body-small text-on-surface-variant">{course.code} · {course.resourceCount} {t('resources.pages')}</p></div>
                              <ArrowInline className="size-4 shrink-0 text-primary" aria-hidden="true" />
                            </Link>
                          ))}
                        </div>}
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {mockDepartments.length === 0 && <EmptyState title={t('departments.emptyTitle')} reason={t('departments.emptyReason')} />}
    </>
  );
}
