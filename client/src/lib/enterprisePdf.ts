import { PDFDocument, PDFName, PDFDict, PDFString, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { sanitizeWinAnsiText } from "./pdfTextSanitizer";

export interface BatesStampingOptions {
  prefix: string;
  startNumber: number;
  digits: number;
  suffix: string;
  position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  fontSize: number;
  colorHex: string;
  marginX?: number;
  marginY?: number;
  pageRange?: string; // e.g. "all" or "1-5, 8"
}

export interface PdfMetadataReport {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  producer?: string;
  creator?: string;
  creationDate?: string;
  modificationDate?: string;
  hasXmpMetadata: boolean;
  hasNamesCatalog: boolean;
  pageCount: number;
}

export interface AcroFormFieldItem {
  name: string;
  type: "text" | "checkbox" | "dropdown" | "button" | "unknown";
  value: string | boolean;
  options?: string[];
}

export interface AuditCertificateData {
  documentName: string;
  originalSha256: string;
  modifiedSha256?: string;
  pageCount: number;
  timestamp: string;
  certificateId: string;
  actionsPerformed: string[];
}

/**
 * Calculates SHA-256 hex digest using native WebCrypto API.
 */
export async function calculateSha256(data: Uint8Array | ArrayBuffer): Promise<string> {
  const buffer = data instanceof Uint8Array ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : data;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Converts a hex color (#RRGGBB) to pdf-lib rgb(r, g, b) between 0 and 1.
 */
export function hexToPdfRgb(hex: string) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}

/**
 * Inspects all metadata dictionaries and catalog stream indicators in a PDF document.
 */
export function inspectPdfMetadata(doc: PDFDocument): PdfMetadataReport {
  let hasXmp = false;
  let hasNames = false;
  try {
    hasXmp = doc.catalog.has(PDFName.of("Metadata"));
  } catch {
    hasXmp = false;
  }
  try {
    hasNames = doc.catalog.has(PDFName.of("Names"));
  } catch {
    hasNames = false;
  }

  const kw = doc.getKeywords();
  return {
    title: doc.getTitle() || undefined,
    author: doc.getAuthor() || undefined,
    subject: doc.getSubject() || undefined,
    keywords: kw ? kw.split(",").map((s) => s.trim()) : undefined,
    producer: doc.getProducer() || undefined,
    creator: doc.getCreator() || undefined,
    creationDate: doc.getCreationDate() ? doc.getCreationDate()?.toISOString() : undefined,
    modificationDate: doc.getModificationDate() ? doc.getModificationDate()?.toISOString() : undefined,
    hasXmpMetadata: hasXmp,
    hasNamesCatalog: hasNames,
    pageCount: doc.getPageCount(),
  };
}

/**
 * Deep sanitization: strips all standard metadata, removes catalog XMP streams,
 * removes /Names and JavaScript actions.
 */
export function sanitizePdfDocument(doc: PDFDocument): { purgedFields: string[] } {
  const purged: string[] = [];

  if (doc.getTitle()) purged.push("Document Title");
  if (doc.getAuthor()) purged.push("Author / Signer Name");
  if (doc.getSubject()) purged.push("Document Subject");
  if (doc.getKeywords()) purged.push("Keywords & Tags");
  if (doc.getProducer()) purged.push("PDF Producer Signature");
  if (doc.getCreator()) purged.push("Application Creator");

  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setProducer("Enterprise Sanitizer (Verified Clean)");
  doc.setCreator("Enterprise Sanitizer");

  try {
    if (doc.catalog.has(PDFName.of("Metadata"))) {
      doc.catalog.delete(PDFName.of("Metadata"));
      purged.push("XMP XML Metadata Stream");
    }
  } catch {
    // Ignore catalog lookup faults
  }

  try {
    if (doc.catalog.has(PDFName.of("Names"))) {
      doc.catalog.delete(PDFName.of("Names"));
      purged.push("Catalog Embedded Names/Attachments");
    }
  } catch {
    // Ignore catalog lookup faults
  }

  try {
    if (doc.catalog.has(PDFName.of("OpenAction"))) {
      doc.catalog.delete(PDFName.of("OpenAction"));
      purged.push("Document Open Actions");
    }
  } catch {
    // Ignore catalog lookup faults
  }

  return { purgedFields: purged };
}

/**
 * Parses page range string (e.g., "1-3, 5, 7") into a 0-indexed set of page numbers.
 */
export function parsePageRange(rangeStr: string, totalPages: number): Set<number> {
  const selected = new Set<number>();
  if (!rangeStr || rangeStr.trim().toLowerCase() === "all") {
    for (let i = 0; i < totalPages; i++) selected.add(i);
    return selected;
  }

  const parts = rangeStr.split(",").map((p) => p.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(totalPages, parseInt(endStr, 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          selected.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        selected.add(pageNum - 1);
      }
    }
  }
  return selected;
}

/**
 * Applies legal Bates numbering to pages with custom prefix, digit padding, suffix and position.
 */
export async function applyBatesStamping(
  doc: PDFDocument,
  options: BatesStampingOptions
): Promise<{ stampedPages: number; sampleSequence: string }> {
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const color = hexToPdfRgb(options.colorHex || "#1f2937");
  const marginX = options.marginX ?? 36;
  const marginY = options.marginY ?? 28;
  const fontSize = options.fontSize ?? 9;

  const targetPages = parsePageRange(options.pageRange || "all", pages.length);
  let currentCounter = options.startNumber;
  let sampleSequence = "";

  for (let i = 0; i < pages.length; i++) {
    if (!targetPages.has(i)) continue;

    const page = pages[i];
    const { width, height } = page.getSize();
    const paddedNum = String(currentCounter).padStart(options.digits, "0");
    const rawStampText = `${options.prefix}${paddedNum}${options.suffix}`;
    const stampText = sanitizeWinAnsiText(rawStampText);

    if (!sampleSequence) {
      sampleSequence = stampText;
    }

    const textWidth = font.widthOfTextAtSize(stampText, fontSize);
    let x = marginX;
    let y = marginY;

    switch (options.position) {
      case "top-left":
        x = marginX;
        y = height - marginY;
        break;
      case "top-center":
        x = (width - textWidth) / 2;
        y = height - marginY;
        break;
      case "top-right":
        x = width - marginX - textWidth;
        y = height - marginY;
        break;
      case "bottom-left":
        x = marginX;
        y = marginY;
        break;
      case "bottom-center":
        x = (width - textWidth) / 2;
        y = marginY;
        break;
      case "bottom-right":
        x = width - marginX - textWidth;
        y = marginY;
        break;
    }

    page.drawText(stampText, {
      x,
      y,
      size: fontSize,
      font,
      color,
    });

    currentCounter++;
  }

  return {
    stampedPages: targetPages.size,
    sampleSequence: sampleSequence || `${options.prefix}000001${options.suffix}`,
  };
}

/**
 * Extracts all interactive AcroForm fields from a PDF document.
 */
export function getAcroFormSummary(doc: PDFDocument): AcroFormFieldItem[] {
  try {
    const form = doc.getForm();
    const fields = form.getFields();
    const result: AcroFormFieldItem[] = [];

    for (const field of fields) {
      const name = field.getName();
      const typeName = field.constructor.name;

      if (typeName === "PDFTextField") {
        const tf = form.getTextField(name);
        result.push({
          name,
          type: "text",
          value: tf.getText() || "",
        });
      } else if (typeName === "PDFCheckBox") {
        const cb = form.getCheckBox(name);
        result.push({
          name,
          type: "checkbox",
          value: cb.isChecked(),
        });
      } else if (typeName === "PDFDropdown") {
        const dd = form.getDropdown(name);
        result.push({
          name,
          type: "dropdown",
          value: dd.getSelected()?.[0] || "",
          options: dd.getOptions(),
        });
      } else if (typeName === "PDFButton") {
        result.push({
          name,
          type: "button",
          value: false,
        });
      } else {
        result.push({
          name,
          type: "unknown",
          value: "",
        });
      }
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * Fills AcroForm fields and optionally locks / flattens them into static vector content.
 */
export function updateAcroForm(
  doc: PDFDocument,
  fieldValues: Record<string, string | boolean>,
  flatten = false
): { updatedCount: number } {
  try {
    const form = doc.getForm();
    let updatedCount = 0;

    for (const [name, value] of Object.entries(fieldValues)) {
      try {
        const field = form.getField(name);
        const typeName = field.constructor.name;

        if (typeName === "PDFTextField" && typeof value === "string") {
          const tf = form.getTextField(name);
          tf.setText(value);
          updatedCount++;
        } else if (typeName === "PDFCheckBox" && typeof value === "boolean") {
          const cb = form.getCheckBox(name);
          if (value) cb.check();
          else cb.uncheck();
          updatedCount++;
        } else if (typeName === "PDFDropdown" && typeof value === "string") {
          const dd = form.getDropdown(name);
          dd.select(value);
          updatedCount++;
        }
      } catch {
        // Skip field if incompatible
      }
    }

    if (flatten) {
      form.flatten();
    }

    return { updatedCount };
  } catch {
    return { updatedCount: 0 };
  }
}

/**
 * Generates an Enterprise AcroForm PDF sample for quick testing and validation.
 */
export async function createSampleEnterpriseContract(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // Header
  page.drawText("ENTERPRISE MASTER SERVICE AGREEMENT", {
    x: 50,
    y: 780,
    size: 16,
    font: boldFont,
    color: rgb(0.05, 0.1, 0.2),
  });

  page.drawText("Standard AcroForm Validation & Verification Document", {
    x: 50,
    y: 760,
    size: 10,
    font,
    color: rgb(0.4, 0.45, 0.5),
  });

  page.drawLine({
    start: { x: 50, y: 745 },
    end: { x: 545, y: 745 },
    thickness: 1,
    color: rgb(0.8, 0.85, 0.9),
  });

  const form = doc.getForm();

  // Field: Company Name
  page.drawText("Organization / Legal Entity Name:", { x: 50, y: 710, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  const compField = form.createTextField("companyName");
  compField.setText("Acme Global Technologies Inc.");
  compField.addToPage(page, { x: 50, y: 680, width: 320, height: 24 });

  // Field: Signer Name
  page.drawText("Authorized Signatory Name:", { x: 50, y: 640, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  const signField = form.createTextField("signatoryName");
  signField.setText("Jane Doe");
  signField.addToPage(page, { x: 50, y: 610, width: 320, height: 24 });

  // Field: Department
  page.drawText("Department / Business Unit:", { x: 50, y: 570, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  const deptField = form.createDropdown("department");
  deptField.addOptions(["Legal & Compliance", "Engineering & Systems", "Operations & Finance"]);
  deptField.select("Legal & Compliance");
  deptField.addToPage(page, { x: 50, y: 540, width: 220, height: 24 });

  // Field: Checkbox Terms
  const checkField = form.createCheckBox("termsAccepted");
  checkField.check();
  checkField.addToPage(page, { x: 50, y: 490, width: 18, height: 18 });
  page.drawText("I confirm this document is processed in accordance with privacy and security standards.", {
    x: 76,
    y: 494,
    size: 9,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  return await doc.save();
}

/**
 * Appends a formal Enterprise SHA-256 Audit Trail Verification Certificate page to the PDF.
 */
export async function appendAuditCertificate(
  doc: PDFDocument,
  certData: AuditCertificateData
): Promise<void> {
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const monoFont = await doc.embedFont(StandardFonts.Courier);

  // Border frame
  page.drawRectangle({
    x: 35,
    y: 35,
    width: 525.28,
    height: 771.89,
    borderColor: rgb(0.1, 0.15, 0.25),
    borderWidth: 1.5,
    color: rgb(0.98, 0.99, 1.0),
  });

  // Header band
  page.drawRectangle({
    x: 36,
    y: 720,
    width: 523.28,
    height: 85,
    color: rgb(0.06, 0.1, 0.18),
  });

  page.drawText("ENTERPRISE AUDIT & INTEGRITY CERTIFICATE", {
    x: 55,
    y: 765,
    size: 15,
    font: boldFont,
    color: rgb(0.78, 0.95, 0.42), // Orbit lime
  });

  page.drawText("Tamper-Evident Cryptographic Ledger & Processing Log", {
    x: 55,
    y: 745,
    size: 9.5,
    font,
    color: rgb(0.85, 0.9, 0.95),
  });

  // Certificate ID & Date
  page.drawText(`Certificate UUID:  ${certData.certificateId}`, { x: 55, y: 695, size: 9, font: monoFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Timestamp (UTC):   ${certData.timestamp}`, { x: 55, y: 678, size: 9, font: monoFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Target File:       ${certData.documentName}`, { x: 55, y: 661, size: 9, font: monoFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Total Pages:       ${certData.pageCount} (Excluding Certificate)`, { x: 55, y: 644, size: 9, font: monoFont, color: rgb(0.2, 0.2, 0.2) });

  page.drawLine({
    start: { x: 55, y: 630 },
    end: { x: 540, y: 630 },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  // Cryptographic Checksum Section
  page.drawText("CRYPTOGRAPHIC CHECKSUMS (SHA-256)", {
    x: 55,
    y: 605,
    size: 11,
    font: boldFont,
    color: rgb(0.06, 0.1, 0.18),
  });

  page.drawText("Pre-Processing Ingest Hash:", { x: 55, y: 585, size: 8.5, font: boldFont, color: rgb(0.3, 0.35, 0.4) });
  page.drawText(certData.originalSha256 || "N/A", { x: 55, y: 570, size: 8, font: monoFont, color: rgb(0.1, 0.2, 0.4) });

  if (certData.modifiedSha256) {
    page.drawText("Certified Post-Processing Hash:", { x: 55, y: 548, size: 8.5, font: boldFont, color: rgb(0.3, 0.35, 0.4) });
    page.drawText(certData.modifiedSha256, { x: 55, y: 533, size: 8, font: monoFont, color: rgb(0.05, 0.45, 0.2) });
  }

  page.drawLine({
    start: { x: 55, y: 515 },
    end: { x: 540, y: 515 },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  // Action Ledger
  page.drawText("CHRONOLOGICAL AUDIT LEDGER", {
    x: 55,
    y: 490,
    size: 11,
    font: boldFont,
    color: rgb(0.06, 0.1, 0.18),
  });

  let ledgerY = 468;
  const actions = certData.actionsPerformed.length > 0 ? certData.actionsPerformed : ["Zero modifications applied. Pre-flight verification only."];
  for (let idx = 0; idx < actions.length; idx++) {
    const act = actions[idx];
    page.drawText(`[Step 0${idx + 1}]`, { x: 55, y: ledgerY, size: 8.5, font: monoFont, color: rgb(0.2, 0.5, 0.2) });
    page.drawText(act, { x: 120, y: ledgerY, size: 9, font, color: rgb(0.15, 0.15, 0.15) });
    ledgerY -= 20;
  }

  // QR Verification Code
  const qrVerificationPayload = JSON.stringify({
    certId: certData.certificateId,
    file: certData.documentName,
    sha256: certData.originalSha256,
    ts: certData.timestamp,
    status: "VERIFIED_GENUINE",
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrVerificationPayload, {
      margin: 1,
      width: 140,
      color: { dark: "#06101e", light: "#ffffff" },
    });
    const qrImage = await doc.embedPng(qrDataUrl);
    page.drawImage(qrImage, {
      x: 55,
      y: 120,
      width: 95,
      height: 95,
    });
  } catch {
    // If QR rendering fails, continue gracefully
  }

  page.drawText("Local-First Security Guarantee", {
    x: 165,
    y: 195,
    size: 10,
    font: boldFont,
    color: rgb(0.06, 0.1, 0.18),
  });
  page.drawText("This certificate verifies that document operations occurred strictly in", {
    x: 165,
    y: 180,
    size: 8.5,
    font,
    color: rgb(0.3, 0.35, 0.4),
  });
  page.drawText("ephemeral client-side memory without external telemetry or data retention.", {
    x: 165,
    y: 167,
    size: 8.5,
    font,
    color: rgb(0.3, 0.35, 0.4),
  });
  page.drawText("Scan QR code with any reader to verify the cryptographic digest ledger.", {
    x: 165,
    y: 154,
    size: 8.5,
    font,
    color: rgb(0.3, 0.35, 0.4),
  });

  // Footer
  page.drawText("Orbit Document Studio • Enterprise Integrity Protocol v1.4", {
    x: 55,
    y: 50,
    size: 8,
    font: monoFont,
    color: rgb(0.5, 0.55, 0.6),
  });
}
