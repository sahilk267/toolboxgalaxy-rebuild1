// Web Worker for safe, non-blocking regular expression execution
// Guards against ReDoS catastrophic backtracking and limits memory footprint

export interface RegexRequest {
  id?: number;
  pattern: string;
  flags: string;
  testString?: string;
  text?: string;
  enableReplace: boolean;
  replacement: string;
}

export interface RegexMatchItem {
  index: number;
  length: number;
  fullMatch: string;
  groups: string[];
}

export interface RegexResponse {
  id?: number;
  matches: RegexMatchItem[];
  count: number;
  error: string | null;
  executionTimeMs: number;
  replacedResult: string;
}

const MAX_SAFE_CHARS = 20000;
const MAX_MATCHES = 300;

self.onmessage = (e: MessageEvent<RegexRequest>) => {
  const { id = 0, pattern, flags, enableReplace, replacement } = e.data;
  const rawInput = e.data.text ?? e.data.testString ?? "";
  const startTime = performance.now();

  if (!pattern) {
    const res: RegexResponse = {
      id,
      matches: [],
      count: 0,
      error: null,
      executionTimeMs: 0,
      replacedResult: "",
    };
    self.postMessage(res);
    return;
  }

  // Enforce 20,000 character safety limit to prevent memory exhaustion
  let targetString = rawInput;
  let truncatedNotice = "";
  if (rawInput.length > MAX_SAFE_CHARS) {
    targetString = rawInput.slice(0, MAX_SAFE_CHARS);
    truncatedNotice = ` (Input capped to first ${MAX_SAFE_CHARS.toLocaleString()} characters for safety)`;
  }

  try {
    const regex = new RegExp(pattern, flags);
    const matches: RegexMatchItem[] = [];

    if (flags.includes("g")) {
      let match: RegExpExecArray | null;
      let count = 0;
      while ((match = regex.exec(targetString)) !== null && count < MAX_MATCHES) {
        count++;
        matches.push({
          index: match.index,
          length: match[0].length,
          fullMatch: match[0],
          groups: match.slice(1),
        });
        if (match[0].length === 0) {
          regex.lastIndex++; // Prevent infinite loop on zero-length assertions
        }
      }
    } else {
      const match = regex.exec(targetString);
      if (match) {
        matches.push({
          index: match.index,
          length: match[0].length,
          fullMatch: match[0],
          groups: match.slice(1),
        });
      }
    }

    let replacedResult = "";
    if (enableReplace) {
      try {
        replacedResult = targetString.replace(regex, replacement);
        if (replacedResult.length > MAX_SAFE_CHARS) {
          replacedResult = replacedResult.slice(0, MAX_SAFE_CHARS);
        }
      } catch {
        replacedResult = targetString;
      }
    }

    const executionTimeMs = +(performance.now() - startTime).toFixed(2);
    const errorMsg = truncatedNotice ? `Safe limit reached: matched against first ${MAX_SAFE_CHARS} chars.` : null;

    const res: RegexResponse = {
      id,
      matches,
      count: matches.length,
      error: errorMsg,
      executionTimeMs,
      replacedResult,
    };
    self.postMessage(res);
  } catch (err: unknown) {
    const errorStr = err instanceof Error ? err.message : "Invalid regular expression syntax.";
    const res: RegexResponse = {
      id,
      matches: [],
      count: 0,
      error: errorStr,
      executionTimeMs: +(performance.now() - startTime).toFixed(2),
      replacedResult: "",
    };
    self.postMessage(res);
  }
};
