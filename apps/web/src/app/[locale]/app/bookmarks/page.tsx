import { ArrowRight, Bookmark, FileText, PlayCircle } from 'lucide-react';
import { Badge, Card, EmptyState, LinkButton } from '@it-sum/ui';
import { mockResourceSummaries } from '@it-sum/shared/mocks';
import { getPageTranslations } from '@/i18n/server';

export default async function BookmarksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);
  const bookmarks = mockResourceSummaries.filter((resource) => resource.isBookmarked);

  return (
    <div>
      <div className="mb-8">
        <Badge tone="primary">{t('bookmarks.eyebrow')}</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-on-background">{t('bookmarks.title')}</h1>
        <p className="mt-2 max-w-2xl text-on-surface-variant">{t('bookmarks.subtitle')}</p>
      </div>

      {bookmarks.length === 0 ? (
        <Card className="p-8"><EmptyState title={t('bookmarks.emptyTitle')} reason={t('bookmarks.emptyDescription')} action={<LinkButton href={`/${locale}/resources`} variant="filled">{t('bookmarks.browse')}</LinkButton>} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bookmarks.map((resource) => {
            const resourceTitle = resource.displayTitle;
            const isVideo = resource.type === 'video';
            return (
              <Card key={resource.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-[15px] bg-primary-container text-on-primary-container">
                      {isVideo ? <PlayCircle className="size-5" aria-hidden="true" /> : <FileText className="size-5" aria-hidden="true" />}
                    </div>
                    <div>
                      <Badge tone="info">{t(`materialKind.${resource.materialKind}`)}</Badge>
                      <h2 className="mt-2 font-semibold text-on-surface">{resourceTitle}</h2>
                    </div>
                  </div>
                  <Bookmark className="size-5 shrink-0 fill-primary text-primary" aria-label={t('bookmarks.saved')} />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                  <span>{t(`examPhase.${resource.examPhase}`)}</span>
                  {resource.progress && <span>{Math.round(resource.progress.percent)}% {t('bookmarks.complete')}</span>}
                </div>
                <div className="mt-auto pt-5">
                  <LinkButton href={`/${locale}/app/resource/${resource.id}`} variant="tonal" size="sm">{isVideo ? t('bookmarks.watch') : t('bookmarks.read')}<ArrowRight className="ms-2 size-4" /></LinkButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
