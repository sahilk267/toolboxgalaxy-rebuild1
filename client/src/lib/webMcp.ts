/**
 * WebMCP (Model Context Protocol in Browser) Registration
 * Complies with browser agent specifications by registering tools via navigator.modelContext.registerTool()
 * and annotating DOM elements with toolname and tooldescription attributes.
 */
import { tools } from "@/data/toolRegistry";

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
  execute: (params: any) => Promise<any> | any;
}

export function registerBrowserTools(): void {
  if (typeof window === "undefined") return;

  // Ensure window/navigator.modelContext object exists
  const nav = navigator as any;
  const win = window as any;

  const toolRegistry = new Map<string, WebMcpTool>();

  if (!nav.modelContext) {
    nav.modelContext = {
      tools: toolRegistry,
      registerTool(tool: WebMcpTool) {
        toolRegistry.set(tool.name, tool);
        win.dispatchEvent(new CustomEvent("webmcp:tool-registered", { detail: tool }));
        return true;
      },
      getTools() {
        return Array.from(toolRegistry.values());
      },
    };
  }

  // Also expose on window.modelContext for agents inspecting global scope
  win.modelContext = nav.modelContext;

  // 1. Tool: search_tools
  nav.modelContext.registerTool({
    name: "search_tools",
    description: "Search 120+ privacy-first in-browser developer utilities and daily logic puzzles by query or category.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query keywords (e.g. 'pdf', 'json', 'wordle', 'jwt')" },
      },
      required: ["query"],
    },
    execute: async ({ query }: { query: string }) => {
      const q = (query || "").toLowerCase().trim();
      const matches = tools
        .filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q)))
        .slice(0, 10)
        .map((t) => ({
          name: t.name,
          slug: t.slug,
          url: `https://toolboxgalaxy.com/tools/${t.slug}`,
          category: t.category,
          description: t.description,
        }));
      return { count: matches.length, results: matches };
    },
  });

  // 2. Tool: clean_tracking_url
  nav.modelContext.registerTool({
    name: "clean_tracking_url",
    description: "Strip tracking query parameters (UTM, fbclid, gclid, etc.) from a given URL.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to sanitize" },
      },
      required: ["url"],
    },
    execute: async ({ url }: { url: string }) => {
      try {
        const parsed = new URL(url);
        const trackingKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "msclkid", "mc_eid", "ref", "source"];
        for (const key of trackingKeys) {
          parsed.searchParams.delete(key);
        }
        return { cleanUrl: parsed.toString() };
      } catch (err: any) {
        return { error: err.message || "Invalid URL" };
      }
    },
  });

  // 3. Tool: format_json
  nav.modelContext.registerTool({
    name: "format_json",
    description: "Format, validate, or minify JSON data in local memory.",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string", description: "JSON string to format" },
        indent: { type: "number", description: "Indentation spaces (default: 2)" },
      },
      required: ["input"],
    },
    execute: async ({ input, indent = 2 }: { input: string; indent?: number }) => {
      try {
        const parsed = JSON.parse(input);
        return { valid: true, formatted: JSON.stringify(parsed, null, indent) };
      } catch (err: any) {
        return { valid: false, error: err.message };
      }
    },
  });

  // 4. Tool: convert_timestamp
  nav.modelContext.registerTool({
    name: "convert_timestamp",
    description: "Convert a Unix epoch timestamp (seconds or milliseconds) into ISO 8601 string and human date.",
    inputSchema: {
      type: "object",
      properties: {
        timestamp: { type: "number", description: "Unix timestamp in seconds or milliseconds" },
      },
      required: ["timestamp"],
    },
    execute: async ({ timestamp }: { timestamp: number }) => {
      const ms = timestamp < 1e11 ? timestamp * 1000 : timestamp;
      const date = new Date(ms);
      return {
        iso: date.toISOString(),
        utc: date.toUTCString(),
        unixSeconds: Math.floor(ms / 1000),
      };
    },
  });

  console.log(`[WebMCP] 4 tools successfully registered on navigator.modelContext`);
}
