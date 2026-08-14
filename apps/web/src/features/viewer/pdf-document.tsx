import { useEffect, useRef, useState } from 'react';
import { loadPdf, type PDFDocumentProxy } from '../../lib/pdf';
import { Spinner } from '../../components/ui/spinner';

interface PdfDocumentProps {
  url: string;
  onPageVisible: (page: number) => void;
}

const PdfPage = ({
  pdf,
  pageNumber,
  onVisible,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  onVisible: (page: number) => void;
}) => {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const element = holder.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRendered(true);
          }
          if (entry.intersectionRatio > 0.55) {
            onVisible(pageNumber);
          }
        }
      },
      { threshold: [0, 0.55], rootMargin: '400px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [onVisible, pageNumber]);

  useEffect(() => {
    if (!rendered || !canvas.current) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled || !canvas.current) {
        return;
      }

      const scale = Math.min(2, window.devicePixelRatio || 1);
      const viewport = page.getViewport({ scale: 1.4 * scale });
      const context = canvas.current.getContext('2d');
      if (!context) {
        return;
      }

      canvas.current.width = viewport.width;
      canvas.current.height = viewport.height;
      canvas.current.style.aspectRatio = `${viewport.width} / ${viewport.height}`;

      await page.render({ canvas: canvas.current, canvasContext: context, viewport }).promise;
    })();

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, rendered]);

  return (
    <div ref={holder} className="relative" data-page={pageNumber}>
      <canvas
        ref={canvas}
        className="w-full rounded-lg border border-rule bg-paper-raised shadow-sm"
        style={{ aspectRatio: '1 / 1.294' }}
      />
      <span className="numeric absolute -left-9 top-2 hidden text-[0.75rem] text-ink-faint lg:block">
        {pageNumber}
      </span>
    </div>
  );
};

export const PdfDocument = ({ url, onPageVisible }: PdfDocumentProps) => {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void loadPdf(url)
      .then((document) => {
        if (!cancelled) {
          setPdf(document);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) {
    return (
      <p className="py-20 text-center text-sm text-ink-faint">
        This document could not be displayed in the browser.
      </p>
    );
  }

  if (!pdf) {
    return (
      <div className="flex justify-center py-20 text-ink-faint">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {Array.from({ length: pdf.numPages }, (_, index) => index + 1).map(
        (pageNumber) => (
          <PdfPage
            key={pageNumber}
            pdf={pdf}
            pageNumber={pageNumber}
            onVisible={onPageVisible}
          />
        ),
      )}
    </div>
  );
};
