import { ToolDefinition } from "./toolsData";

export interface ToolJsonLdSchema {
  "@context": "https://schema.org";
  "@type": "WebApplication";
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  browserRequirements: string;
  offers: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
  };
  creator?: {
    "@type": "Organization";
    name: string;
  };
}

/**
 * Maps each tool kind/category to standard Schema.org ApplicationCategory values.
 * Standard categories: UtilitiesApplication, DeveloperApplication, DesignApplication, FinanceApplication, HealthApplication.
 */
export function getToolApplicationCategory(tool: ToolDefinition): string {
  switch (tool.kind) {
    case "gstTax":
    case "loanEmi":
    case "discount":
    case "splitBill":
      return "FinanceApplication";
    case "bmi":
      return "HealthApplication";
    case "jwtDebugger":
    case "regexTester":
    case "cronSchedule":
    case "jsonToZod":
    case "curlToCode":
    case "json":
    case "jsonCsv":
    case "base64":
    case "hash":
    case "uuid":
    case "markdown":
    case "textDiff":
    case "lineSorter":
    case "findReplace":
    case "cleanUrl":
    case "url":
    case "html":
    case "csvViewer":
      return "DeveloperApplication";
    case "imageResize":
    case "imageTransform":
    case "imageMetadata":
    case "passportPhoto":
    case "color":
    case "gradient":
    case "contrast":
    case "qr":
    case "favicon":
    case "pdfEditor":
    case "pdfMergeSplit":
    case "imagesToPdf":
    case "excelStudio":
    case "wordDocx":
      return "DesignApplication";
    case "password":
    case "passwordAudit":
      return "SecurityApplication";
    default:
      break;
  }

  // Fallback based on broader UI category
  switch (tool.category) {
    case "Code & Text":
      return "DeveloperApplication";
    case "Create":
      return "DesignApplication";
    case "Calculate":
      return "UtilitiesApplication";
    case "Convert":
    default:
      return "UtilitiesApplication";
  }
}

/**
 * Builds the typed Schema.org WebApplication structured data object for a given tool.
 */
export function buildToolJsonLd(tool: ToolDefinition, baseUrl = "https://toolboxgalaxy.com"): ToolJsonLdSchema {
  const canonicalUrl = `${baseUrl}/tools/${tool.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    url: canonicalUrl,
    applicationCategory: getToolApplicationCategory(tool),
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "Aaditech Solution",
    },
  };
}

/**
 * Generates a safe <script type="application/ld+json"> tag for injecting into HTML.
 * All characters are safely JSON-stringified and escaped against XSS or HTML breakout.
 */
export function renderToolJsonLdScript(tool: ToolDefinition, baseUrl = "https://toolboxgalaxy.com"): string {
  const data = buildToolJsonLd(tool, baseUrl);
  // Safely serialize JSON and escape `<` as `\u003c` to avoid closing </script> injection risks
  const jsonSafe = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">\n${jsonSafe}\n</script>`;
}
