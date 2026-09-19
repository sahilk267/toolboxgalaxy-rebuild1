import { GuideDefinition } from "./guidesData";

export interface GuideArticleJsonLd {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description: string;
  url: string;
  inLanguage: string;
  datePublished: string;
  dateModified: string;
  author: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    url: string;
    logo?: {
      "@type": "ImageObject";
      url: string;
    };
  };
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  keywords?: string;
  articleSection?: string;
}

export interface GuideFaqPageJsonLd {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

/**
 * Builds Schema.org Article structured data for a guide.
 */
export function buildGuideJsonLd(guide: GuideDefinition, baseUrl = "https://toolboxgalaxy.com"): GuideArticleJsonLd {
  const canonicalUrl = `${baseUrl}/guides/${guide.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.metaDescription,
    url: canonicalUrl,
    inLanguage: "en",
    datePublished: guide.publishedDate,
    dateModified: guide.updatedDate,
    author: {
      "@type": "Organization",
      name: "Toolbox Galaxy Engineering",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Aaditech Solution",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/orbit-mark.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    keywords: guide.tags.join(", "),
    articleSection: guide.category,
  };
}

/**
 * Builds Schema.org FAQPage structured data if the guide has FAQs.
 */
export function buildGuideFaqJsonLd(guide: GuideDefinition): GuideFaqPageJsonLd | null {
  if (!guide.faqs || guide.faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Renders safe <script type="application/ld+json"> tag for injecting into head.
 */
export function renderGuideJsonLdScript(guide: GuideDefinition, baseUrl = "https://toolboxgalaxy.com"): string {
  const articleLd = buildGuideJsonLd(guide, baseUrl);
  const faqLd = buildGuideFaqJsonLd(guide);

  const schemas: any[] = [articleLd];
  if (faqLd) schemas.push(faqLd);

  const jsonSafe = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas, null, 2).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">\n${jsonSafe}\n</script>`;
}
