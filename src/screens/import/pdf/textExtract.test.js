import { describe, it, expect } from "vitest";
import { buildTablePdf, buildEmptyTextPdf } from "./__fixtures__/buildTestPdf";
import { extractPositionedText, PdfPasswordError } from "./textExtract";

describe("extractPositionedText", () => {
  it("extrait le texte avec ses coordonnées x/y", async () => {
    const bytes = await buildTablePdf([
      [{ text: "01/03/2026", x: 50 }, { text: "BOULANGERIE PICHON", x: 110 }, { text: "8,70", x: 480 }],
    ]);
    const { pages, hasText } = await extractPositionedText(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

    expect(hasText).toBe(true);
    expect(pages).toHaveLength(1);
    const texts = pages[0].items.map(i => i.text);
    expect(texts).toContain("01/03/2026");
    expect(texts).toContain("BOULANGERIE PICHON");
    expect(texts).toContain("8,70");

    // Les items doivent porter des coordonnées croissantes de gauche à droite.
    const dateItem = pages[0].items.find(i => i.text === "01/03/2026");
    const amtItem  = pages[0].items.find(i => i.text === "8,70");
    expect(dateItem.x).toBeLessThan(amtItem.x);
  });

  it("détecte l'absence de texte extractible (PDF scanné/image)", async () => {
    const bytes = await buildEmptyTextPdf();
    const { hasText, pages } = await extractPositionedText(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    expect(hasText).toBe(false);
    expect(pages[0].items).toHaveLength(0);
  });

  it("expose une erreur dédiée pour un PDF invalide/corrompu", async () => {
    const garbage = new TextEncoder().encode("ceci n'est pas un PDF").buffer;
    await expect(extractPositionedText(garbage)).rejects.toThrow();
  });

  it("PdfPasswordError est bien une Error nommée", () => {
    const err = new PdfPasswordError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("PdfPasswordError");
  });
});
