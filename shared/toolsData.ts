// Orbital Workbench: typed registry for local-first, shared-hosting-safe tools.
export type ToolKind =
  | "calculator"
  | "percentage"
  | "unit"
  | "base64"
  | "json"
  | "password"
  | "textStats"
  | "color"
  | "bmi"
  | "discount"
  | "age"
  | "dateDiff"
  | "url"
  | "html"
  | "textCase"
  | "uuid"
  | "gradient"
  | "qr"
  | "imageResize"
  | "favicon"
  | "hash"
  | "passwordAudit"
  | "markdown"
  | "contrast"
  | "businessDays"
  | "timeZone"
  | "timestamp"
  | "textDiff"
  | "findReplace"
  | "splitBill"
  | "loanEmi"
  | "workShift"
  | "jsonCsv"
  | "csvViewer"
  | "imageTransform"
  | "lineSorter"
  | "imageMetadata"
  | "pdfEditor"
  | "pdfMergeSplit"
  | "imagesToPdf"
  | "excelStudio"
  | "wordDocx"
  | "whatsappDirect"
  | "gstTax"
  | "passportPhoto"
  | "landArea"
  | "numberToWords"
  | "jsonToZod"
  | "cleanUrl"
  | "jwtDebugger"
  | "cronSchedule"
  | "regexTester"
  | "curlToCode";

export type ToolDefinition = {
  slug: string;
  name: string;
  category: "Calculate" | "Convert" | "Code & Text" | "Create";
  description: string;
  kind: ToolKind;
  accent: "lime" | "ember" | "sky" | "violet";
  tags: string[];
};

export const tools: ToolDefinition[] = [
  {
    slug: "basic-calculator",
    name: "Basic Calculator",
    category: "Calculate",
    description: "Clear, local arithmetic for everyday decisions.",
    kind: "calculator",
    accent: "lime",
    tags: ["Local", "Verified"],
  },
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    category: "Calculate",
    description: "Find a percentage, a part of a total, or a percentage change.",
    kind: "percentage",
    accent: "ember",
    tags: ["Local", "Verified"],
  },
  {
    slug: "unit-converter",
    name: "Unit Converter",
    category: "Convert",
    description: "Convert common length units without a server round-trip.",
    kind: "unit",
    accent: "sky",
    tags: ["Local", "Verified"],
  },
  {
    slug: "base64-workbench",
    name: "Base64 Workbench",
    category: "Convert",
    description: "Encode or decode UTF-8 text in your browser.",
    kind: "base64",
    accent: "violet",
    tags: ["Local", "Private"],
  },
  {
    slug: "json-station",
    name: "JSON Station",
    category: "Code & Text",
    description: "Format and validate JSON with readable errors.",
    kind: "json",
    accent: "lime",
    tags: ["Local", "Verified"],
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    category: "Create",
    description: "Create a strong password with browser-grade randomness.",
    kind: "password",
    accent: "ember",
    tags: ["Local", "Private"],
  },
  {
    slug: "text-statistics",
    name: "Text Statistics",
    category: "Code & Text",
    description: "Count words, characters, lines, and reading time at a glance.",
    kind: "textStats",
    accent: "sky",
    tags: ["Local", "Verified"],
  },
  {
    slug: "color-signal",
    name: "Color Signal",
    category: "Create",
    description: "Inspect a HEX color and pull out a practical RGB reference.",
    kind: "color",
    accent: "violet",
    tags: ["Local", "Verified"],
  },
  {
    slug: "bmi-calculator",
    name: "BMI Calculator",
    category: "Calculate",
    description: "Calculate body mass index using height and weight inputs.",
    kind: "bmi",
    accent: "lime",
    tags: ["Local", "Verified"],
  },
  {
    slug: "discount-calculator",
    name: "Discount Calculator",
    category: "Calculate",
    description: "See the final price and savings before you buy.",
    kind: "discount",
    accent: "ember",
    tags: ["Local", "Verified"],
  },
  {
    slug: "age-calculator",
    name: "Age Calculator",
    category: "Calculate",
    description: "Find an age in years, months, and days from a date of birth.",
    kind: "age",
    accent: "sky",
    tags: ["Local", "Private"],
  },
  {
    slug: "date-difference",
    name: "Date Difference",
    category: "Calculate",
    description: "Measure the calendar distance between two dates.",
    kind: "dateDiff",
    accent: "violet",
    tags: ["Local", "Verified"],
  },
  {
    slug: "url-workbench",
    name: "URL Encoder / Decoder",
    category: "Code & Text",
    description: "Encode or decode URL-safe text directly in your browser.",
    kind: "url",
    accent: "lime",
    tags: ["Local", "Private"],
  },
  {
    slug: "html-entity-tool",
    name: "HTML Entity Encoder / Decoder",
    category: "Code & Text",
    description: "Encode or decode HTML entities without a remote service.",
    kind: "html",
    accent: "ember",
    tags: ["Local", "Private"],
  },
  {
    slug: "text-case-tool",
    name: "Text Case Tool",
    category: "Code & Text",
    description: "Shift text between readable and developer-friendly cases.",
    kind: "textCase",
    accent: "sky",
    tags: ["Local", "Verified"],
  },
  {
    slug: "uuid-generator",
    name: "UUID Generator",
    category: "Create",
    description: "Generate UUID v4 values using browser cryptography.",
    kind: "uuid",
    accent: "violet",
    tags: ["Local", "Private"],
  },
  {
    slug: "gradient-forge",
    name: "Gradient Forge",
    category: "Create",
    description: "Build a two-stop CSS linear gradient and copy the code.",
    kind: "gradient",
    accent: "lime",
    tags: ["Local", "Verified"],
  },
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    category: "Create",
    description: "Generate a shareable QR image locally from text or a link.",
    kind: "qr",
    accent: "ember",
    tags: ["Local", "Private"],
  },
  {
    slug: "image-resizer",
    name: "Image Resizer",
    category: "Create",
    description: "Resize and compress images locally with controlled export settings.",
    kind: "imageResize",
    accent: "sky",
    tags: ["Local", "Private"],
  },
  {
    slug: "favicon-generator",
    name: "Favicon Generator",
    category: "Create",
    description: "Turn an image into a locally generated square PNG icon.",
    kind: "favicon",
    accent: "lime",
    tags: ["Local", "Private"],
  },
  {
    slug: "hash-generator",
    name: "Hash Generator",
    category: "Code & Text",
    description: "Create SHA-256, SHA-384, or SHA-512 digests locally.",
    kind: "hash",
    accent: "ember",
    tags: ["Local", "Private"],
  },
  {
    slug: "password-strength-auditor",
    name: "Password Strength Auditor",
    category: "Code & Text",
    description: "Check a password against clear local strength signals.",
    kind: "passwordAudit",
    accent: "sky",
    tags: ["Local", "Private"],
  },
  {
    slug: "markdown-workspace",
    name: "Markdown Workspace",
    category: "Code & Text",
    description: "Write Markdown, inspect a safe local preview, and export sanitized HTML.",
    kind: "markdown",
    accent: "violet",
    tags: ["Local", "Private"],
  },
  {
    slug: "color-contrast-checker",
    name: "Color Contrast Checker",
    category: "Create",
    description: "Check text and background colors against accessible contrast thresholds.",
    kind: "contrast",
    accent: "lime",
    tags: ["Local", "Verified"],
  },
  {
    slug: "business-days-calculator",
    name: "Business Days Calculator",
    category: "Calculate",
    description: "Count Monday–Friday dates in a selected range without a holiday feed.",
    kind: "businessDays",
    accent: "lime",
    tags: ["Local", "Verified"],
  },
  {
    slug: "time-zone-meeting-planner",
    name: "Time Zone Meeting Planner",
    category: "Convert",
    description: "Translate one local meeting time between common browser-supported zones.",
    kind: "timeZone",
    accent: "sky",
    tags: ["Local", "Private"],
  },
  {
    slug: "timestamp-converter",
    name: "Timestamp Converter",
    category: "Convert",
    description: "Read a Unix timestamp as ISO, UTC, and your browser’s local time.",
    kind: "timestamp",
    accent: "violet",
    tags: ["Local", "Verified"],
  },
  {
    slug: "text-diff-checker",
    name: "Text Diff Checker",
    category: "Code & Text",
    description: "Compare two text blocks line by line, directly in your browser.",
    kind: "textDiff",
    accent: "ember",
    tags: ["Local", "Private"],
  },
  {
    slug: "find-replace-workspace",
    name: "Find / Replace Workspace",
    category: "Code & Text",
    description: "Replace literal text or simple regex matches without uploading a draft.",
    kind: "findReplace",
    accent: "sky",
    tags: ["Local", "Private"],
  },
  {
    slug: "split-bill-tip-calculator",
    name: "Split Bill & Tip",
    category: "Calculate",
    description: "Divide a bill and a chosen tip across a group in one local readout.",
    kind: "splitBill",
    accent: "ember",
    tags: ["Local", "Private"],
  },
  {
    slug: "loan-emi-estimate",
    name: "Loan / EMI Estimate",
    category: "Calculate",
    description: "Estimate a fixed-rate monthly payment from the amount, annual rate, and term.",
    kind: "loanEmi",
    accent: "lime",
    tags: ["Local", "Verified"],
  },
  {
    slug: "work-shift-duration",
    name: "Work Shift Duration",
    category: "Calculate",
    description: "Calculate paid time after an unpaid break, including an overnight shift.",
    kind: "workShift",
    accent: "sky",
    tags: ["Local", "Private"],
  },
  {
    slug: "json-csv-converter",
    name: "JSON ↔ CSV Converter",
    category: "Convert",
    description: "Convert a pasted flat JSON table or CSV table without uploading the data.",
    kind: "jsonCsv",
    accent: "violet",
    tags: ["Local", "Private"],
  },
  {
    slug: "csv-viewer-cleaner",
    name: "CSV Viewer & Cleaner",
    category: "Code & Text",
    description: "Inspect a pasted CSV table, trim cells, remove blank rows, and export a clean copy.",
    kind: "csvViewer",
    accent: "sky",
    tags: ["Local", "Private"],
  },
  {
    slug: "image-crop-rotate-convert",
    name: "Image Crop / Rotate / Convert",
    category: "Create",
    description: "Crop an explicitly chosen image, turn it by 90°, and export a local PNG, JPG, or WebP copy.",
    kind: "imageTransform",
    accent: "ember",
    tags: ["Local", "Private"],
  },
  {
    slug: "line-sorter-deduplicator",
    name: "Line Sorter & De-duplicator",
    category: "Code & Text",
    description: "Sort pasted lines, remove repeats, and retain only the cleanup choices you make in this tab.",
    kind: "lineSorter",
    accent: "sky",
    tags: ["Local", "Private"],
  },
  {
    slug: "image-metadata-remover",
    name: "EXIF & GPS Metadata Remover",
    category: "Create",
    description: "Audit camera settings, capture timestamps, and GPS coordinates, and create a 100% stripped, clean local image.",
    kind: "imageMetadata",
    accent: "violet",
    tags: ["Local", "Private", "Popular", "Privacy"],
  },
  {
    slug: "pdf-visual-editor",
    name: "PDF Studio & Visual Editor",
    category: "Create",
    description: "Fill forms, add text, apply visual whiteout or true permanent raster redaction, annotate, rotate pages, and add watermarks in pure browser memory.",
    kind: "pdfEditor",
    accent: "lime",
    tags: ["Local", "Private", "PDF"],
  },
  {
    slug: "pdf-merge-split",
    name: "PDF Merge & Splitter",
    category: "Convert",
    description: "Combine multiple PDF documents into one or extract specific page ranges without server uploads.",
    kind: "pdfMergeSplit",
    accent: "sky",
    tags: ["Local", "Private", "PDF"],
  },
  {
    slug: "images-to-pdf",
    name: "Images to PDF Converter",
    category: "Convert",
    description: "Combine multiple JPG, PNG, and WebP images into a standardized A4 or Letter PDF document.",
    kind: "imagesToPdf",
    accent: "ember",
    tags: ["Local", "Private", "PDF"],
  },
  {
    slug: "excel-spreadsheet-studio",
    name: "Excel & Spreadsheet Studio",
    category: "Convert",
    description: "Inspect multi-sheet Excel (.xlsx, .xls) and CSV workbooks, remove duplicates, trim spaces, and convert to JSON/CSV/Table.",
    kind: "excelStudio",
    accent: "lime",
    tags: ["Local", "Private", "Excel"],
  },
  {
    slug: "word-docx-converter",
    name: "Word (.docx) Converter & Inspector",
    category: "Code & Text",
    description: "Parse DOCX files into clean Markdown or HTML, analyze reading telemetry, and generate formatted Word documents locally.",
    kind: "wordDocx",
    accent: "violet",
    tags: ["Local", "Private", "Word"],
  },
  {
    slug: "whatsapp-direct-chat",
    name: "WhatsApp Direct (No Save)",
    category: "Create",
    description: "Send WhatsApp messages without saving numbers to contacts. Pick country code, quick templates, and instant QR link.",
    kind: "whatsappDirect",
    accent: "ember",
    tags: ["Local", "Private", "Popular", "WhatsApp"],
  },
  {
    slug: "gst-tax-calculator",
    name: "GST & Business Tax Calculator",
    category: "Calculate",
    description: "Calculate GST (3%, 5%, 12%, 18%, 28%), CGST/SGST/IGST breakdown, Inclusive vs Exclusive, and print ready invoice receipt.",
    kind: "gstTax",
    accent: "lime",
    tags: ["Local", "Verified", "Popular", "Business"],
  },
  {
    slug: "passport-photo-resizer",
    name: "Govt Job & Passport Photo Resizer",
    category: "Create",
    description: "Resize & compress photos to exact KB limits (20KB–50KB photo, 10KB–20KB signature) for UPSC, SSC, Railways, and Govt forms.",
    kind: "passportPhoto",
    accent: "sky",
    tags: ["Local", "Private", "Popular", "Exams"],
  },
  {
    slug: "land-area-converter",
    name: "Land & Plot Area Converter",
    category: "Convert",
    description: "Convert plot and land measurements across Bigha, Marla, Kanal, Guntha, Square Gaj, Cent, Acre, and Sq Ft.",
    kind: "landArea",
    accent: "ember",
    tags: ["Local", "Verified", "Popular", "Property"],
  },
  {
    slug: "number-to-words-rupees",
    name: "Rupees to Words & Cheque Slip",
    category: "Convert",
    description: "Convert numbers to Indian numbering format (Lakhs & Crores) in words for bank cheques, slips, and invoices.",
    kind: "numberToWords",
    accent: "violet",
    tags: ["Local", "Verified", "Popular", "Banking"],
  },
  {
    slug: "json-to-zod-schema",
    name: "JSON to Zod & TypeScript Studio",
    category: "Code & Text",
    description: "Convert JSON into strongly-typed TypeScript interfaces and runtime Zod validation schemas with type inference.",
    kind: "jsonToZod",
    accent: "lime",
    tags: ["Local", "Verified", "Popular", "Developer"],
  },
  {
    slug: "tracking-url-cleaner",
    name: "Tracking URL & UTM Cleaner",
    category: "Convert",
    description: "Strip surveillance trackers, UTM campaign tags, fbclid, and referral tokens to generate clean, private direct URLs.",
    kind: "cleanUrl",
    accent: "sky",
    tags: ["Local", "Private", "Popular", "Privacy"],
  },
  {
    slug: "jwt-debugger",
    name: "JWT Debugger & Token Inspector",
    category: "Code & Text",
    description: "Decode and inspect JSON Web Tokens client-side. Audit headers, claims, expiration countdowns, and signatures with zero server exposure.",
    kind: "jwtDebugger",
    accent: "lime",
    tags: ["Local", "Private", "Popular", "Developer", "Security"],
  },
  {
    slug: "cron-schedule-expression",
    name: "Cron Schedule Visualizer & Humanizer",
    category: "Code & Text",
    description: "Translate 5-part cron expressions into natural English, calculate the next 8 execution timestamps, and configure schedules interactively.",
    kind: "cronSchedule",
    accent: "sky",
    tags: ["Local", "Verified", "Popular", "Developer"],
  },
  {
    slug: "regex-tester",
    name: "Regex Live Tester & Cheat Sheet",
    category: "Code & Text",
    description: "Real-time regular expression tester with live match highlights, capture groups breakdown, flag toggles, and substitution preview.",
    kind: "regexTester",
    accent: "ember",
    tags: ["Local", "Verified", "Popular", "Developer"],
  },
  {
    slug: "curl-to-code",
    name: "cURL to Code Converter",
    category: "Code & Text",
    description: "Convert terminal cURL commands into clean JavaScript Fetch, Axios, Python Requests, Go net/http, Node.js, and PHP cURL code client-side.",
    kind: "curlToCode",
    accent: "lime",
    tags: ["Local", "Verified", "Popular", "Developer"],
  },
];
