import 'dotenv/config';
import { prisma } from '../lib/db';
import { notifyGoogleIndexing, notifyIndexNow } from '../lib/indexing';
import { SITE_URL } from '../lib/constants';

// One-shot: submit every ACTIVE job URL to Bing IndexNow (batch) and the
// Google Indexing API (per URL). Run after enabling indexing for the first
// time, or after a bulk import. Safe to re-run.
//
//   npx tsx scripts/backfill-indexing.ts
//
// Google Indexing API quota is ~200 submits/day, so this is capped at 200;
// IndexNow has no practical limit. Both no-op if not configured.

async function main() {
  const jobs = await prisma.job.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true },
    orderBy: { postedAt: 'desc' },
  });
  const urls = jobs.map((j) => `${SITE_URL}/jobs/${j.slug}`);
  console.log(`Backfill-indexing ${urls.length} ACTIVE job URLs from ${SITE_URL}`);

  await notifyIndexNow(urls);
  console.log('IndexNow: batch submitted.');

  const googleCap = 200;
  const subset = urls.slice(0, googleCap);
  if (subset.length > 0) {
    console.log(`Google Indexing API: submitting up to ${subset.length} (quota cap ${googleCap})...`);
    for (const u of subset) {
      await notifyGoogleIndexing(u, 'URL_UPDATED');
      await new Promise((r) => setTimeout(r, 120));
    }
    console.log('Google Indexing API: done.');
  }

  console.log('Backfill complete.');
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
