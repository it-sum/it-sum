import { ArrowInline, CheckCircle2, Clock3, Map, Route } from '@/components/icons';
import { getPageTranslations } from '@/i18n/server';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, ProgressBar } from '@it-sum/ui';
import { PageHeader } from '@/components/page-header';
import { Link } from '@/i18n/routing';
import { mockRoadmaps } from '@it-sum/shared/mocks';

export default async function RoadmapsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);

  return (
    <>
      <PageHeader title={t('nav.roadmaps')} description="مسارات تعلم مرتبطة بمواد IT-SUM ومراجع roadmap.sh المفتوحة." />
      <div className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mb-8 flex items-center gap-3 rounded-xl bg-secondary-container px-4 py-4 text-on-secondary-container"><Map className="size-5 shrink-0" aria-hidden="true" /><p className="text-body-medium">اختر مساراً، ثم تقدم خطوة خطوة مع حفظ إنجازك داخل حسابك.</p></div>
        <div className="grid gap-5 lg:grid-cols-2">
          {mockRoadmaps.map((roadmap) => (
            <Card key={roadmap.id} variant="outlined" interactive className="overflow-hidden">
              <div className="flex h-36 items-center justify-center bg-primary-container text-on-primary-container"><Route className="size-14" aria-hidden="true" /></div>
              <CardHeader>
                <div className="flex items-start justify-between gap-3"><CardTitle>{roadmap.title.ar}</CardTitle><Badge tone="primary" numeric>{Math.round(roadmap.progressPercent)}%</Badge></div>
                <p className="text-body-medium text-on-surface-variant">{roadmap.description.ar}</p>
              </CardHeader>
              <CardBody>
                <ProgressBar value={roadmap.progressPercent} label={`${Math.round(roadmap.progressPercent)}%`} tone="reward" />
                <div className="mt-4 flex flex-wrap gap-4 text-body-small text-on-surface-variant"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-tertiary" aria-hidden="true" />{roadmap.completedNodeCount} / {roadmap.nodeCount}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" aria-hidden="true" />{roadmap.estimatedHours} ساعة</span></div>
                <div className="mt-5 flex flex-wrap gap-2"><Link href={`/app/roadmaps/${roadmap.slug}` as never}><Button endIcon={<ArrowInline />}>ابدأ المسار</Button></Link>{roadmap.externalReferenceUrl != null && <a href={roadmap.externalReferenceUrl} target="_blank" rel="noreferrer"><Button variant="text">roadmap.sh</Button></a>}</div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
