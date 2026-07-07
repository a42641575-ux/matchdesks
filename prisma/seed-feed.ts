import 'dotenv/config';
import { Prisma, type EmploymentType, type Province, type SalaryPeriod, type WorkArrangement } from '@prisma/client';
import { prisma } from '../lib/db';
import { slugify } from '../lib/format';

// Feed seeding: ingest jobs from a TOS-permissive JSON feed you configure via
// JOB_FEED_URL. Each item maps to a Job with source=FEED, a canonical URL
// pointing at the ORIGINAL posting (so Google attributes content to the source
// and we avoid duplicate-content penalties), and an attribution line appended.
//
// IMPORTANT (verified 2026-07-07):
//   - Job Bank has NO real-time API/RSS. Scraping jobbank.gc.ca is prohibited
//     by their Terms of Use (no bots/crawlers). Do NOT scrape Job Bank.
//   - The only legal Job Bank source is the monthly Open Government CSV dump
//     (Open Government Licence – Canada, ~1 month stale, requires attribution).
//   - Republishing feed jobs with canonical-to-source yields UX (more listings
//     on site) but LITTLE SEO: the canonical passes equity to the source, so
//     those pages won't earn Google rankings or Google for Jobs for us.
//   - The strongest FREE supply strategy is native employer outreach (emails
//     to Canadian SMBs / career centres) so jobs are posted directly on
//     MatchDesks — those are canonical-to-us, fresh, and earn full SEO +
//     Google for Jobs. Treat feed seeding as a secondary, UX-only supplement.
//
// Expected feed shape (JSON array):
//   { title, companyName, companyWebsite?, description, category,
//     employmentType, workArrangement, city?, province?, salaryMin?,
//     salaryMax?, salaryPeriod?, applyUrl?, applyEmail?, feedSourceUrl }
// Run: npx tsx prisma/seed-feed.ts

interface FeedJob {
  title: string;
  companyName: string;
  companyWebsite?: string | null;
  description: string;
  category: string;
  employmentType: EmploymentType;
  workArrangement: WorkArrangement;
  city?: string | null;
  province?: Province | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryPeriod?: SalaryPeriod | null;
  applyUrl?: string | null;
  applyEmail?: string | null;
  feedSourceUrl: string;
}

async function main(): Promise<void> {
  const feedUrl = process.env.JOB_FEED_URL;
  if (!feedUrl) {
    console.log('JOB_FEED_URL not set — skipping feed seeding.');
    console.log('To enable: set JOB_FEED_URL to a TOS-permissive JSON feed (see script header for shape + legal notes).');
    console.log('Recommended primary supply strategy: native employer outreach (free) — canonical-to-us, fresh, full SEO.');
    return;
  }

  const res = await fetch(feedUrl);
  if (!res.ok) throw new Error(`Failed to fetch feed (${res.status} ${res.statusText})`);
  const items = (await res.json()) as FeedJob[];

  let created = 0;
  let skipped = 0;

  for (const it of items) {
    if (!it.feedSourceUrl || !it.title || !it.companyName || !it.description || !it.category) {
      skipped++;
      continue;
    }
    // Dedupe by the original posting URL.
    const dup = await prisma.job.findFirst({ where: { feedSourceUrl: it.feedSourceUrl }, select: { id: true } });
    if (dup) {
      skipped++;
      continue;
    }

    const companySlug = slugify(it.companyName);
    let company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: it.companyName,
          slug: companySlug,
          website: it.companyWebsite ?? null,
          city: it.city ?? null,
          province: it.province ?? null,
        },
      });
    }

    const baseSlug = slugify(`${it.title}-${it.companyName}`);
    let jobSlug = baseSlug;
    let counter = 2;
    while (await prisma.job.findUnique({ where: { slug: jobSlug }, select: { id: true } })) {
      jobSlug = `${baseSlug}-${counter++}`;
    }

    let host = it.feedSourceUrl;
    try {
      host = new URL(it.feedSourceUrl).host;
    } catch {
      /* keep raw value */
    }
    const attribution = `\n\nOriginally posted on ${host}.`;
    const postedAt = new Date();
    const expiresAt = new Date(postedAt);
    expiresAt.setDate(expiresAt.getDate() + 30);

    const data: Prisma.JobCreateInput = {
      title: it.title,
      slug: jobSlug,
      description: it.description + attribution,
      company: { connect: { id: company.id } },
      category: it.category,
      employmentType: it.employmentType,
      workArrangement: it.workArrangement,
      city: it.city ?? null,
      province: it.province ?? null,
      salaryMin: it.salaryMin ?? null,
      salaryMax: it.salaryMax ?? null,
      salaryPeriod: it.salaryPeriod ?? null,
      applyUrl: it.applyUrl ?? null,
      applyEmail: it.applyEmail ?? null,
      source: 'FEED',
      feedSourceUrl: it.feedSourceUrl,
      canonicalUrl: it.feedSourceUrl,
      status: 'ACTIVE',
      postedAt,
      expiresAt,
    };

    await prisma.job.create({ data });
    created++;
  }

  console.log(`Feed seeding complete: created=${created}, skipped=${skipped}, total=${items.length}`);
}

main()
  .catch((e) => {
    console.error('Feed seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
