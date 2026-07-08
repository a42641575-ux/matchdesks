import 'dotenv/config';
import { prisma } from '../lib/db';

// One-shot: clear canonicalUrl on all FEED-sourced jobs so they become
// canonical-to-MatchDesks (earn Google for Jobs equity on our domain).
//
// Background: feed jobs were originally imported with canonicalUrl pointing
// at the original source, which passed all ranking equity away. This script
// reverses that for jobs already in the DB. New feed imports (seed-feed.ts)
// now set canonicalUrl = null by default, so this is only needed once for
// historical data.
//
//   npx tsx scripts/flip-canonical.ts
//
// Safe to re-run (idempotent — only updates rows where canonicalUrl != null).

async function main(): Promise<void> {
  const before = await prisma.job.count({
    where: { source: 'FEED', NOT: { canonicalUrl: null } },
  });
  console.log(`Feed jobs with a non-null canonical (to be cleared): ${before}`);

  if (before === 0) {
    console.log('Nothing to do — all feed jobs are already canonical-to-us.');
    return;
  }

  const result = await prisma.job.updateMany({
    where: { source: 'FEED', NOT: { canonicalUrl: null } },
    data: { canonicalUrl: null },
  });
  console.log(`Cleared canonicalUrl on ${result.count} feed jobs.`);
  console.log('These pages are now canonical-to-MatchDesks.');
}

main()
  .catch((e) => {
    console.error('Canonical flip failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
