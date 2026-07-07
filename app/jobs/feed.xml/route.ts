import { prisma } from '@/lib/db';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/constants';
import { formatSalary } from '@/lib/format';

export const revalidate = 3600;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(s: string): string {
  // Split any literal "]]>" so we don't prematurely close the CDATA section.
  return `<![CDATA[${s.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
}

export async function GET(): Promise<Response> {
  const jobs = await prisma.job.findMany({
    where: { status: 'ACTIVE' },
    include: { company: true },
    orderBy: { postedAt: 'desc' },
    take: 200,
  });

  const items = jobs
    .map((job) => {
      const url = `${SITE_URL}/jobs/${job.slug}`;
      const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod, job.compensationText);
      const location = [job.city, job.province].filter(Boolean).join(', ') || 'Canada';
      const excerpt =
        job.description.length > 280 ? `${job.description.slice(0, 280).trim()}…` : job.description;
      return `    <item>
      <title>${escapeXml(`${job.title} at ${job.company.name}`)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${job.postedAt.toUTCString()}</pubDate>
      <description>${cdata(`${job.title} — ${salary} · ${location}. ${excerpt}`)}</description>
      <category>${escapeXml(job.category)}</category>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:job="https://schema.org/JobPosting">
  <channel>
    <title>${escapeXml(`${SITE_NAME} — ${SITE_TAGLINE}`)}</title>
    <link>${escapeXml(`${SITE_URL}/jobs`)}</link>
    <description>${escapeXml(`Latest Canadian job listings on ${SITE_NAME}.`)}</description>
    <language>en-ca</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${SITE_URL}/jobs/feed.xml`)}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
