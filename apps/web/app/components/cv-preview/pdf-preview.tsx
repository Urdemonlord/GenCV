'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CV } from '@/lib/cv/schema';
import type { TemplateId } from '@/lib/cv/templates';

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= import('pdfjs-dist/legacy/build/pdf.mjs')
    .then((pdfjs) => {
      // `new Worker(new URL(...))` makes webpack bundle the worker as its own entry (a plain
      // workerSrc URL ships the raw .mjs, which Next 14's minifier rejects), and a global
      // port means every render shares this one worker.
      pdfjs.GlobalWorkerOptions.workerPort = new Worker(
        new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url)
      );
      return pdfjs;
    })
    .catch((error) => {
      pdfjsPromise = null;
      throw error;
    });
  return pdfjsPromise;
}

const RENDER_DELAY_MS = 400;

/**
 * Renders the exact PDF that will be downloaded (react-pdf output drawn by pdf.js),
 * so page breaks and page count match the file. Works on mobile, unlike <iframe> PDFs.
 */
export function PdfPreview({ data, template }: { data: CV; template: TemplateId }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [rendering, setRendering] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    // Measure immediately: ResizeObserver callbacks can be deferred (e.g. in background tabs),
    // which would leave the preview stuck on "Rendering preview…".
    setWidth(Math.floor(element.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!width) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      setRendering(true);
      try {
        const [{ renderCvPdf }, pdfjs] = await Promise.all([import('@/lib/cv/pdf'), loadPdfJs()]);
        const blob = await renderCvPdf(data, template);
        if (cancelled) return;

        const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false })
          .promise;
        try {
          const ratio = window.devicePixelRatio || 1;
          const canvases: HTMLCanvasElement[] = [];
          for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
            const page = await doc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(viewport.width * ratio);
            canvas.height = Math.floor(viewport.height * ratio);
            canvas.style.width = `${Math.floor(viewport.width)}px`;
            canvas.style.height = `${Math.floor(viewport.height)}px`;
            canvas.className = 'block bg-white shadow-md ring-1 ring-black/5';
            canvas.setAttribute('aria-label', `CV page ${pageNumber} of ${doc.numPages}`);
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas is not supported in this browser');
            await page.render({
              canvasContext: context,
              viewport,
              transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
            }).promise;
            if (cancelled) return;
            canvases.push(canvas);
          }
          // Swap all pages at once so the preview never flashes empty while typing.
          pagesRef.current?.replaceChildren(...canvases);
          setPageCount(doc.numPages);
          setError('');
        } finally {
          await doc.destroy();
        }
      } catch (err) {
        if (cancelled) return;
        console.error('PDF preview failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setRendering(false);
      }
    }, RENDER_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [data, template, width]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="relative rounded-md bg-surface-raised ">
        <div ref={pagesRef} className="flex flex-col gap-4" />
        {pageCount === 0 && !error && (
          <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Rendering preview…
          </div>
        )}
        {rendering && pageCount > 0 && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-surface/90 px-2 py-1 text-xs text-muted-foreground shadow">
            <Loader2 className="h-3 w-3 animate-spin" />
            Updating…
          </div>
        )}
      </div>
      {error ? (
        <p className="text-sm text-destructive">Preview failed: {error}</p>
      ) : (
        pageCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'} · A4 · exactly what you will download
          </p>
        )
      )}
    </div>
  );
}
