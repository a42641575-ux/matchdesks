import { salaryPeriodSuffix } from './constants';

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Reverses a URL slug into a human-friendly title, e.g. "quebec-city" -> "Quebec City". */
export function deslugify(slug: string): string {
  return slug
    .split('-')
    .map((part) => (part.length ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

const hourlyCurrencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 2,
});

export function formatSalary(
  salaryMin: number | null | undefined,
  salaryMax: number | null | undefined,
  salaryPeriod: string | null | undefined,
  compensationText?: string | null,
): string {
  if (salaryMin == null && salaryMax == null) {
    return compensationText?.trim() || 'Compensation not disclosed';
  }

  const formatter = salaryPeriod === 'HOURLY' ? hourlyCurrencyFormatter : currencyFormatter;
  const suffix = salaryPeriodSuffix(salaryPeriod);

  if (salaryMin != null && salaryMax != null && salaryMin !== salaryMax) {
    return `${formatter.format(salaryMin)} \u2013 ${formatter.format(salaryMax)}${suffix}`;
  }

  const single = salaryMin ?? salaryMax;
  return `${formatter.format(single as number)}${suffix}`;
}

export function formatLocation(
  city: string | null | undefined,
  province: string | null | undefined,
  workArrangement: string,
): string {
  const parts = [city, province].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  return workArrangement === 'REMOTE' ? 'Remote (Canada)' : 'Canada';
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return 'Just posted';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`;
}

export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}
