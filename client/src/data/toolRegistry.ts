// Orbital Workbench: typed registry for local-first, shared-hosting-safe tools.
// Tools data and definitions are maintained in @shared/toolsData for isomorphic access.
export * from "@shared/toolsData";
import { tools, ToolDefinition } from "@shared/toolsData";

export const categories = [
  "All",
  "Popular",
  "Calculate",
  "Convert",
  "Code & Text",
  "Create",
] as const;

export const getTool = (slug: string): ToolDefinition | undefined =>
  tools.find((tool) => tool.slug === slug);
