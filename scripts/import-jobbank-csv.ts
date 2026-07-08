import 'dotenv/config';
import fs from 'node:fs';
import readline from 'node:readline';
import { Prisma, type EmploymentType, type Province, type SalaryPeriod, type WorkArrangement } from '@prisma/client';
import { prisma } from '../lib/db';
import { slugify } from '../lib/format';
import { generateJobRef } from '../lib/job-ref';

// Job Bank Open Government CSV importer.
//
// Parses the monthly Job Bank OGD dump (Open Government Licence – Canada) and
// imports job postings as FEED-sourced, canonical-to-MatchDesks listings.
// ~50,000 postings per monthly file. Run manually whenever a new monthly file
// is published:
//
//   npm run import:jobbank -- /path/to/job-bank-open-data-all-job-postings-en-may2026.csv
//
// File format (verified against the may2026 English file):
//   - Encoding: UTF-16 LE (must decode before parsing)
//   - Delimiter: TAB (\t)
//   - 65 columns, ~50k rows
//   - "NA" string = null marker
//   - Province is the full name ("Alberta"), not the code
//   - Salary Per ∈ {Hour, Year, Month, Day, Bi-weekly, Week}
//   - WIC Job Location Snapshot ID is unique per row (dedupe key)
//
// Legal: Open Government Licence – Canada. Attribution is appended to each
// imported job's description. Canonical is set to NULL (canonical-to-us) per
// the post-2026-07-08 strategy — imported jobs earn Google for Jobs equity on
// the MatchDesks domain.

// --- Value maps ---

const PROVINCE_MAP: Record<string, Province> = {
  Alberta: 'AB',
  'British Columbia': 'BC',
  Manitoba: 'MB',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Nova Scotia': 'NS',
  'Northwest Territories': 'NT',
  Nunavut: 'NU',
  Ontario: 'ON',
  'Prince Edward Island': 'PE',
  Québec: 'QC',
  Quebec: 'QC',
  Saskatchewan: 'SK',
  Yukon: 'YT',
};

function mapProvince(raw: string): Province | null {
  const code = PROVINCE_MAP[raw];
  return code ?? null;
}

function mapEmploymentType(raw: string): EmploymentType {
  const r = raw.toLowerCase();
  if (r.includes('full')) return 'FULL_TIME';
  if (r.includes('part') && r.includes('leading')) return 'FULL_TIME'; // part→full = treat as full
  if (r.includes('part')) return 'PART_TIME';
  if (r.includes('contract') || r.includes('temporary') || r.includes('term')) return 'CONTRACT';
  if (r.includes('intern') || r.includes('student') || r.includes('apprentice')) return 'INTERNSHIP';
  if (r.includes('seasonal')) return 'CONTRACT';
  return 'FULL_TIME'; // safe default
}

function mapSalaryPeriod(raw: string): SalaryPeriod | null {
  switch (raw.toLowerCase()) {
    case 'hour':
    case 'hourly':
      return 'HOURLY';
    case 'year':
    case 'yearly':
    case 'annual':
      return 'YEARLY';
    case 'month':
    case 'monthly':
      return 'MONTHLY';
    default:
      return null; // day/week/bi-weekly — normalize to yearly in toYearly()
  }
}

// Convert a salary amount to a yearly equivalent for the Day/Week/Bi-weekly cases
// where we don't have a native SalaryPeriod. Used only when mapSalaryPeriod returns null.
function toYearly(amount: number, per: string): number {
  switch (per.toLowerCase()) {
    case 'day':
      return Math.round(amount * 260); // ~5 days/wk × 52 wks
    case 'week':
      return Math.round(amount * 52);
    case 'bi-weekly':
    case 'biweekly':
      return Math.round(amount * 26);
    case 'month':
    case 'monthly':
      return Math.round(amount * 12);
    default:
      return amount;
  }
}

// Map a NOC21 code name to one of the 12 fixed MatchDesks categories.
// Keyword-based heuristic. Falls back to 'administrative' if nothing matches.
const NOC_CATEGORY_RULES: { test: RegExp; category: string }[] = [
  { test: /software|web developer|programmer|data scientist|it|computer|cybersecurity|network|database|systems|devop|cloud|developer/i, category: 'technology' },
  { test: /nurse|medical|health|physician|care|dental|pharmac|therap|clinical|patient|surgeon|psychiatr|labourer.*health|aide|orderly/i, category: 'healthcare' },
  { test: /welder|electrician|carpenter|plumber|construct|mechanic|machinist|operator|trades|technician.*repair|mason|painter|roofer|heavy equipment/i, category: 'skilled-trades' },
  { test: /sales|merchandis|retail|cashier|account executive|representative.*sales/i, category: 'sales' },
  { test: /customer service|information service|call centre|call center|support agent/i, category: 'customer-service' },
  { test: /accountant|bookkeep|audit|financial|payroll|tax|banking|insurance.*agent/i, category: 'finance-accounting' },
  { test: /marketing|seo|content|social media|advertis|brand|communications|public relations/i, category: 'marketing' },
  { test: /administrative assistant|administrative officer|receptionist|secretary|office admin|data entry|clerk|office support/i, category: 'administrative' },
  { test: /cook|chef|food|restaurant|kitchen|bartender|barista|waiter|server|hospitality|hotel|housekeeping|cleaner|catering/i, category: 'hospitality-food-service' },
  { test: /teacher|instructor|professor|educator|tutor|early childhood|teaching|curriculum|academic/i, category: 'education' },
  { test: /warehouse|forklift|shipper|receiver|inventory|material handler|logistics|dispatch|delivery|truck driver|transport|shipping/i, category: 'warehouse-logistics' },
  { test: /engineer|civil|mechanical engineer|electrical engineer|chemical engineer|industrial engineer|architect|surveyor|estimator/i, category: 'engineering' },
];

function inferCategory(jobTitle: string, nocName: string): string {
  const blob = `${jobTitle} ${nocName}`;
  for (const rule of NOC_CATEGORY_RULES) {
    if (rule.test.test(blob)) return rule.category;
  }
  return 'administrative'; // safe fallback
}

function mapWorkArrangement(telework: string): WorkArrangement {
  const r = telework.toLowerCase().trim();
  if (r === 'yes' || r === 'oui') return 'REMOTE';
  if (r === 'hybrid' || r === 'hybride') return 'HYBRID';
  return 'ONSITE';
}

// --- CSV parsing ---

function clean(v: string | undefined): string | null {
  if (v == null) return null;
  const trimmed = v.trim();
  if (!trimmed || trimmed === 'NA') return null;
  return trimmed;
}

interface JobBankRow {
  wicId: string;
  title: string;
  nocName: string | null;
  province: Province | null;
  city: string | null;
  postalCode: string | null;
  employmentType: EmploymentType;
  workArrangement: WorkArrangement;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: SalaryPeriod | null;
  vacancyCount: number;
  firstPosted: Date | null;
}

function mapRow(raw: Record<string, string>): JobBankRow | null {
  const wicId = clean(raw['WIC Job Location Snapshot ID']);
  const title = clean(raw['Job Title']) ?? clean(raw['Original Job Title']);
  if (!wicId || !title) return null;

  const provinceRaw = clean(raw['Province/Territory']);
  const province = provinceRaw ? mapProvince(provinceRaw) : null;

  const salaryPerRaw = clean(raw['Salary Per']) ?? '';
  const salaryPeriod = mapSalaryPeriod(salaryPerRaw);
  const salMinRaw = clean(raw['Salary Minimum']);
  const salMaxRaw = clean(raw['Salary Maximum']);

  let salaryMin: number | null = salMinRaw ? Number(salMinRaw) : null;
  let salaryMax: number | null = salMaxRaw ? Number(salMaxRaw) : null;
  if (Number.isNaN(salaryMin as number)) salaryMin = null;
  if (Number.isNaN(salaryMax as number)) salaryMax = null;

  // If SalaryPeriod is null (day/week/bi-weekly), normalize to YEARLY.
  if (!salaryPeriod && salaryMin != null && salaryPerRaw) {
    salaryMin = toYearly(salaryMin, salaryPerRaw);
    salaryMax = salaryMax != null ? toYearly(salaryMax, salaryPerRaw) : null;
  }

  const vacancyRaw = clean(raw['Vacancy Count']);
  const vacancyCount = vacancyRaw ? Math.max(1, Number(vacancyRaw) || 1) : 1;

  const firstPostedRaw = clean(raw['First Posting Date']);
  let firstPosted: Date | null = null;
  if (firstPostedRaw) {
    const d = new Date(firstPostedRaw.replace(/\//g, '-'));
    firstPosted = Number.isNaN(d.getTime()) ? null : d;
  }

  return {
    wicId,
    title,
    nocName: clean(raw['NOC21 Code Name']),
    province,
    city: clean(raw['City']),
    postalCode: clean(raw['Work Location Postal Code']),
    employmentType: mapEmploymentType(clean(raw['Employment Type']) ?? 'Full time'),
    workArrangement: mapWorkArrangement(clean(raw['Employment Term Telework']) ?? 'NA'),
    salaryMin,
    salaryMax,
    salaryPeriod: salaryPeriod ?? (salaryMin != null ? 'YEARLY' : null),
    vacancyCount,
    firstPosted,
  };
}

// Synthesize a description from the available fields (the CSV has no description column).
function buildDescription(row: JobBankRow): string {
  const lines: string[] = [];
  lines.push(`Position: ${row.title}`);
  if (row.nocName) lines.push(`Occupation: ${row.nocName}`);
  const locParts = [row.city, row.province].filter(Boolean);
  if (locParts.length) lines.push(`Location: ${locParts.join(', ')}`);
  lines.push(`Employment: ${row.employmentType.replace('_', ' ').toLowerCase()}${row.workArrangement !== 'ONSITE' ? ` (${row.workArrangement.toLowerCase()})` : ''}`);
  if (row.vacancyCount > 1) lines.push(`Openings: ${row.vacancyCount}`);

  if (row.salaryMin != null) {
    const fmt = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format;
    const periodSuffix = row.salaryPeriod === 'HOURLY' ? '/hr' : row.salaryPeriod === 'MONTHLY' ? '/mo' : '/yr';
    if (row.salaryMax != null && row.salaryMax !== row.salaryMin) {
      lines.push(`Salary: ${fmt(row.salaryMin)} – ${fmt(row.salaryMax)}${periodSuffix}`);
    } else {
      lines.push(`Salary: ${fmt(row.salaryMin)}${periodSuffix}`);
    }
  }

  lines.push('');
  lines.push('This listing was sourced from the Government of Canada Job Bank open data and republished under the Open Government Licence – Canada.');
  return lines.join('\n');
}

// --- Main import loop ---

async function main(): Promise<void> {
  const csvPath = process.argv[2];
  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error('Usage: npm run import:jobbank -- /path/to/job-bank-open-data-all-job-postings-en-XXXX.csv');
    process.exit(1);
  }

  console.log(`Importing Job Bank CSV: ${csvPath}`);

  // The Job Bank CSV is UTF-16 LE encoded. Decode to UTF-8 via TextDecoder,
  // then parse tab-separated rows. We read the whole file into memory and
  // decode in one pass (the largest files are ~50MB raw / ~25MB UTF-8).
  const buf = fs.readFileSync(csvPath);
  const utf8 = new TextDecoder('utf-16le').decode(buf);
  const lines = utf8.split(/\r?\n/);

  let headers: string[] | null = null;
  let created = 0;
  let skippedDup = 0;
  let skippedInvalid = 0;
  let processed = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split('\t');
    if (!headers) {
      headers = cols;
      continue;
    }
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => (raw[h] = cols[i] ?? ''));
    const row = mapRow(raw);
    if (!row) {
      skippedInvalid++;
      continue;
    }

    processed++;
    if (processed % 5000 === 0) console.log(`  processed ${processed}...`);

    // Dedupe by feedSourceUrl = the Job Bank posting URL derived from WIC ID.
    const feedSourceUrl = `https://www.jobbank.gc.ca/jobsearch/jobsearch/${row.wicId}`;
    const dup = await prisma.job.findFirst({ where: { feedSourceUrl }, select: { id: true } });
    if (dup) {
      skippedDup++;
      continue;
    }

    const category = inferCategory(row.title, row.nocName ?? '');
    const companyName = 'Government of Canada Job Bank'; // CSV has no employer field
    const companySlug = slugify(companyName);
    let company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) {
      company = await prisma.company.create({
        data: { name: companyName, slug: companySlug },
      });
    }

    const baseSlug = slugify(`${row.title}-${row.wicId}`);
    let jobSlug = baseSlug;
    let counter = 2;
    while (await prisma.job.findUnique({ where: { slug: jobSlug }, select: { id: true } })) {
      jobSlug = `${baseSlug}-${counter++}`;
    }

    const description = buildDescription(row);
    const publicRef = await generateJobRef();
    const postedAt = row.firstPosted ?? new Date();
    const expiresAt = new Date(postedAt);
    expiresAt.setDate(expiresAt.getDate() + 30);

    const data: Prisma.JobCreateInput = {
      title: row.title.slice(0, 120),
      slug: jobSlug,
      publicRef,
      postedByEmail: null,
      description,
      company: { connect: { id: company.id } },
      category,
      employmentType: row.employmentType,
      workArrangement: row.workArrangement,
      city: row.city,
      province: row.province,
      streetAddress: null,
      postalCode: row.postalCode,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      salaryPeriod: row.salaryPeriod,
      applyUrl: feedSourceUrl,
      applyEmail: null,
      source: 'FEED',
      feedSourceUrl,
      canonicalUrl: null, // canonical-to-us (earns Google for Jobs equity)
      status: 'ACTIVE',
      postedAt,
      expiresAt,
    };

    await prisma.job.create({ data });
    created++;
  }

  console.log('');
  console.log(`Import complete.`);
  console.log(`  created:        ${created}`);
  console.log(`  skipped (dup):  ${skippedDup}`);
  console.log(`  skipped (bad):  ${skippedInvalid}`);
  console.log(`  total rows:     ${processed + skippedInvalid}`);
}

main()
  .catch((e) => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
