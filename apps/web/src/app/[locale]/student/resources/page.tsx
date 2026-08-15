import { BookOpen, Search } from 'lucide-react';
import { Badge, Card } from '@it-sum/ui';
import { DemoRoleGate } from '@/components/demo-role-gate';
import { ResourcesBrowser } from '@/components/resources-browser';
import { mockLibraryFacets, mockResourceSummaries } from '@it-sum/shared/mocks';

export default async function StudentResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ar = locale === 'ar';
  return <DemoRoleGate requiredRole="student"><main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8" dir={ar ? 'rtl' : 'ltr'}><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><Badge tone="primary"><BookOpen className="me-2 size-4" />{ar ? 'مساحة الطالب' : 'Student library'}</Badge><h1 className="mt-3 text-headline-large text-on-background">{ar ? 'مكتبة الموارد' : 'Resource library'}</h1><p className="mt-2 text-body-large text-on-surface-variant">{ar ? 'ابحث في الملخصات والمحاضرات والفيديوهات حسب المستوى والمادة والفصل.' : 'Search summaries, lectures and videos by level, course and semester.'}</p></div><Card variant="filled" className="flex items-center gap-3 px-4 py-3"><Search className="size-5 text-primary" /><span className="text-body-small text-on-surface-variant">{ar ? '223+ مورداً منظماً' : '223+ organized resources'}</span></Card></div><ResourcesBrowser resources={mockResourceSummaries} facets={mockLibraryFacets} /></main></DemoRoleGate>;
}
