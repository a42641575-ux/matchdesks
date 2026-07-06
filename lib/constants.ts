import type { EmploymentType, Province, SalaryPeriod, WorkArrangement } from '@prisma/client';

export const SITE_NAME = 'MatchDesks';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://matchdesks.com';
export const SITE_TAGLINE = 'Canadian jobs, coast to coast.';

export interface Category {
  slug: string;
  label: string;
}

export const CATEGORIES: Category[] = [
  { slug: 'technology', label: 'Technology' },
  { slug: 'healthcare', label: 'Healthcare' },
  { slug: 'skilled-trades', label: 'Skilled Trades' },
  { slug: 'sales', label: 'Sales' },
  { slug: 'customer-service', label: 'Customer Service' },
  { slug: 'finance-accounting', label: 'Finance & Accounting' },
  { slug: 'marketing', label: 'Marketing' },
  { slug: 'administrative', label: 'Administrative' },
  { slug: 'hospitality-food-service', label: 'Hospitality & Food Service' },
  { slug: 'education', label: 'Education' },
  { slug: 'warehouse-logistics', label: 'Warehouse & Logistics' },
  { slug: 'engineering', label: 'Engineering' },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [string, ...string[]];

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export const PROVINCES: { code: Province; name: string }[] = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

export function provinceName(code: string | null | undefined): string {
  return PROVINCES.find((p) => p.code === code)?.name ?? code ?? '';
}

export const PROVINCE_CODES = PROVINCES.map((p) => p.code) as [Province, ...Province[]];

export const MAJOR_CITIES: { city: string; province: Province }[] = [
  { city: 'Toronto', province: 'ON' },
  { city: 'Ottawa', province: 'ON' },
  { city: 'Mississauga', province: 'ON' },
  { city: 'Hamilton', province: 'ON' },
  { city: 'Vancouver', province: 'BC' },
  { city: 'Surrey', province: 'BC' },
  { city: 'Victoria', province: 'BC' },
  { city: 'Montreal', province: 'QC' },
  { city: 'Quebec City', province: 'QC' },
  { city: 'Calgary', province: 'AB' },
  { city: 'Edmonton', province: 'AB' },
  { city: 'Winnipeg', province: 'MB' },
  { city: 'Halifax', province: 'NS' },
  { city: 'Saskatoon', province: 'SK' },
  { city: 'Regina', province: 'SK' },
];

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

export function employmentTypeLabel(value: string): string {
  return EMPLOYMENT_TYPES.find((e) => e.value === value)?.label ?? value;
}

export const WORK_ARRANGEMENTS: { value: WorkArrangement; label: string }[] = [
  { value: 'ONSITE', label: 'On-site' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'REMOTE', label: 'Remote' },
];

export function workArrangementLabel(value: string): string {
  return WORK_ARRANGEMENTS.find((w) => w.value === value)?.label ?? value;
}

export const SALARY_PERIODS: { value: SalaryPeriod; label: string; suffix: string }[] = [
  { value: 'HOURLY', label: 'Per hour', suffix: '/hr' },
  { value: 'MONTHLY', label: 'Per month', suffix: '/mo' },
  { value: 'YEARLY', label: 'Per year', suffix: '/yr' },
];

export function salaryPeriodSuffix(value: string | null | undefined): string {
  return SALARY_PERIODS.find((s) => s.value === value)?.suffix ?? '';
}

export const FRAUD_REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'SCAM_OR_PHISHING', label: 'Scam or phishing attempt' },
  { value: 'FAKE_COMPANY', label: 'Fake or impersonated company' },
  { value: 'PYRAMID_OR_MLM', label: 'Pyramid scheme or MLM' },
  { value: 'DISCRIMINATORY', label: 'Discriminatory requirements' },
  { value: 'ALREADY_FILLED', label: 'Position already filled' },
  { value: 'DUPLICATE_POSTING', label: 'Duplicate posting' },
  { value: 'OTHER', label: 'Other' },
];

export const DATE_POSTED_FILTERS: { value: string; label: string; days: number }[] = [
  { value: '1', label: 'Last 24 hours', days: 1 },
  { value: '3', label: 'Last 3 days', days: 3 },
  { value: '7', label: 'Last week', days: 7 },
  { value: '30', label: 'Last month', days: 30 },
];

export const JOBS_PAGE_SIZE = 12;
