import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { notifySearchEngines } from '@/lib/indexing';
import { SITE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Daily cron: flip ACTIVE jobs past their expiresAt to EXPIRED, then ping
// Google Indexing API + Bing IndexNow so the expired page gets recrawled
// (no JobPosting JSON-LD + validThrough in the past -> dropped from Google
// for Jobs). Vercel Cron auto-sends `Authorization: Bearer ${CRON_SECRET}`
// when CRON_SECRET is set; we verify it here. If CRON_SECRET is unset (local
// dev), the endpoint is open for manual testing.
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  const now = new Date();
  const toExpire = await prisma.job.findMany({
    where: { status: 'ACTIVE', expiresAt: { lt: now } },
    select: { id: true, slug: true },
  });

  if (toExpire.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  await prisma.job.updateMany({
    where: { id: { in: toExpire.map((j) => j.id) } },
    data: { status: 'EXPIRED' },
  });

  // Notify search engines to recrawl each newly-expired job URL.
  await Promise.all(
    toExpire.map((j) => notifySearchEngines(`${SITE_URL}/jobs/${j.slug}`, 'URL_UPDATED')),
  );

  return NextResponse.json({ expired: toExpire.length });
}
