import type { JobWithCompany } from './search';

const EMPLOYMENT_TYPE_SCHEMA_MAP: Record<string, string> = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACTOR',
  INTERNSHIP: 'INTERN',
};

const SALARY_UNIT_MAP: Record<string, string> = {
  HOURLY: 'HOUR',
  MONTHLY: 'MONTH',
  YEARLY: 'YEAR',
};

/** Builds a Google-for-Jobs-compatible JobPosting JSON-LD object. */
export function buildJobPostingJsonLd(job: JobWithCompany, siteUrl: string): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    identifier: {
      '@type': 'PropertyValue',
      name: job.company.name,
      value: job.id,
    },
    datePosted: job.postedAt.toISOString(),
    employmentType: EMPLOYMENT_TYPE_SCHEMA_MAP[job.employmentType] ?? job.employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company.name,
      ...(job.company.website ? { sameAs: job.company.website } : {}),
      ...(job.company.logoUrl ? { logo: job.company.logoUrl } : {}),
    },
    url: `${siteUrl}/jobs/${job.slug}`,
  };

  if (job.expiresAt) {
    jsonLd.validThrough = job.expiresAt.toISOString();
  }

  if (job.workArrangement === 'REMOTE') {
    jsonLd.jobLocationType = 'TELECOMMUTE';
    jsonLd.applicantLocationRequirements = {
      '@type': 'Country',
      name: 'Canada',
    };
  }

  if (job.city || job.province) {
    jsonLd.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(job.city ? { addressLocality: job.city } : {}),
        ...(job.province ? { addressRegion: job.province } : {}),
        addressCountry: 'CA',
      },
    };
  }

  if (job.salaryMin != null || job.salaryMax != null) {
    const min = job.salaryMin ?? job.salaryMax!;
    const max = job.salaryMax ?? job.salaryMin!;
    jsonLd.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.currency,
      value: {
        '@type': 'QuantitativeValue',
        minValue: min,
        maxValue: max,
        unitText: SALARY_UNIT_MAP[job.salaryPeriod ?? 'YEARLY'] ?? 'YEAR',
      },
    };
  }

  return jsonLd;
}

/** Organization schema (site-wide, injected in root layout). */
export function buildOrganizationLd(siteUrl: string, name: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    areaServed: { '@type': 'Country', name: 'Canada' },
  };
}

/** WebSite schema with a SearchAction (enables Google sitelinks search box). */
export function buildWebSiteLd(siteUrl: string, name: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/jobs?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** BreadcrumbList schema. items should be ordered root → current. */
export function buildBreadcrumbLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** FAQPage schema. Each entry becomes a rich-result FAQ pair. */
export function buildFaqLd(qas: { question: string; answer: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qas.map((qa) => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: { '@type': 'Answer', text: qa.answer },
    })),
  };
}

/** Article schema for blog/guide posts. */
export function buildArticleLd(input: {
  siteUrl: string;
  siteName: string;
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: `${input.siteUrl}/blog/${input.slug}`,
    datePublished: input.datePublished,
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    publisher: {
      '@type': 'Organization',
      name: input.siteName,
      logo: { '@type': 'ImageObject', url: `${input.siteUrl}/icon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${input.siteUrl}/blog/${input.slug}` },
  };
}
