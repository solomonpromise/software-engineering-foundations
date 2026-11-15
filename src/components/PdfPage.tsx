import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
let docPromise: Promise<pdfjs.PDFDocumentProxy> | null = null;
const getDoc = (url: string) => (docPromise ??= pdfjs.getDocument({ url, rangeChunkSize: 262144 }).promise);

export default function PdfPage({ url, page, width }: { url: string; page: number; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let task: pdfjs.RenderTask | null = null;
    let cancelled = false;
    setLoading(true);
    getDoc(url).then(async (doc) => {
      const p = await doc.getPage(page);
      if (cancelled || !ref.current) return;
      const base = p.getViewport({ scale: 1 });
      const dpr = window.devicePixelRatio || 1;
      const vp = p.getViewport({ scale: (width / base.width) * dpr });
      const c = ref.current;
      c.width = vp.width; c.height = vp.height;
      c.style.width = `${width}px`; c.style.height = `${vp.height / dpr}px`;
      task = p.render({ canvas: c, viewport: vp });
      await task.promise.catch(() => {});
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; task?.cancel(); };
  }, [url, page, width]);
  return (
    <div className="relative">
      <canvas ref={ref} className="page-sheet block" style={{ width, aspectRatio: "595/842" }} />
      {loading && <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground animate-pulse">Turning the page…</div>}
    </div>
  );
}
