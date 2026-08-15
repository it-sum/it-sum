import { getPageTranslations } from '@/i18n/server';
import { ResourcesBrowser } from '@/components/resources-browser';
import { MarketingHero } from '@/components/marketing-hero';
import { mockLibraryFacets, mockResourceSummaries } from '@it-sum/shared/mocks';

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);
  return (
    <>
      <MarketingHero
        index="02"
        eyebrow={t('nav.resources')}
        title={t('resources.title')}
        description={t('resources.subtitle')}
        signal={t('resources.loginToReadHint')}
      />
      <ResourcesBrowser resources={mockResourceSummaries} facets={mockLibraryFacets} />
    </>
  );
}
