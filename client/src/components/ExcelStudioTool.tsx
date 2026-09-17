import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
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

export default function ExcelStudioTool() {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [rawData, setRawData] = useState<any[][]>([]);
  const [fileName, setFileName] = useState<string>("data.xlsx");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);

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
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const firstSheet = wb.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[firstSheet], { header: 1 });
        
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        setActiveSheet(firstSheet);
        setRawData(sheetData);
        setFileName(file.name);
      } catch (err) {
        alert("Failed to parse Excel/CSV file. Please check file format.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSheetSwitch = (sheet: string) => {
    if (!workbook) return;
    setActiveSheet(sheet);
    const sheetData = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[sheet], { header: 1 });
    setRawData(sheetData);
  };

  // Cleaning Actions
  const removeDuplicateRows = () => {
    if (rawData.length <= 1) return;
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
    const removedCount = rows.length - uniqueRows.length;
    alert(`Removed ${removedCount} duplicate ${removedCount === 1 ? "row" : "rows"}.`);
  };

  const trimAllSpaces = () => {
    const cleaned = rawData.map((row) =>
      row.map((cell) => (typeof cell === "string" ? cell.trim() : cell))
    );
    setRawData(cleaned);
    alert("Trimmed extra spaces from all cells.");
  };

  const removeEmptyRows = () => {
    const cleaned = rawData.filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "")
    );
    setRawData(cleaned);
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
      const ws = XLSX.utils.aoa_to_sheet(rawData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeSheet || "Sheet1");
      XLSX.writeFile(wb, fileName.replace(/\.[^/.]+$/, "") + "_cleaned.xlsx");
    } catch (err) {
      console.error("Failed to export Excel file:", err);
      alert("Unable to generate Excel export. The sheet may be too large or contain invalid cell formats.");
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
      alert("Unable to generate CSV export. Please try again.");
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
      alert("Unable to export JSON data. Please try again.");
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
      const header = rawData[0];
      const divider = header.map(() => "---");
      const rows = rawData.slice(1);
      const mdLines = [
        `| ${header.join(" | ")} |`,
        `| ${divider.join(" | ")} |`,
        ...rows.map((r) => `| ${r.map((c) => String(c ?? "")).join(" | ")} |`),
      ];
      await navigator.clipboard.writeText(mdLines.join("\n"));
      setCopied("markdown");
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy Markdown to clipboard:", err);
    }
  };

  const headers = filteredData[0] || [];
  const contentRows = filteredData.slice(1);

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
                onChange={(e) => setSearchTerm(e.target.value)}
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
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#c7f36b] py-1.5 text-xs font-semibold text-[#0b1020] hover:bg-[#b8eb55]"
              >
                <Download size={13} /> .xlsx
              </button>
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
                  contentRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-3 py-2 text-white/40 font-mono text-[10px] bg-black/20">
                        {rowIdx + 1}
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
        </div>
      )}
    </div>
  );
}
