import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { CATEGORIES, MAJOR_CITIES, SITE_URL } from '@/lib/constants';
import { slugify } from '@/lib/format';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/jobs`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/post`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/fraud-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const landingEntries: MetadataRoute.Sitemap = CATEGORIES.flatMap((category) =>
    MAJOR_CITIES.map((city) => ({
      url: `${SITE_URL}/jobs/${category.slug}/${slugify(city.city)}`,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
  );

  const jobs = await prisma.job.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true, updatedAt: true },
    orderBy: { postedAt: 'desc' },
    take: 5000,
  });

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${SITE_URL}/jobs/${job.slug}`,
    lastModified: job.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...landingEntries, ...jobEntries];
}
