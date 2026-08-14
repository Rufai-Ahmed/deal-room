import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export const loadPdf = (source: string | ArrayBuffer) =>
  pdfjs.getDocument(
    typeof source === 'string' ? { url: source } : { data: source },
  ).promise;

export const readPageCount = async (file: File): Promise<number | undefined> => {
  if (file.type !== 'application/pdf') {
    return undefined;
  }

  try {
    const document = await loadPdf(await file.arrayBuffer());
    return document.numPages;
  } catch {
    return undefined;
  }
};

export type { PDFDocumentProxy } from 'pdfjs-dist';
