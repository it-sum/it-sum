import { getPageTranslations } from '@/i18n/server';
import { PageHeader } from '@/components/page-header';
import { ResourcesBrowser } from '@/components/resources-browser';
import { mockLibraryFacets, mockResourceSummaries } from '@it-sum/shared/mocks';

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);

  return (
    <>
      <PageHeader title={t('resources.title')} description={t('resources.subtitle')} />
      <ResourcesBrowser resources={mockResourceSummaries} facets={mockLibraryFacets} />
    </>
  );
}
