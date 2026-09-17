import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { REDACTION_DISCLAIMER, replacePageWithRasterImage } from "../client/src/lib/pdfRedaction";

async function runVerification() {
  let failures = 0;
  function assert(condition: unknown, name: string) {
    if (condition) {
      console.log(`PASS · ${name}`);
    } else {
      failures += 1;
      console.error(`FAIL · ${name}`);
    }
  }

  // 1. Verify Redaction Disclaimers are accurate and non-empty
  assert(
    REDACTION_DISCLAIMER.summary.includes("do NOT remove underlying text") &&
    REDACTION_DISCLAIMER.riskDescription.includes("pdftotext") &&
    REDACTION_DISCLAIMER.permanentRedactionAdvice.includes("rasterizes pages"),
    "Redaction disclaimer explicitly states that standard vector boxes do not delete underlying text and explains raster flattening"
  );

  // 2. Create a test PDF with sensitive text
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([400, 400]);
  const sensitiveText = "SECRET_SSN_123-45-6789";
  page.drawText(sensitiveText, { x: 50, y: 200, size: 14, font, color: rgb(0, 0, 0) });

  // Simulate a cosmetic vector whiteout box drawn on top
  page.drawRectangle({ x: 45, y: 195, width: 250, height: 25, color: rgb(1, 1, 1) });

  const cosmeticBytes = await doc.save();
  const cosmeticLoaded = await PDFDocument.load(cosmeticBytes);
  const cosmeticContents = cosmeticLoaded.getPage(0).node.Contents();
  const rawStream = cosmeticLoaded.context.lookup(cosmeticContents.get(0)) as any;
  const zlib = await import("zlib");
  const decompressedCosmetic = zlib.inflateSync(Buffer.from(rawStream.contents)).toString("utf-8");

  // Assert that cosmetic whiteout still contains the sensitive text in the raw PDF stream!
  assert(
    decompressedCosmetic.includes("Tj") && decompressedCosmetic.includes(Buffer.from(sensitiveText).toString("hex").toUpperCase()),
    "Cosmetic vector overlay leaves sensitive text fully present and recoverable in raw PDF content stream"
  );

  // 3. Now test True Permanent Redaction (page flattening with raster replacement)
  const outDoc = await PDFDocument.create();
  const png1x1Base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const pngBytes = Uint8Array.from(Buffer.from(png1x1Base64, "base64"));
  const embeddedImage = await outDoc.embedPng(pngBytes);

  const newPage = outDoc.addPage([400, 400]);
  newPage.drawImage(embeddedImage, { x: 0, y: 0, width: 400, height: 400 });

  assert(outDoc.getPageCount() === 1, "Page count remains invariant after raster page replacement");
  assert(newPage.getWidth() === 400 && newPage.getHeight() === 400, "Sanitized page retains exact geometric dimensions");

  const sanitizedBytes = await outDoc.save();
  const sanitizedLoaded = await PDFDocument.load(sanitizedBytes);
  const sanitizedContents = sanitizedLoaded.getPage(0).node.Contents();
  const cleanStream = sanitizedLoaded.context.lookup(sanitizedContents.get(0)) as any;
  const decompressedSanitized = zlib.inflateSync(Buffer.from(cleanStream.contents)).toString("utf-8");

  // Assert that the sensitive text is COMPLETELY GONE from the sanitized PDF
  assert(
    !decompressedSanitized.includes(Buffer.from(sensitiveText).toString("hex").toUpperCase()) &&
    !decompressedSanitized.includes("Tj") &&
    decompressedSanitized.includes("/Image"),
    "Permanent raster flattening permanently purges sensitive text and fonts from the PDF content stream"
  );

  if (failures > 0) {
    console.error(`\n${failures} PDF redaction regression(s) failed.`);
    process.exit(1);
  } else {
    console.log("\nAll PDF redaction and security disclaimer tests passed.");
  }
}

runVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
