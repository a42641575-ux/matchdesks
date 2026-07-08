import 'dotenv/config';
import fs from 'node:fs';
import { parse } from 'csv-parse';
import { Prisma, type EmploymentType, type Province, type SalaryPeriod, type WorkArrangement } from '@prisma/client';
import { prisma } from '../lib/db';
import { slugify } from '../lib/format';
import { generateJobRef } from '../lib/job-ref';

// Generic CSV importer for high-quality, employer-sourced job postings.
//
// Accepts the standardized feed shape (see the worker prompt that generated
// matchdesks-jobs-YYYYMMDD.csv). Each row must have: title, companyName,
// description (50+ words), category (valid), employmentType (valid),
// workArrangement (valid), city, province (2-letter code), and at least one
// of applyUrl / applyEmail. sourceUrl is the dedupe key.
//
//   npm run import:csv -- /path/to/matchdesks-jobs-YYYYMMDD.csv
//
// Each imported job is FEED-sourced, canonical-to-us (earns Google for Jobs
// equity), with the description HTML-stripped to clean text. Re-runs are
// idempotent — rows with an existing sourceUrl are skipped.

const VALID_CATEGORIES = new Set([
  'technology', 'healthcare', 'skilled-trades', 'sales', 'customer-service',
  'finance-accounting', 'marketing', 'administrative', 'hospitality-food-service',
  'education', 'warehouse-logistics', 'engineering',
]);
const VALID_EMPLOYMENT: Set<EmploymentType> = new Set(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']);
const VALID_ARRANGEMENT: Set<WorkArrangement> = new Set(['ONSITE', 'HYBRID', 'REMOTE']);
const VALID_PROVINCES: Set<Province> = new Set(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']);

interface CsvRow {
  title: string;
  companyName: string;
  companyWebsite?: string;
  description: string;
  category: string;
  employmentType: EmploymentType;
  workArrangement: WorkArrangement;
  city: string;
  province: Province;
  salaryMin?: string;
  salaryMax?: string;
  salaryPeriod?: SalaryPeriod | '';
  applyUrl?: string;
  applyEmail?: string;
  sourceUrl: string;
}

// Strip HTML tags to clean text and collapse whitespace. The job page renders
// descriptions as whitespace-pre-line text, so raw HTML tags would show
// literally — stripping keeps the display clean and the JSON-LD valid.
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function validate(row: CsvRow): string[] {
  const errs: string[] = [];
  if (!row.title?.trim()) errs.push('missing title');
  if (!row.companyName?.trim()) errs.push('missing companyName');
  if (!row.description?.trim() || row.description.trim().split(/\s+/).length < 50) errs.push('description too short (<50 words)');
  if (!VALID_CATEGORIES.has(row.category)) errs.push(`invalid category "${row.category}"`);
  if (!VALID_EMPLOYMENT.has(row.employmentType)) errs.push(`invalid employmentType "${row.employmentType}"`);
  if (!VALID_ARRANGEMENT.has(row.workArrangement)) errs.push(`invalid workArrangement "${row.workArrangement}"`);
  if (!row.city?.trim()) errs.push('missing city');
  if (!VALID_PROVINCES.has(row.province)) errs.push(`invalid province "${row.province}"`);
  if (!row.sourceUrl?.trim()) errs.push('missing sourceUrl (dedupe key)');
  if (!row.applyUrl?.trim() && !row.applyEmail?.trim()) errs.push('must have applyUrl or applyEmail');
  return errs;
}

function parseSalary(raw: string | undefined): number | null {
  if (!raw || !raw.trim()) return null;
  const n = Number(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

async function main(): Promise<void> {
  const csvPath = process.argv[2];
  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error('Usage: npm run import:csv -- /path/to/matchdesks-jobs-YYYYMMDD.csv');
    process.exit(1);
  }

  console.log(`Importing CSV: ${csvPath}`);

  let created = 0;
  let skippedDup = 0;
  let skippedInvalid = 0;
  let lineNum = 1;

  const parser = fs.createReadStream(csvPath).pipe(
    parse({ columns: true, trim: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true }),
  );

  for await (const raw of parser) {
    lineNum++;
    const row = raw as CsvRow;
    const errs = validate(row);
    if (errs.length > 0) {
      skippedInvalid++;
      console.warn(`  ⚠ line ${lineNum} skipped: ${errs.join('; ')}`);
      continue;
    }

    // Dedupe by sourceUrl.
    const dup = await prisma.job.findFirst({ where: { feedSourceUrl: row.sourceUrl }, select: { id: true } });
    if (dup) {
      skippedDup++;
      continue;
    }

    // Company: create or reuse by slug.
    const companySlug = slugify(row.companyName);
    let company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: row.companyName.trim().slice(0, 120),
          slug: companySlug,
          website: row.companyWebsite?.trim() || null,
          city: row.city.trim() || null,
          province: row.province,
        },
      });
    }

    // Job slug: title + company, with collision suffix.
    const baseSlug = slugify(`${row.title}-${row.companyName}`);
    let jobSlug = baseSlug;
    let counter = 2;
    while (await prisma.job.findUnique({ where: { slug: jobSlug }, select: { id: true } })) {
      jobSlug = `${baseSlug}-${counter++}`;
    }

    const description = stripHtml(row.description);
    const publicRef = await generateJobRef();
    const postedAt = new Date();
    const expiresAt = new Date(postedAt);
    expiresAt.setDate(expiresAt.getDate() + 30);

    const salaryMin = parseSalary(row.salaryMin);
    let salaryMax = parseSalary(row.salaryMax);
    if (salaryMax != null && salaryMin != null && salaryMax < salaryMin) salaryMax = salaryMin;

    const data: Prisma.JobCreateInput = {
      title: row.title.trim().slice(0, 120),
      slug: jobSlug,
      publicRef,
      postedByEmail: null,
      description,
      company: { connect: { id: company.id } },
      category: row.category,
      employmentType: row.employmentType,
      workArrangement: row.workArrangement,
      city: row.city.trim(),
      province: row.province,
      streetAddress: null,
      postalCode: null,
      salaryMin,
      salaryMax,
      salaryPeriod: (row.salaryPeriod || null) as SalaryPeriod | null,
      applyUrl: row.applyUrl?.trim() || null,
      applyEmail: row.applyEmail?.trim() || null,
      source: 'FEED',
      feedSourceUrl: row.sourceUrl,
      canonicalUrl: null, // canonical-to-us (earns Google for Jobs equity)
      status: 'ACTIVE',
      postedAt,
      expiresAt,
    };

    await prisma.job.create({ data });
    created++;
    if (created % 25 === 0) console.log(`  created ${created}...`);
  }

  console.log('');
  console.log(`Import complete.`);
  console.log(`  created:        ${created}`);
  console.log(`  skipped (dup):  ${skippedDup}`);
  console.log(`  skipped (bad):  ${skippedInvalid}`);
}

main()
  .catch((e) => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
