import { findToolBySlug } from "./seoCatalog";
import { findGameBySlug } from "./seoCatalog";

export interface BreadcrumbItem {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
}

export interface BreadcrumbListSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbItem[];
}

/**
 * Builds the Schema.org BreadcrumbList for any route.
 * Returns null if the route is home ('/') where breadcrumbs are not applicable.
 */
export function buildBreadcrumbJsonLd(pathname: string, baseUrl = "https://toolboxgalaxy.com"): BreadcrumbListSchema | null {
  const cleanPath = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  if (cleanPath === "/") {
    return null;
  }

  const items: BreadcrumbItem[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: baseUrl,
    },
  ];

  if (cleanPath.startsWith("/tools/")) {
    const slug = cleanPath.replace(/^\/tools\//, "").split("/")[0];
    const tool = findToolBySlug(slug);
    items.push({
      "@type": "ListItem",
      position: 2,
      name: "Tools Foundry",
      item: `${baseUrl}/tools`,
    });
    items.push({
      "@type": "ListItem",
      position: 3,
      name: tool ? tool.name : slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      item: `${baseUrl}/tools/${slug}`,
    });
  } else if (cleanPath === "/tools") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: "Tools Foundry",
      item: `${baseUrl}/tools`,
    });
  } else if (cleanPath.startsWith("/games/")) {
    const slug = cleanPath.replace(/^\/games\/(?:logic\/)?/, "").split("/")[0];
    const game = findGameBySlug(slug);
    items.push({
      "@type": "ListItem",
      position: 2,
      name: "Games Bay",
      item: `${baseUrl}/games`,
    });
    items.push({
      "@type": "ListItem",
      position: 3,
      name: game ? game.name : slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      item: `${baseUrl}/games/${slug}`,
    });
  } else if (cleanPath === "/games") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: "Games Bay",
      item: `${baseUrl}/games`,
    });
  } else if (cleanPath === "/studio" || cleanPath === "/document-studio" || cleanPath === "/pdf-studio") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: "PDF & Document Studio",
      item: `${baseUrl}/studio`,
    });
  } else if (cleanPath === "/privacy") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: "Privacy Policy",
      item: `${baseUrl}/privacy`,
    });
  } else if (cleanPath === "/terms") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: "Terms of Service",
      item: `${baseUrl}/terms`,
    });
  } else if (cleanPath === "/contact") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: "Contact Us",
      item: `${baseUrl}/contact`,
    });
  } else {
    // Generic fallback for any other top-level section
    const sectionName = cleanPath.slice(1).split("/")[0];
    const formatted = sectionName.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    items.push({
      "@type": "ListItem",
      position: 2,
      name: formatted,
      item: `${baseUrl}${cleanPath}`,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

/**
 * Generates an escaped <script type="application/ld+json"> tag for BreadcrumbList.
 */
export function renderBreadcrumbJsonLdScript(pathname: string, baseUrl = "https://toolboxgalaxy.com"): string | null {
  const schema = buildBreadcrumbJsonLd(pathname, baseUrl);
  if (!schema) return null;
  const jsonSafe = JSON.stringify(schema, null, 2).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">\n${jsonSafe}\n</script>`;
}
