import { notFound } from 'next/navigation';
import { mockResources } from '@it-sum/shared/mocks';
import { ResourceWorkspace } from '@/components/resource-workspace';

export function generateStaticParams() {
  return ['ar', 'en'].flatMap((locale) => mockResources.map((resource) => ({ locale, id: resource.id })));
}

export default async function ResourcePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const resource = mockResources.find((item) => item.id === id);
  if (!resource) notFound();
  return <ResourceWorkspace resource={resource} locale={locale === 'en' ? 'en' : 'ar'} />;
}
