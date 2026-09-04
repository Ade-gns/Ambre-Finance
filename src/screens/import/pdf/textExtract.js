// Extraction de texte PDF positionné (x, y) via pdfjs-dist.
// Fonctionne à l'identique en mode navigateur et en mode Tauri : le parsing
// est 100 % JavaScript, exécuté dans le webview (Chromium/WebKit selon l'OS),
// sans appel réseau ni dépendance Rust — cohérent avec la promesse "aucun
// cloud, aucune connexion" de l'app.

// Build "legacy" plutôt que le build par défaut : compatible avec les webviews
// natifs plus anciens utilisés par Tauri selon l'OS (WebView2, WKWebView,
// WebKitGTK — pas nécessairement Chromium récent) ainsi qu'avec l'environnement
// Node des tests Vitest, sans changer le comportement en navigateur moderne.
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

// L'URL résolue par `?url` est un chemin servi par le navigateur/webview ; en
// environnement Node (tests Vitest), on laisse pdfjs-dist retomber sur son
// "fake worker" intégré (mono-thread) plutôt que de fixer ce chemin, qui n'a
// pas de sens hors navigateur.
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export class PdfPasswordError extends Error {
  constructor() { super("PDF protégé par un mot de passe"); this.name = "PdfPasswordError"; }
}

/**
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<{ pages: Array<{ width: number, height: number,
 *   items: Array<{ text: string, x: number, y: number, w: number, h: number }> }>,
 *   hasText: boolean }>}
 *   y est ré-exprimé origine haut-gauche (0 = haut de page) pour un tri de
 *   lecture naturel de haut en bas.
 */
export async function extractPositionedText(arrayBuffer) {
  let doc;
  try {
    doc = await pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false }).promise;
  } catch (err) {
    if (err?.name === "PasswordException") throw new PdfPasswordError();
    throw err;
  }

  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = [];
    for (const it of content.items) {
      const text = it.str;
      if (!text || !text.trim()) continue;
      const [a, b, c, d, e, f] = it.transform;
      const h = Math.hypot(c, d) || Math.hypot(a, b) || 1;
      items.push({ text, x: e, y: viewport.height - f, w: it.width || 0, h });
    }
    pages.push({ width: viewport.width, height: viewport.height, items });
  }

  const hasText = pages.some(p => p.items.length > 0);
  return { pages, hasText };
}
