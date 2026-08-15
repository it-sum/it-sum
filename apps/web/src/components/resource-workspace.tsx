'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Bookmark, Clock3, FileText, LockKeyhole } from 'lucide-react';
import type { Resource } from '@it-sum/shared';
import { Badge, Button, Card } from '@it-sum/ui';
import { isLiveApi, issueStreamTicket, streamUrl } from '../lib/api/client';
import { useProgressStore } from '../lib/stores/progress-store';
import { PdfViewer } from './pdf-viewer';
import { YouTubePlayer } from './youtube-player';

interface ResourceWorkspaceProps {
  resource: Resource;
  locale: 'ar' | 'en';
}

export function ResourceWorkspace({ resource, locale }: ResourceWorkspaceProps) {
  const [stream, setStream] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const localProgress = useProgressStore((state) => state.resources[resource.id]);
  const label = locale === 'ar' ? resource.displayTitle : resource.displayTitle;

  useEffect(() => {
    if (!isLiveApi() || resource.type !== 'pdf') return;
    let cancelled = false;
    issueStreamTicket(resource.id).then((ticket) => {
      if (!cancelled) setStream(streamUrl(ticket));
    }).catch((reason: unknown) => {
      if (!cancelled) setStreamError(reason instanceof Error ? reason.message : 'Unable to open the PDF');
    });
    return () => { cancelled = true; };
  }, [resource.id, resource.type]);

  const percent = localProgress?.percent ?? resource.progress?.percent ?? 0;
  return <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <Button variant="text" size="sm" onClick={() => window.history.back()}><ArrowLeft className="size-4" />{locale === 'ar' ? 'العودة للمكتبة' : 'Back to library'}</Button>
        <div className="mt-3 flex flex-wrap items-center gap-2"><Badge>{resource.materialKind}</Badge><Badge tone="warning">{resource.examPhase}</Badge>{resource.isBookmarked && <Bookmark className="size-4 fill-primary text-primary" aria-label="Bookmarked" />}</div>
        <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-tight text-on-background sm:text-3xl">{label}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-on-surface-variant"><Clock3 className="size-4" />{locale === 'ar' ? `تقدمك ${Math.round(percent)}%` : `${Math.round(percent)}% complete`}</p>
      </div>
      <Card variant="outlined" className="min-w-48 p-4"><div className="text-xs text-on-surface-variant">{locale === 'ar' ? 'حالة التقدم' : 'Progress'}</div><div className="mt-1 text-2xl font-bold text-primary">{Math.round(percent)}%</div></Card>
    </div>

    {resource.type === 'video' && resource.youtubeId ? <YouTubePlayer resourceId={resource.id} videoId={resource.youtubeId} title={resource.displayTitle} /> : <PdfViewer resourceId={resource.id} url={stream} title={resource.displayTitle} pageCount={resource.pageCount} textQuality={resource.textQuality === 'good' ? 'native' : resource.textQuality === 'poor' ? 'ocr' : resource.textQuality === 'none' ? 'none' : 'unknown'} />}
    {streamError && <Card className="mt-4 flex items-start gap-3 border-error/40 bg-error-container p-4 text-sm text-on-error-container"><LockKeyhole className="mt-0.5 size-4 shrink-0" /><span>{locale === 'ar' ? 'يلزم تسجيل الدخول وتهيئة صلاحيات Google Drive لفتح الملف.' : `Sign in and configure Google Drive access to open this file. ${streamError}`}</span></Card>}
    {resource.type === 'pdf' && !stream && !streamError && !isLiveApi() && <Card className="mt-4 flex items-start gap-3 bg-secondary-container p-4 text-sm text-on-secondary-container"><FileText className="mt-0.5 size-4 shrink-0" /><span>{locale === 'ar' ? 'هذه نسخة الواجهة التجريبية. عند تفعيل API الحي سيُفتح PDF داخل الموقع مع حفظ الصفحة تلقائياً.' : 'This is the UI preview. With the live API enabled, the PDF opens inside the site and the page is saved automatically.'}</span></Card>}
  </main>;
}
