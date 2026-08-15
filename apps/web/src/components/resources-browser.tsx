'use client';

import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, FileText, Filter, PlayCircle, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { LibraryFacets, ResourceSummary } from '@it-sum/shared';
import { Badge, Button, Card, CardBody, EmptyState, ProgressRing, SelectField, TextField } from '@it-sum/ui';
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
    <div className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 py-12 sm:px-6 md:py-20 lg:px-8">
      <div className="glass-panel rounded-[15px] p-5 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-label-large text-primary">01 / LIBRARY INDEX</p>
            <h2 className="mt-2 text-headline-small text-on-surface">{t('resources.searchLabel')}</h2>
            <p className="mt-2 max-w-xl text-body-medium text-on-surface-variant">{t('resources.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3 text-body-small text-on-surface-variant">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-label-medium text-on-primary" data-numeric="true">{resources.length}</span>
            <span>{t('resources.resultsCount', { count: resources.length })}</span>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1"><TextField label={t('resources.searchLabel')} placeholder={t('resources.searchPlaceholder')} value={query} onChange={(event) => setQuery(event.target.value)} startIcon={<Search />} /></div>
          <Button variant="outlined" startIcon={<Filter />} onClick={() => setShowFilters((open) => !open)} aria-expanded={showFilters} aria-controls="resource-filters">
            {t('resources.filters')}{activeFilterCount > 0 && <Badge tone="primary" numeric className="ms-1">{activeFilterCount}</Badge>}
          </Button>
        </div>

        {showFilters && (
          <div id="resource-filters" className="glass-soft mt-4 grid gap-4 rounded-[15px] p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
            <SelectField label={t('resources.materialKind')} value={kind} onChange={(event) => setKind(event.target.value)} options={[{ value: 'all', label: t('common.all') }, ...facets.materialKinds.map((facet) => ({ value: facet.value, label: `${facet.label} (${facet.count})` }))]} />
            <SelectField label={t('resources.examPhase')} value={phase} onChange={(event) => setPhase(event.target.value)} options={[{ value: 'all', label: t('common.all') }, ...facets.examPhases.map((facet) => ({ value: facet.value, label: `${facet.label} (${facet.count})` }))]} />
            <Button variant="text" startIcon={<X />} onClick={clearFilters}>{t('resources.clearFilters')}</Button>
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3 border-b border-outline-variant/60 pb-4">
        <p className="text-body-medium text-on-surface-variant">{t('resources.resultsCount', { count: filtered.length })}</p>
        <span className="text-body-small text-on-surface-variant">{t('resources.sortNewest')}</span>
      </div>

      {filtered.length === 0 ? <div className="mt-6"><EmptyState icon={<Search />} title={t('resources.emptyTitle')} reason={t('resources.emptyReason')} action={<Button variant="outlined" onClick={clearFilters}>{t('resources.clearFilters')}</Button>} /></div> : <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((resource) => {
          const Icon = resource.type === 'video' ? PlayCircle : FileText;
          const progress = resource.progress?.percent ?? 0;
          return <Card key={resource.id} variant="outlined" interactive className="group flex h-full flex-col overflow-hidden">
            <div className={`relative flex h-40 items-end overflow-hidden p-4 ${resource.type === 'video' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}>
              <div className="pointer-events-none absolute -end-7 -top-8 size-32 rounded-full border-[18px] border-current opacity-10" />
              <Icon className="relative size-12 transition-transform duration-200 ease-standard group-hover:scale-105" aria-hidden="true" />
              <span className="glass-control ms-auto rounded-[15px] px-3 py-1 text-label-small text-on-surface">{resource.type === 'video' ? t('resources.watchVideo') : 'PDF'}</span>
            </div>
            <CardBody className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-2"><Badge tone={resource.type === 'video' ? 'info' : 'primary'}>{resource.type === 'video' ? t('resources.watchVideo') : 'PDF'}</Badge>{resource.progress?.completedAt != null && <CheckCircle2 className="size-5 text-tertiary" aria-label={t('resources.completed')} />}</div>
              <h2 className="mt-4 line-clamp-2 text-title-medium text-on-surface">{resource.displayTitle}</h2>
              <div className="mt-3 flex flex-wrap gap-1.5"><Badge tone="neutral">{t(`materialKind.${resource.materialKind}`)}</Badge>{resource.examPhase !== 'unphased' && <Badge tone="neutral">{t(`examPhase.${resource.examPhase}`)}</Badge>}</div>
              <div className="mt-auto pt-6">{resource.progress != null && <div className="mb-3 flex items-center gap-2"><ProgressRing value={progress} size={32} strokeWidth={3} label={`${Math.round(progress)}%`} showLabel /><span data-numeric="true" className="text-body-small text-on-surface-variant">{Math.round(progress)}%</span></div>}{resource.textQuality === 'none' && <p className="mb-3 text-body-small text-on-surface-variant">{t('resources.notSearchable')}</p>}<Link href={`/app/resource/${resource.id}` as never} className="block"><Button fullWidth variant={progress > 0 ? 'tonal' : 'filled'} startIcon={resource.type === 'video' ? <PlayCircle /> : <BookOpen />}>{progress > 0 ? t('resources.continueReading') : resource.type === 'video' ? t('resources.watchVideo') : t('resources.startReading')}</Button></Link></div>
            </CardBody>
          </Card>;
        })}
      </div>}
    </div>
  );
}
