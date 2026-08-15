'use client';

import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, FileText, Filter, PlayCircle, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { LibraryFacets, ResourceSummary } from '@it-sum/shared';
import { Badge, Button, Card, CardBody, EmptyState, ProgressRing, TextField } from '@it-sum/ui';
import { Link } from '@/i18n/routing';

export function ResourcesBrowser({ resources, facets }: { resources: ResourceSummary[]; facets: LibraryFacets }) {
  const t = useTranslations();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<string>('all');
  const [phase, setPhase] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return resources.filter((resource) => {
      const matchesQuery = normalized === '' || resource.displayTitle.toLocaleLowerCase().includes(normalized);
      const matchesKind = kind === 'all' || resource.materialKind === kind;
      const matchesPhase = phase === 'all' || resource.examPhase === phase;
      return matchesQuery && matchesKind && matchesPhase;
    });
  }, [kind, phase, query, resources]);

  const activeFilterCount = Number(kind !== 'all') + Number(phase !== 'all');

  function clearFilters() {
    setQuery('');
    setKind('all');
    setPhase('all');
  }

  return (
    <div className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1"><TextField label={t('resources.searchLabel')} placeholder={t('resources.searchPlaceholder')} value={query} onChange={(event) => setQuery(event.target.value)} startIcon={<Search />} /></div>
        <Button variant="outlined" startIcon={<Filter />} onClick={() => setShowFilters((open) => !open)} aria-expanded={showFilters}>{t('resources.filters')}{activeFilterCount > 0 && <Badge tone="primary" numeric className="ms-1">{activeFilterCount}</Badge>}</Button>
      </div>

      {showFilters && (
        <div className="mt-4 grid gap-4 rounded-xl border border-outline-variant/60 bg-surface-container p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <label className="flex flex-col gap-1.5"><span className="text-label-large text-on-surface">{t('resources.materialKind')}</span><select value={kind} onChange={(event) => setKind(event.target.value)} className="rounded-sm border border-outline bg-surface-lowest px-3 py-2.5 text-body-medium text-on-surface"><option value="all">{t('common.all')}</option>{facets.materialKinds.map((facet) => <option key={facet.value} value={facet.value}>{facet.label} ({facet.count})</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className="text-label-large text-on-surface">{t('resources.examPhase')}</span><select value={phase} onChange={(event) => setPhase(event.target.value)} className="rounded-sm border border-outline bg-surface-lowest px-3 py-2.5 text-body-medium text-on-surface"><option value="all">{t('common.all')}</option>{facets.examPhases.map((facet) => <option key={facet.value} value={facet.value}>{facet.label} ({facet.count})</option>)}</select></label>
          <Button variant="text" startIcon={<X />} onClick={clearFilters}>{t('resources.clearFilters')}</Button>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3"><p className="text-body-medium text-on-surface-variant">{t('resources.resultsCount', { count: filtered.length })}</p><span className="text-body-small text-on-surface-variant">{t('resources.sortNewest')}</span></div>

      {filtered.length === 0 ? <div className="mt-6"><EmptyState icon={<Search />} title={t('resources.emptyTitle')} reason={t('resources.emptyReason')} action={<Button variant="outlined" onClick={clearFilters}>{t('resources.clearFilters')}</Button>} /></div> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((resource) => {
          const Icon = resource.type === 'video' ? PlayCircle : FileText;
          const progress = resource.progress?.percent ?? 0;
          return <Card key={resource.id} variant="outlined" interactive className="flex h-full flex-col overflow-hidden">
            <div className={`flex h-32 items-center justify-center ${resource.type === 'video' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}><Icon className="size-12" aria-hidden="true" /></div>
            <CardBody className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-2"><Badge tone={resource.type === 'video' ? 'info' : 'primary'}>{resource.type === 'video' ? t('resources.watchVideo') : 'PDF'}</Badge>{resource.progress?.completedAt != null && <CheckCircle2 className="size-5 text-tertiary" aria-label={t('resources.completed')} />}</div>
              <h2 className="mt-3 line-clamp-2 text-title-medium text-on-surface">{resource.displayTitle}</h2>
              <div className="mt-3 flex flex-wrap gap-1.5"><Badge tone="neutral">{t(`materialKind.${resource.materialKind}`)}</Badge>{resource.examPhase !== 'unphased' && <Badge tone="neutral">{t(`examPhase.${resource.examPhase}`)}</Badge>}</div>
              <div className="mt-auto pt-5">{resource.progress != null && <div className="mb-3 flex items-center gap-2"><ProgressRing value={progress} size={32} strokeWidth={3} label={`${Math.round(progress)}%`} showLabel /><span data-numeric="true" className="text-body-small text-on-surface-variant">{Math.round(progress)}%</span></div>}{resource.textQuality === 'none' && <p className="mb-3 text-body-small text-on-surface-variant">{t('resources.notSearchable')}</p>}<Link href={`/app/resource/${resource.id}` as never} className="block"><Button fullWidth variant={progress > 0 ? 'tonal' : 'filled'} startIcon={resource.type === 'video' ? <PlayCircle /> : <BookOpen />}>{progress > 0 ? t('resources.continueReading') : resource.type === 'video' ? t('resources.watchVideo') : t('resources.startReading')}</Button></Link></div>
            </CardBody>
          </Card>;
        })}
      </div>}
    </div>
  );
}
