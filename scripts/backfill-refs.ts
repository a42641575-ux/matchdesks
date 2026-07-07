import 'dotenv/config';
import { prisma } from '../lib/db';
import { generateJobRef } from '../lib/job-ref';

// One-shot: assign a unique MD-XXXXXX publicRef to every job that lacks one.
// Run against each environment's DATABASE_URL:
//   npx tsx scripts/backfill-refs.ts                      # local dev DB (.env)
//   DATABASE_URL="postgresql://…neon…" npx tsx scripts/backfill-refs.ts   # prod

async function main(): Promise<void> {
  const jobs = await prisma.job.findMany({ where: { publicRef: null }, select: { id: true } });
  console.log(`Backfilling publicRef for ${jobs.length} job(s)...`);
  for (const job of jobs) {
    const ref = await generateJobRef();
    await prisma.job.update({ where: { id: job.id }, data: { publicRef: ref } });
  }
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
