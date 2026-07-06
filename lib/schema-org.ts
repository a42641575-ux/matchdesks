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
