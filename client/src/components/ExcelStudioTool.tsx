import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sanitizeWinAnsiText } from "../lib/pdfTextSanitizer";
import { fitPdfCellText } from "../lib/pdfTextExport";
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Check,
  Copy,
  Trash2,
  Table,
  Upload,
  RefreshCw,
  Sparkles,
  Layers
} from "lucide-react";

const EXCEL_PREVIEW_PAGE_SIZE = 100;
const MAX_EXCEL_FILE_BYTES = 25 * 1024 * 1024;
const MAX_EXCEL_SHEET_ROWS = 150_000;

export function syncDataToWorksheet(ws: XLSX.WorkSheet | undefined, data: any[][]): XLSX.WorkSheet {
  if (!ws) {
    return XLSX.utils.aoa_to_sheet(data);
  }

  // 1. Remove all stale cell entries in ws that exceed the new data rows or columns
  const cellKeys = Object.keys(ws).filter((k) => !k.startsWith("!"));
  for (const cellKey of cellKeys) {
    const decoded = XLSX.utils.decode_cell(cellKey);
    if (decoded.r >= data.length || decoded.c >= (data[decoded.r]?.length ?? 0)) {
      delete ws[cellKey];
    }
  }

  // 2. Update existing cells and add new cells from data
  let maxCol = 0;
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    if (!row) continue;
    if (row.length > maxCol) maxCol = row.length;
    for (let c = 0; c < row.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const currentCell = ws[cellRef];
      const newVal = row[c];

      if (currentCell) {
        if (currentCell.f) {
          // Untouched formula: preserve structure without overwriting cached value as ordinary text
          continue;
        }
        if (typeof newVal === "number") {
          ws[cellRef] = { ...currentCell, t: "n", v: newVal };
        } else if (typeof newVal === "boolean") {
          ws[cellRef] = { ...currentCell, t: "b", v: newVal };
        } else if (newVal === null || newVal === undefined || newVal === "") {
          delete ws[cellRef];
        } else {
          ws[cellRef] = { ...currentCell, t: "s", v: String(newVal) };
        }
      } else if (newVal !== null && newVal !== undefined && newVal !== "") {
        if (typeof newVal === "number") {
          ws[cellRef] = { t: "n", v: newVal };
        } else if (typeof newVal === "boolean") {
          ws[cellRef] = { t: "b", v: newVal };
        } else {
          ws[cellRef] = { t: "s", v: String(newVal) };
        }
      }
    }
  }

  // 3. Recalculate range accurately to match new boundaries
  if (data.length > 0 && maxCol > 0) {
    ws["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: data.length - 1, c: maxCol - 1 },
    });
  } else {
    ws["!ref"] = "A1:A1";
  }

  return ws;
}

/**
 * Detects if a workbook contains formulas in any worksheet
 */
export function workbookHasFormulas(wb?: XLSX.WorkBook | null): boolean {
  if (!wb || !wb.SheetNames) return false;
  return wb.SheetNames.some((name) => {
    const ws = wb.Sheets[name];
    if (!ws) return false;
    return Object.keys(ws).some((key) => !key.startsWith("!") && Boolean(ws[key]?.f));
  });
}

/**
 * Creates a values-only duplicate of a workbook preserving layout without formula references
 */
export function createValuesOnlyWorkbook(
  wb: XLSX.WorkBook,
  activeSheet?: string,
  pendingActiveRows?: any[][],
): XLSX.WorkBook {
  const newWb = XLSX.utils.book_new();
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    // Current-sheet edits may be pending in React state when this export is clicked.
    // Use them for the values-only copy without overwriting the original formulas.
    const aoa = name === activeSheet && pendingActiveRows !== undefined
      ? pendingActiveRows
      : XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    const cleanWs = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(newWb, cleanWs, name);
  }
  return newWb;
}

/** Escape Markdown delimiters and multiline spreadsheet values before table export. */
export function spreadsheetDataToMarkdownTable(data: any[][]): string {
  if (!data.length) return "";
  const cols = data.reduce((max, row) => Math.max(max, row?.length ?? 0), 0);
  if (!cols) return "";

  const escapeCell = (cell: unknown) => String(cell ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r\n|\r|\n/g, "<br>");
  const render = (row: any[]) =>
    `| ${Array.from({ length: cols }, (_, index) => escapeCell(row?.[index])).join(" | ")} |`;

  return [
    render(data[0]),
    `| ${Array.from({ length: cols }, () => "---").join(" | ")} |`,
    ...data.slice(1).map(render),
  ].join("\n");
}

export default function ExcelStudioTool() {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [rawData, setRawData] = useState<any[][]>([]);
  const [fileName, setFileName] = useState<string>("data.xlsx");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);
  const [hasUserEdits, setHasUserEdits] = useState<boolean>(false);
  const [editedSheets, setEditedSheets] = useState<Set<string>>(new Set());
  const [originalRawBytes, setOriginalRawBytes] = useState<Uint8Array | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const uploadRevision = useRef(0);

  // Load sample dataset
  const loadSampleData = () => {
    const sampleRows = [
      ["Employee ID", "Full Name", "Department", "Location", "Monthly Salary", "Status"],
      ["EMP-101", "Aarav Sharma", "Engineering", "Mumbai", 95000, "Active"],
      ["EMP-102", "Priya Patel", "Design", "Bengaluru", 82000, "Active"],
      ["EMP-103", "Rohan Mehta", "Marketing", "Delhi", 68000, "On Leave"],
      ["EMP-104", "Ananya Iyer", "Engineering", "Bengaluru", 105000, "Active"],
      ["EMP-105", "Kabir Singh", "Operations", "Hyderabad", 54000, "Active"],
      ["EMP-106", "Aarav Sharma", "Engineering", "Mumbai", 95000, "Active"], // duplicate row for testing
      ["EMP-107", "Sneha Roy", "Product", "Pune", 89000, "Active"],
      ["EMP-108", "Vikram Das", "Support", "Kolkata", 48000, "Active"],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, "Staff Directory");

    const financeRows = [
      ["Quarter", "Revenue (INR)", "Expenses (INR)", "Net Profit"],
      ["Q1", 12500000, 8400000, 4100000],
      ["Q2", 14200000, 9100000, 5100000],
      ["Q3", 16800000, 10200000, 6600000],
      ["Q4", 19500000, 11400000, 8100000],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(financeRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Financial Summary");

    setWorkbook(wb);
    setSheetNames(["Staff Directory", "Financial Summary"]);
    setActiveSheet("Staff Directory");
    setRawData(sampleRows);
    setFileName("sample_company_data.xlsx");
    setOriginalRawBytes(null);
    setHasUserEdits(false);
    setEditedSheets(new Set());
    setSearchTerm("");
    setPreviewPage(0);
    uploadRevision.current++;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // Allows importing the same filename again.
    if (!file) return;
    const revision = ++uploadRevision.current;
    if (file.size > MAX_EXCEL_FILE_BYTES) {
      toast.error("File exceeds 25 MB. Choose a smaller workbook to protect browser memory.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      if (revision === uploadRevision.current) toast.error("Could not read the selected spreadsheet.");
    };
    reader.onload = (evt) => {
      if (revision !== uploadRevision.current) return;
      try {
        const buffer = evt.target?.result;
        if (!(buffer instanceof ArrayBuffer)) throw new Error("Invalid workbook input");
        const bytes = new Uint8Array(buffer);
        const wb = XLSX.read(bytes, { type: "array", cellStyles: true, cellFormula: true, cellNF: true });
        const firstSheet = wb.SheetNames[0];
        if (!firstSheet || !wb.Sheets[firstSheet]) throw new Error("Workbook has no readable sheets");
        // An XLSX can expand far beyond its compressed upload size.
        for (const sheet of wb.SheetNames) {
          const reference = wb.Sheets[sheet]?.["!ref"];
          if (reference && XLSX.utils.decode_range(reference).e.r + 1 > MAX_EXCEL_SHEET_ROWS) {
            throw new Error("This workbook contains a sheet with over 150,000 rows.");
          }
        }
        const sheetData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[firstSheet], { header: 1 });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        setActiveSheet(firstSheet);
        setRawData(sheetData);
        setFileName(file.name);
        setOriginalRawBytes(bytes);
        setHasUserEdits(false);
        setEditedSheets(new Set());
        setSearchTerm("");
        setPreviewPage(0);
      } catch (err) {
        toast.error(err instanceof Error && err.message.includes("150,000")
          ? err.message : "Failed to parse Excel/CSV file. Please check file format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSheetSwitch = (sheet: string) => {
    if (!workbook) return;
    // Persist edits on the outgoing active worksheet ONLY if user actually edited that sheet
    if (editedSheets.has(activeSheet) && activeSheet && rawData.length > 0) {
      workbook.Sheets[activeSheet] = syncDataToWorksheet(workbook.Sheets[activeSheet], rawData);
    }
    setActiveSheet(sheet);
    setPreviewPage(0);
    const targetWs = workbook.Sheets[sheet];
    const sheetData = targetWs ? XLSX.utils.sheet_to_json<any[]>(targetWs, { header: 1 }) : [];
    setRawData(sheetData);
  };

  // Cleaning Actions
  const removeDuplicateRows = () => {
    if (rawData.length <= 1) return;
    if (workbook && workbookHasFormulas(workbook)) {
      toast.error(
        "Structural deduplication is blocked on workbooks with active Excel formulas to prevent formula reference corruption (#REF!). Please use plain-data worksheets or export as values-only."
      );
      return;
    }
    const header = rawData[0];
    const rows = rawData.slice(1);
    const seen = new Set<string>();
    const uniqueRows: any[][] = [];

    rows.forEach((r) => {
      const key = JSON.stringify(r);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRows.push(r);
      }
    });

    const cleaned = [header, ...uniqueRows];
    setRawData(cleaned);
    setHasUserEdits(true);
    setEditedSheets((prev) => new Set(prev).add(activeSheet));
    const curSheet = workbook?.Sheets[activeSheet];
    if (curSheet) {
      workbook!.Sheets[activeSheet] = syncDataToWorksheet(curSheet, cleaned);
    }
    const removedCount = rows.length - uniqueRows.length;
    toast.success(`Removed ${removedCount} duplicate ${removedCount === 1 ? "row" : "rows"}.`);
  };

  const trimAllSpaces = () => {
    const cleaned = rawData.map((row) =>
      row.map((cell) => (typeof cell === "string" ? cell.trim() : cell))
    );
    setRawData(cleaned);
    setHasUserEdits(true);
    setEditedSheets((prev) => new Set(prev).add(activeSheet));
    // Synchronize the worksheet for all export formats, preserving formula cells.
    if (workbook?.Sheets[activeSheet]) {
      workbook.Sheets[activeSheet] = syncDataToWorksheet(workbook.Sheets[activeSheet], cleaned);
    }
    toast.success("Trimmed extra spaces from all cells.");
  };

  const removeEmptyRows = () => {
    if (workbook && workbookHasFormulas(workbook)) {
      toast.error(
        "Removing blank rows is blocked on workbooks with active Excel formulas to preserve formula coordinate ranges. Please use plain-data worksheets or export as values-only."
      );
      return;
    }
    const cleaned = rawData.filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "")
    );
    setRawData(cleaned);
    setHasUserEdits(true);
    setEditedSheets((prev) => new Set(prev).add(activeSheet));
    const curSheet = workbook?.Sheets[activeSheet];
    if (curSheet) {
      workbook!.Sheets[activeSheet] = syncDataToWorksheet(curSheet, cleaned);
    }
  };

  // Filtered rows for viewing
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return rawData;
    const term = searchTerm.toLowerCase();
    const header = rawData[0] || [];
    const rows = rawData.slice(1);
    const matched = rows.filter((r) =>
      r.some((c) => String(c).toLowerCase().includes(term))
    );
    return [header, ...matched];
  }, [rawData, searchTerm]);

  // Export handlers
  const exportToExcel = () => {
    try {
      if (!hasUserEdits && originalRawBytes) {
        // Exact original preservation: export byte-for-byte unmodified workbook
        const blob = new Blob([originalRawBytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      let wbToExport = workbook;
      if (wbToExport && wbToExport.SheetNames.length > 0) {
        // Save current sheet changes preserving formulas only if activeSheet was actually edited
        if (editedSheets.has(activeSheet)) {
          const targetSheet = activeSheet || wbToExport.SheetNames[0];
          wbToExport.Sheets[targetSheet] = syncDataToWorksheet(wbToExport.Sheets[targetSheet], rawData);
        }
      } else {
        wbToExport = XLSX.utils.book_new();
        const ws = syncDataToWorksheet(undefined, rawData);
        XLSX.utils.book_append_sheet(wbToExport, ws, activeSheet || "Sheet1");
      }
      XLSX.writeFile(wbToExport, fileName.replace(/\.[^/.]+$/, "") + "_cleaned.xlsx");
    } catch (err) {
      console.error("Failed to export Excel file:", err);
      toast.error("Unable to generate Excel export. The sheet may be too large or contain invalid cell formats.");
    }
  };

  const exportToExcelValuesOnly = () => {
    try {
      if (!workbook) return;
      const valuesOnlyWb = createValuesOnlyWorkbook(
        workbook,
        activeSheet,
        editedSheets.has(activeSheet) ? rawData : undefined,
      );
      XLSX.writeFile(valuesOnlyWb, fileName.replace(/\.[^/.]+$/, "") + "_values_only.xlsx");
    } catch (err) {
      console.error("Failed to export values-only Excel:", err);
      toast.error("Unable to generate values-only export.");
    }
  };

  const exportToCsv = () => {
    try {
      const ws = XLSX.utils.aoa_to_sheet(rawData);
      const csvOutput = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName.replace(/\.[^/.]+$/, "") + ".csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export CSV file:", err);
      toast.error("Unable to generate CSV export. Please try again.");
    }
  };

  const exportToJson = () => {
    try {
      if (rawData.length < 2) return;
      const header = rawData[0];
      const rows = rawData.slice(1);
      const jsonObjects = rows.map((row) => {
        const obj: Record<string, any> = {};
        header.forEach((h: string, idx: number) => {
          obj[h || `column_${idx + 1}`] = row[idx] ?? null;
        });
        return obj;
      });

      const jsonStr = JSON.stringify(jsonObjects, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName.replace(/\.[^/.]+$/, "") + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export JSON:", err);
      toast.error("Unable to export JSON data. Please try again.");
    }
  };

  const exportToPdfTable = async () => {
    try {
      if (rawData.length === 0) return;
      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageWidth = 841.89; // landscape A4 for spreadsheet tables
      const pageHeight = 595.28;
      const margin = 36;
      const availableWidth = pageWidth - margin * 2;
      const headers = rawData[0] || [];
      const rows = rawData.slice(1);
      // A sparse header must not make us silently omit trailing row columns.
      const colCount = rows.reduce((maxCols, row) =>
        Math.max(maxCols, row?.length ?? 0), Math.max(1, headers.length));
      const headerLabels = Array.from({ length: colCount }, (_, index) =>
        headers[index] ?? `Col ${index + 1}`);
      const colWidth = availableWidth / colCount;
      const rowHeight = 18;

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      // Title & Sheet Name
      const titleText = fitPdfCellText(sanitizeWinAnsiText(`${fileName} - Sheet: ${activeSheet}`), helveticaBold, 13, availableWidth);
      currentPage.drawText(titleText, {
        x: margin,
        y: currentY,
        size: 13,
        font: helveticaBold,
        color: rgb(0.12, 0.22, 0.54),
      });
      currentY -= 24;

      // Draw Header row background
      currentPage.drawRectangle({
        x: margin,
        y: currentY - 4,
        width: availableWidth,
        height: rowHeight,
        color: rgb(0.92, 0.94, 0.98),
      });

      // Draw Headers
      headerLabels.forEach((h, i) => {
        const text = fitPdfCellText(sanitizeWinAnsiText(String(h)), helveticaBold, 9, colWidth - 8);
        currentPage.drawText(text, {
          x: margin + i * colWidth + 4,
          y: currentY,
          size: 9,
          font: helveticaBold,
          color: rgb(0.12, 0.22, 0.54),
        });
      });
      currentY -= rowHeight;

      // Draw Data Rows
      for (let r = 0; r < rows.length; r++) {
        if (currentY <= margin + 20) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
          // Redraw Header row on new page
          currentPage.drawRectangle({
            x: margin,
            y: currentY - 4,
            width: availableWidth,
            height: rowHeight,
            color: rgb(0.92, 0.94, 0.98),
          });
          headerLabels.forEach((h, i) => {
            const text = fitPdfCellText(sanitizeWinAnsiText(String(h)), helveticaBold, 9, colWidth - 8);
            currentPage.drawText(text, {
              x: margin + i * colWidth + 4,
              y: currentY,
              size: 9,
              font: helveticaBold,
              color: rgb(0.12, 0.22, 0.54),
            });
          });
          currentY -= rowHeight;
        }

        const row = rows[r];
        // Zebra striping
        if (r % 2 === 1) {
          currentPage.drawRectangle({
            x: margin,
            y: currentY - 4,
            width: availableWidth,
            height: rowHeight,
            color: rgb(0.97, 0.98, 0.99),
          });
        }

        headerLabels.forEach((_, colIdx) => {
          const val = row?.[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]) : "";
          const text = fitPdfCellText(sanitizeWinAnsiText(val), helvetica, 8.5, colWidth - 8);
          currentPage.drawText(text, {
            x: margin + colIdx * colWidth + 4,
            y: currentY,
            size: 8.5,
            font: helvetica,
            color: rgb(0.15, 0.15, 0.15),
          });
        });

        currentY -= rowHeight;
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.[^/.]+$/, "")}_${activeSheet}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to export PDF Table: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  const copyAsJson = async () => {
    try {
      if (rawData.length < 2) return;
      const header = rawData[0];
      const rows = rawData.slice(1);
      const jsonObjects = rows.map((row) => {
        const obj: Record<string, any> = {};
        header.forEach((h: string, idx: number) => {
          obj[h || `column_${idx + 1}`] = row[idx] ?? null;
        });
        return obj;
      });
      await navigator.clipboard.writeText(JSON.stringify(jsonObjects, null, 2));
      setCopied("json");
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy JSON to clipboard:", err);
    }
  };

  const copyAsMarkdownTable = async () => {
    try {
      if (rawData.length === 0) return;
      await navigator.clipboard.writeText(spreadsheetDataToMarkdownTable(rawData));
      setCopied("markdown");
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy Markdown to clipboard:", err);
    }
  };

  const headers = filteredData[0] || [];
  const contentRows = filteredData.slice(1);
  const previewPageCount = Math.max(1, Math.ceil(contentRows.length / EXCEL_PREVIEW_PAGE_SIZE));
  const safePreviewPage = Math.min(previewPage, previewPageCount - 1);
  const firstPreviewRow = safePreviewPage * EXCEL_PREVIEW_PAGE_SIZE;
  const visibleRows = contentRows.slice(firstPreviewRow, firstPreviewRow + EXCEL_PREVIEW_PAGE_SIZE);

  return (
    <div className="runner-stack space-y-6">
      {/* Upload Header */}
      {!workbook ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-[#c7f36b]" />
          <h3 className="mt-4 text-xl font-semibold text-white">Excel & Spreadsheet Studio</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Open, clean, deduplicate, filter, and convert Excel (.xlsx, .xls) & CSV files without sending data to any cloud server.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <label className="signal-button inline-flex cursor-pointer items-center gap-2">
              <Upload size={16} />
              Open Excel / CSV File
              <input
                type="file"
                accept=".xlsx, .xls, .csv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button onClick={loadSampleData} className="reset-button inline-flex items-center gap-2">
              <Sparkles size={16} />
              Load Multi-Sheet Sample Data
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Info & Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="text-[#c7f36b]" size={18} />
              <span className="font-mono text-sm font-medium text-white">{fileName}</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">
                {rawData.length - 1} rows · {headers.length} columns
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="signal-button cursor-pointer py-1.5 px-3 text-xs">
                Open Another File
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Multi-Sheet Tabs if workbook has multiple sheets */}
          {sheetNames.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-2">
              <span className="text-xs text-white/50 flex items-center gap-1">
                <Layers size={14} /> Sheets:
              </span>
              {sheetNames.map((sheet) => (
                <button
                  key={sheet}
                  onClick={() => handleSheetSwitch(sheet)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    activeSheet === sheet
                      ? "bg-[#c7f36b] text-[#0b1020]"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {sheet}
                </button>
              ))}
            </div>
          )}

          {/* Action & Data Cleaning Toolbar */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 md:grid-cols-2 lg:grid-cols-4">
            {/* Search filter */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-white/40" size={14} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPreviewPage(0); }}
                placeholder="Search cells & filter..."
                className="w-full rounded-lg border border-white/10 bg-black/40 py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/30"
              />
            </div>

            {/* Quick Cleaners */}
            <div className="flex gap-2">
              <button
                onClick={removeDuplicateRows}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs text-white/90 hover:bg-white/10"
              >
                Remove Duplicates
              </button>
              <button
                onClick={trimAllSpaces}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs text-white/90 hover:bg-white/10"
              >
                Trim Spaces
              </button>
            </div>

            {/* Copy options */}
            <div className="flex gap-2">
              <button
                onClick={copyAsJson}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs text-white/90 hover:bg-white/10"
              >
                {copied === "json" ? <Check size={12} /> : <Copy size={12} />}
                {copied === "json" ? "Copied JSON" : "Copy JSON"}
              </button>
              <button
                onClick={copyAsMarkdownTable}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs text-white/90 hover:bg-white/10"
              >
                {copied === "markdown" ? <Check size={12} /> : <Table size={12} />}
                {copied === "markdown" ? "Copied MD" : "Copy MD Table"}
              </button>
            </div>

            {/* Download dropdown / buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToExcel}
                className="flex-1 min-w-[70px] flex items-center justify-center gap-1 rounded-lg bg-[#c7f36b] py-1.5 text-xs font-semibold text-[#0b1020] hover:bg-[#b8eb55]"
              >
                <Download size={13} /> .xlsx
              </button>
              {workbookHasFormulas(workbook) && (
                <button
                  onClick={exportToExcelValuesOnly}
                  className="flex-1 min-w-[110px] flex items-center justify-center gap-1 rounded-lg border border-purple-400/40 bg-purple-500/10 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20"
                  title="Export clean values-only workbook without formula dependencies"
                >
                  <Download size={13} /> .xlsx (Values Only)
                </button>
              )}
              <button
                onClick={exportToCsv}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-white/20 bg-white/10 py-1.5 text-xs text-white hover:bg-white/20"
              >
                <Download size={13} /> .csv
              </button>
              <button
                onClick={exportToJson}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-white/20 bg-white/10 py-1.5 text-xs text-white hover:bg-white/20"
              >
                <Download size={13} /> .json
              </button>
              <button
                onClick={exportToPdfTable}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                title="Export current sheet as formatted PDF table"
              >
                <Download size={13} /> .pdf
              </button>
            </div>
          </div>

          {/* Interactive Data Table Preview */}
          <div className="max-h-96 overflow-auto rounded-xl border border-white/15 bg-black/40">
            <table className="w-full text-left text-xs text-white/80 border-collapse">
              <thead className="sticky top-0 bg-[#161a29] text-white font-mono text-[11px] uppercase border-b border-white/10">
                <tr>
                  <th className="px-3 py-2 w-10 text-white/40">#</th>
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 border-r border-white/5 font-semibold text-[#c7f36b]">
                      {String(h ?? `Col ${i + 1}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {contentRows.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length + 1} className="px-4 py-8 text-center text-white/40">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-3 py-2 text-white/40 font-mono text-[10px] bg-black/20">
                        {firstPreviewRow + rowIdx + 1}
                      </td>
                      {headers.map((_, colIdx) => (
                        <td key={colIdx} className="px-3 py-2 border-r border-white/5 truncate max-w-xs">
                          {row[colIdx] !== undefined && row[colIdx] !== null
                            ? String(row[colIdx])
                            : <span className="text-white/20 italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70">
            <span aria-live="polite">
              {contentRows.length === 0 ? "No matching rows" :
                `Previewing ${firstPreviewRow + 1}–${Math.min(firstPreviewRow + EXCEL_PREVIEW_PAGE_SIZE, contentRows.length)} of ${contentRows.length.toLocaleString()} rows`}
              {" · Exports include the complete sheet"}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" className="quiet-button" disabled={safePreviewPage === 0}
                onClick={() => setPreviewPage(page => Math.max(0, page - 1))}
                aria-label="Previous spreadsheet preview page">Previous</button>
              <span>Page {safePreviewPage + 1} / {previewPageCount}</span>
              <button type="button" className="quiet-button" disabled={safePreviewPage >= previewPageCount - 1}
                onClick={() => setPreviewPage(page => Math.min(previewPageCount - 1, page + 1))}
                aria-label="Next spreadsheet preview page">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
