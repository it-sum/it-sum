'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileWarning, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button, Card, ProgressBar } from '@it-sum/ui';
import { isLiveApi, syncProgress } from '../lib/api/client';
import { useProgressStore } from '../lib/stores/progress-store';

interface PdfViewerProps {
  resourceId: string;
  url: string | null;
  title: string;
  pageCount?: number | null;
  textQuality?: 'native' | 'ocr' | 'none' | 'unknown';
}

export function PdfViewer({ resourceId, url, title, pageCount, textQuality = 'unknown' }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pages, setPages] = useState(pageCount ?? 0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.15);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState<string | null>(null);
  const savedPage = useProgressStore((state) => state.resources[resourceId]?.lastPage ?? 1);
  const updateProgress = useProgressStore((state) => state.update);

  useEffect(() => {
    setPage(Math.max(1, savedPage));
  }, [resourceId, savedPage]);

  useEffect(() => {
    if (!url || !canvasRef.current) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    setLoading(true);
    setError(null);

    void import('pdfjs-dist').then(async (pdfjs) => {
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const loadingTask = pdfjs.getDocument(url);
      const document = await loadingTask.promise;
      if (cancelled) return;
      setPages(document.numPages);
      const renderPage = async (pageNumber: number) => {
        const pdfPage = await document.getPage(Math.min(Math.max(pageNumber, 1), document.numPages));
        if (cancelled || !canvasRef.current) return;
        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await pdfPage.render({ canvas, canvasContext: context, viewport }).promise;
        if (!cancelled) {
          const percent = document.numPages ? Math.round((pageNumber / document.numPages) * 100) : 0;
          const completed = pageNumber >= document.numPages;
          updateProgress(resourceId, { percent, lastPage: pageNumber, completed });
          if (isLiveApi()) void syncProgress({ resourceId, percent, lastPage: pageNumber });
          setLoading(false);
        }
      };
      await renderPage(page);
      cleanup = () => { void loadingTask.destroy(); };
    }).catch((reason: unknown) => {
      if (!cancelled) {
        setError(reason instanceof Error ? reason.message : 'Unable to render this PDF');
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [url, page, scale, resourceId, updateProgress]);

  const goTo = (nextPage: number) => setPage(Math.min(Math.max(nextPage, 1), pages || Number.MAX_SAFE_INTEGER));

  if (!url) {
    return <EmptyPdfState title={title} textQuality={textQuality} />;
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
          <span>{title}</span>
          {pages > 0 && <span className="text-on-surface-variant">{page} / {pages}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="tonal" aria-label="Zoom out" onClick={() => setScale((value) => Math.max(0.7, value - 0.1))}><Minus className="size-4" /></Button>
          <span className="min-w-12 text-center text-xs text-on-surface-variant">{Math.round(scale * 100)}%</span>
          <Button size="sm" variant="tonal" aria-label="Zoom in" onClick={() => setScale((value) => Math.min(2.5, value + 0.1))}><Plus className="size-4" /></Button>
          <Button size="sm" variant="tonal" aria-label="Reset zoom" onClick={() => setScale(1.15)}><RotateCcw className="size-4" /></Button>
        </div>
      </div>
      <div className="flex min-h-[520px] items-center justify-center overflow-auto bg-surface-container px-4 py-6">
        {loading && <div className="absolute text-sm text-on-surface-variant">Loading PDF…</div>}
        {error ? <div className="max-w-md text-center text-sm text-error">{error}</div> : <canvas ref={canvasRef} className="max-w-full rounded-md bg-white shadow-md" aria-label={title} />}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-4 py-3">
        <div className="min-w-40 flex-1"><ProgressBar value={pages ? (page / pages) * 100 : 0} label={`Page ${page} of ${pages || 0}`} /></div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="tonal" disabled={page <= 1} onClick={() => goTo(page - 1)}><ChevronLeft className="size-4" />Previous</Button>
          <Button size="sm" variant="tonal" disabled={!pages || page >= pages} onClick={() => goTo(page + 1)}>Next<ChevronRight className="size-4" /></Button>
        </div>
      </div>
      {textQuality === 'none' && <ScanNotice />}
    </Card>
  );
}

function EmptyPdfState({ title, textQuality }: Pick<PdfViewerProps, 'title' | 'textQuality'>) {
  return <Card variant="outlined" className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center"><FileWarning className="size-8 text-tertiary" /><h2 className="text-lg font-semibold text-on-surface">{title}</h2><p className="max-w-md text-sm text-on-surface-variant">This PDF is not available through the stream yet.</p>{textQuality === 'none' && <ScanNotice />}</Card>;
}

function ScanNotice() {
  return <div className="flex items-start gap-2 border-t border-outline-variant bg-tertiary-container px-4 py-3 text-sm text-on-tertiary-container"><FileWarning className="mt-0.5 size-4 shrink-0" /><span>This is a scanned document. Search and AI features may be limited until OCR is approved.</span></div>;
}
