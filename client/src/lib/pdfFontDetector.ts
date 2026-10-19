import * as pdfjsLib from "pdfjs-dist";
import { StandardFonts, PDFDocument, PDFName } from "pdf-lib";

export interface DetectedFontProfile {
  rawFontName: string;
  cleanName: string;
  standardFamily: "Helvetica" | "Times-Roman" | "Courier";
  cssFamily: string;
  fontSize: number; // in pt
  isBold: boolean;
  isItalic: boolean;
  standardPdfFontKey: StandardFonts;
}

export interface DetectedTextBlock {
  id: string;
  text: string;
  pageIndex: number;
  // Bounding box in percentage of page dimensions (0 - 100)
  x: number;
  y: number;
  width: number;
  height: number;
  // Exact PDF point dimensions
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  font: DetectedFontProfile;
  suggestedColor: string;
  suggestedBgColor: string;
}

/**
 * Normalizes a PDF font descriptor and PostScript name into standard typographic tokens.
 * Strips subset hashes (e.g., 'BCDFEE+Arial-BoldMT' -> 'Arial-BoldMT').
 */
export function analyzePdfFontName(fontName: string, fallbackFamily = "sans-serif"): DetectedFontProfile {
  // Strip 6-letter subset prefix like "ABCDEF+" or leading slash
  let cleanName = (fontName || "").replace(/^\/+/, "").replace(/^[A-Z]{6}\+/, "").trim();
  const lower = cleanName.toLowerCase();

  // Strict bold detection: Medium/Regular/Light are NOT bold.
  const isBold =
    !/light|thin|regular|normal/i.test(lower) &&
    (/(bold|black|heavy|semibold|semi-bold|demibold|\b700\b|\b800\b|\b900\b|\bw7\b|\bw8\b|\bw9\b|[-_]b\b|[-_]bd\b|\bbld\b)/i.test(lower) ||
     /(bold|black|heavy|semibold)/i.test(fontName));

  // Strict italic / oblique detection
  const isItalic = /(italic|oblique|slanted|[-_]it\b|\bital\b)/i.test(lower) || /(italic|oblique)/i.test(fontName);

  // Determine typographic classification
  const isMono =
    lower.includes("courier") ||
    lower.includes("mono") ||
    lower.includes("consolas") ||
    lower.includes("code") ||
    lower.includes("menlo") ||
    lower.includes("typewriter");

  const isSerif =
    !isMono && (
      lower.includes("times") ||
      lower.includes("georgia") ||
      lower.includes("garamond") ||
      lower.includes("palatino") ||
      lower.includes("baskerville") ||
      lower.includes("cambria") ||
      lower.includes("minion") ||
      lower.includes("century") ||
      lower.includes("didot") ||
      lower.includes("bodoni") ||
      (lower.includes("serif") && !lower.includes("sans"))
    );

  let standardFamily: "Helvetica" | "Times-Roman" | "Courier" = "Helvetica";
  let standardPdfFontKey: StandardFonts = isBold
    ? isItalic
      ? StandardFonts.HelveticaBoldOblique
      : StandardFonts.HelveticaBold
    : isItalic
    ? StandardFonts.HelveticaOblique
    : StandardFonts.Helvetica;

  if (isSerif) {
    standardFamily = "Times-Roman";
    if (isBold && isItalic) {
      standardPdfFontKey = StandardFonts.TimesRomanBoldItalic;
    } else if (isBold) {
      standardPdfFontKey = StandardFonts.TimesRomanBold;
    } else if (isItalic) {
      standardPdfFontKey = StandardFonts.TimesRomanItalic;
    } else {
      standardPdfFontKey = StandardFonts.TimesRoman;
    }
  } else if (isMono) {
    standardFamily = "Courier";
    if (isBold && isItalic) {
      standardPdfFontKey = StandardFonts.CourierBoldOblique;
    } else if (isBold) {
      standardPdfFontKey = StandardFonts.CourierBold;
    } else if (isItalic) {
      standardPdfFontKey = StandardFonts.CourierOblique;
    } else {
      standardPdfFontKey = StandardFonts.Courier;
    }
  }

  // Extract human-friendly clean font family display name
  const cleanFamily = cleanName
    .replace(/[-_]?(bold|italic|oblique|regular|medium|black|light|demi|semi|mt|ps|otf|ttf)\b/gi, " ")
    .replace(/[\-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const cleanDisplayName = cleanFamily || (isSerif ? "Times New Roman" : isMono ? "Courier New" : "Arial");
  const fallbackCss = isSerif
    ? "'Times New Roman', Times, Georgia, serif"
    : isMono
    ? "'Courier New', Courier, Consolas, monospace"
    : "Arial, Helvetica, -apple-system, sans-serif";
  const cssFamily = `"${cleanDisplayName}", ${fallbackCss}`;

  return {
    rawFontName: fontName,
    cleanName: cleanDisplayName,
    standardFamily,
    cssFamily,
    fontSize: 12,
    isBold,
    isItalic,
    standardPdfFontKey,
  };
}

/**
 * Extracts and clusters interactive text blocks for a specific PDF page.
 * Merges adjacent words on the same baseline into coherent editable sentence blocks.
 */
/**
 * Extracts and clusters interactive text blocks for a specific PDF page.
 * Uses PDF.js OperatorList and commonObjs to accurately extract:
 * 1. True font loadedName & family
 * 2. True bold / black / regular weight
 * 3. True italic style
 * 4. Exact text fill color from PDF content stream
 * 5. Font size in pt
 */
export async function extractInteractiveTextBlocks(
  pdfBytes: Uint8Array,
  pageIndex: number
): Promise<DetectedTextBlock[]> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
    const pdf = await loadingTask.promise;
    if (pageIndex < 0 || pageIndex >= pdf.numPages) return [];

    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1.0 });

    // 1. Fetch text content and operator list concurrently
    const [textContent, opList] = await Promise.all([
      page.getTextContent(),
      page.getOperatorList().catch(() => null),
    ]);

    // 2. Resolve loaded fonts directly from page.commonObjs
    const fontInfoMap: Record<
      string,
      { loadedName: string; bold: boolean; italic: boolean; fallbackName: string }
    > = {};

    const uniqueFontNames = new Set<string>();
    for (const item of textContent.items as any[]) {
      if (item.fontName) uniqueFontNames.add(item.fontName);
    }

    await Promise.all(
      Array.from(uniqueFontNames).map(
        (fName) =>
          new Promise<void>((resolve) => {
            try {
              page.commonObjs.get(fName, (fontObj: any) => {
                if (fontObj) {
                  fontInfoMap[fName] = {
                    loadedName: fontObj.loadedName || "",
                    bold: !!(fontObj.bold || fontObj.black),
                    italic: !!fontObj.italic,
                    fallbackName: fontObj.fallbackName || "sans-serif",
                  };
                }
                resolve();
              });
            } catch {
              resolve();
            }
          })
      )
    );

    // 3. Extract font dictionary mappings from pdf-lib as secondary backup
    const pdfFontMap: Record<string, string> = {};
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes.slice(), { ignoreEncryption: true });
      if (pageIndex >= 0 && pageIndex < pdfDoc.getPageCount()) {
        const p = pdfDoc.getPage(pageIndex);
        const res = p.node.Resources();
        const fontDict = res?.lookup(PDFName.of("Font"));
        if (fontDict && typeof (fontDict as any).entries === "function") {
          for (const [key, ref] of (fontDict as any).entries()) {
            try {
              const fObj = pdfDoc.context.lookup(ref);
              if (fObj && typeof (fObj as any).lookup === "function") {
                const rawBase = (fObj as any).lookup(PDFName.of("BaseFont"))?.toString() || "";
                const cleanBase = rawBase.replace(/^\//, "").trim();
                const fontKey = key.asString().replace(/^\//, "").trim();
                if (cleanBase) {
                  pdfFontMap[fontKey] = cleanBase;
                  pdfFontMap[fontKey.toLowerCase()] = cleanBase;
                }
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      // ignore
    }

    // 4. Parse OperatorList to accurately extract text fill colors and font mappings
    const opTextRuns: {
      str: string;
      color: string;
      fontName: string;
      fontSize: number;
    }[] = [];
    const fontColorMap: Record<string, string> = {};

    if (opList && opList.fnArray) {
      let currentColor = "#0f172a";
      let currentFontName = "";
      let currentFontSize = 12;

      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i];

        if (fn === (pdfjsLib as any).OPS.setFillRGBColor) {
          if (typeof args[0] === "string" && args[0].startsWith("#")) {
            currentColor = args[0];
          } else if (args && args.length >= 3) {
            const r = Math.min(255, Math.max(0, Math.round(args[0] <= 1 ? args[0] * 255 : args[0])))
              .toString(16)
              .padStart(2, "0");
            const g = Math.min(255, Math.max(0, Math.round(args[1] <= 1 ? args[1] * 255 : args[1])))
              .toString(16)
              .padStart(2, "0");
            const b = Math.min(255, Math.max(0, Math.round(args[2] <= 1 ? args[2] * 255 : args[2])))
              .toString(16)
              .padStart(2, "0");
            currentColor = `#${r}${g}${b}`;
          }
        } else if (fn === (pdfjsLib as any).OPS.setFillGray) {
          const gVal = Math.min(255, Math.max(0, Math.round(args[0] <= 1 ? args[0] * 255 : args[0])))
            .toString(16)
            .padStart(2, "0");
          currentColor = `#${gVal}${gVal}${gVal}`;
        } else if (fn === (pdfjsLib as any).OPS.setFillCMYKColor && args && args.length >= 4) {
          const c = args[0];
          const m = args[1];
          const y = args[2];
          const k = args[3];
          const r = Math.round(255 * (1 - Math.min(1, c * (1 - k) + k))).toString(16).padStart(2, "0");
          const g = Math.round(255 * (1 - Math.min(1, m * (1 - k) + k))).toString(16).padStart(2, "0");
          const b = Math.round(255 * (1 - Math.min(1, y * (1 - k) + k))).toString(16).padStart(2, "0");
          currentColor = `#${r}${g}${b}`;
        } else if (fn === (pdfjsLib as any).OPS.setFont) {
          currentFontName = args[0];
          currentFontSize = args[1];
        } else if (
          fn === (pdfjsLib as any).OPS.showText ||
          fn === (pdfjsLib as any).OPS.showSpacedText
        ) {
          let str = "";
          if (Array.isArray(args[0])) {
            for (const g of args[0]) {
              if (typeof g === "string") str += g;
              else if (g && typeof g.unicode === "string") str += g.unicode;
            }
          }
          if (str.trim()) {
            opTextRuns.push({
              str: str.trim(),
              color: currentColor,
              fontName: currentFontName,
              fontSize: currentFontSize,
            });
            if (currentFontName) {
              fontColorMap[currentFontName] = currentColor;
            }
          }
        }
      }
    }

    // 5. Build raw interactive items matching text items with accurate typography
    const rawItems: {
      str: string;
      x: number;
      y: number;
      w: number;
      h: number;
      fontSize: number;
      fontProfile: DetectedFontProfile;
      color: string;
    }[] = [];

    const styles = textContent.styles || {};
    let opIndex = 0;

    for (const item of textContent.items as any[]) {
      if (!item.str || typeof item.str !== "string" || item.str.trim() === "") continue;

      const tx = item.transform[4];
      const ty = item.transform[5];
      const fontSize = Math.max(7, Math.round(Math.hypot(item.transform[0], item.transform[1])));
      const itemW = item.width || item.str.length * (fontSize * 0.55);
      const itemH = item.height || fontSize;

      // Extract accurate font profile
      const rawFontKey = String(item.fontName || "").replace(/^\//, "");
      const loadedFont = fontInfoMap[item.fontName];
      const styleObj = styles[item.fontName];
      const matchedBaseFont = pdfFontMap[rawFontKey] || pdfFontMap[rawFontKey.toLowerCase()] || "";

      const primaryFontName = loadedFont?.loadedName || matchedBaseFont || styleObj?.fontFamily || item.fontName;
      const fontCandidate = [primaryFontName, item.fontName, styleObj?.fontFamily].filter(Boolean).join(" ");

      const fontProfile = analyzePdfFontName(fontCandidate);
      fontProfile.fontSize = fontSize;

      // Apply true bold / italic detection from PDF commonObjs
      if (loadedFont) {
        if (loadedFont.bold) fontProfile.isBold = true;
        if (loadedFont.italic) fontProfile.isItalic = true;
        if (loadedFont.loadedName && loadedFont.loadedName.length > 1) {
          fontProfile.cleanName = loadedFont.loadedName.replace(/[-_]?(bold|italic|oblique|regular|mt|ps)\b/gi, "").trim() || loadedFont.loadedName;
        }
        if (loadedFont.fallbackName === "serif") {
          fontProfile.standardFamily = "Times-Roman";
        } else if (loadedFont.fallbackName === "monospace") {
          fontProfile.standardFamily = "Courier";
        }
      }

      // Determine accurate text color:
      // Try exact string match in opTextRuns, then sequential run, then fontColorMap, then fallback
      let itemColor = fontColorMap[item.fontName] || "#0f172a";
      if (opIndex < opTextRuns.length) {
        const tr = opTextRuns[opIndex];
        if (tr.str === item.str.trim() || item.str.includes(tr.str) || tr.str.includes(item.str.trim())) {
          itemColor = tr.color;
          opIndex++;
        }
      }

      // Convert PDF coordinate origin (bottom-left) to web canvas (top-left)
      const webX = (tx / viewport.width) * 100;
      const webY = ((viewport.height - ty - itemH) / viewport.height) * 100;
      const webW = (itemW / viewport.width) * 100;
      const webH = (itemH / viewport.height) * 100;

      rawItems.push({
        str: item.str,
        x: Math.max(0, Math.min(99, webX)),
        y: Math.max(0, Math.min(99, webY)),
        w: Math.max(0.5, Math.min(100 - webX, webW)),
        h: Math.max(0.5, Math.min(100 - webY, webH)),
        fontSize,
        fontProfile,
        color: itemColor,
      });
    }

    // 6. Cluster items into coherent text blocks on the same baseline
    const clusteredBlocks: DetectedTextBlock[] = [];
    let clusterCounter = 0;

    // Sort top-to-bottom, left-to-right
    rawItems.sort((a, b) => {
      const yDiff = a.y - b.y;
      if (Math.abs(yDiff) > 0.8) return yDiff;
      return a.x - b.x;
    });

    let currentGroup: typeof rawItems = [];

    const flushGroup = () => {
      if (currentGroup.length === 0) return;

      const text = currentGroup.map((g) => g.str).join(" ").trim();
      if (text.length > 0) {
        const minX = Math.min(...currentGroup.map((g) => g.x));
        const minY = Math.min(...currentGroup.map((g) => g.y));
        const maxX = Math.max(...currentGroup.map((g) => g.x + g.w));
        const maxY = Math.max(...currentGroup.map((g) => g.y + g.h));

        // Use dominant font from longest token
        const dominantItem = currentGroup.reduce((prev, curr) =>
          curr.str.length > prev.str.length ? curr : prev
        );
        const dominantFont = dominantItem.fontProfile;
        const dominantColor = dominantItem.color || "#0f172a";

        clusterCounter++;
        clusteredBlocks.push({
          id: `block-${pageIndex}-${clusterCounter}-${Date.now()}`,
          text,
          pageIndex,
          x: Math.max(0, minX),
          y: Math.max(0, minY),
          width: Math.min(100 - minX, maxX - minX + 0.4),
          height: Math.min(100 - minY, maxY - minY + 0.2),
          pdfX: (minX / 100) * viewport.width,
          pdfY: viewport.height - ((minY + (maxY - minY)) / 100) * viewport.height,
          pdfWidth: ((maxX - minX) / 100) * viewport.width,
          pdfHeight: ((maxY - minY) / 100) * viewport.height,
          font: dominantFont,
          suggestedColor: dominantColor,
          suggestedBgColor: "#ffffff",
        });
      }
      currentGroup = [];
    };

    for (const item of rawItems) {
      if (currentGroup.length === 0) {
        currentGroup.push(item);
        continue;
      }

      const prev = currentGroup[currentGroup.length - 1];
      const isSameLine = Math.abs(item.y - prev.y) <= 0.8;
      const isCloseHorizontal = item.x >= prev.x && item.x - (prev.x + prev.w) <= 3.2;

      if (isSameLine && isCloseHorizontal) {
        currentGroup.push(item);
      } else {
        flushGroup();
        currentGroup.push(item);
      }
    }
    flushGroup();

    return clusteredBlocks;
  } catch (err) {
    console.warn("Failed to extract interactive text blocks:", err);
    return [];
  }
}
