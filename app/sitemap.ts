import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { CATEGORIES, MAJOR_CITIES, PROVINCES, SITE_URL } from '@/lib/constants';
import { slugify } from '@/lib/format';
import { BLOG_POSTS } from '@/lib/blog-posts';
import { openJobWhere } from '@/lib/search';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/jobs`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/jobs/remote`, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE_URL}/salaries`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/post`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/fraud-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/posting-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Category hub pages: /category/[slug]
  const categoryHubEntries: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${SITE_URL}/category/${category.slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // Remote-per-category pages: /jobs/remote/[slug]
  const remoteCategoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${SITE_URL}/jobs/remote/${category.slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // City landing pages: /jobs/[category]/[city]
  const cityLandingEntries: MetadataRoute.Sitemap = CATEGORIES.flatMap((category) =>
    MAJOR_CITIES.map((city) => ({
      url: `${SITE_URL}/jobs/${category.slug}/${slugify(city.city)}`,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
  );

  // Province landing pages: /jobs/[category]/in/[province]
  const provinceLandingEntries: MetadataRoute.Sitemap = CATEGORIES.flatMap((category) =>
    PROVINCES.map((p) => ({
      url: `${SITE_URL}/jobs/${category.slug}/in/${p.code.toLowerCase()}`,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
  );

  // Salary benchmark pages: /salaries/[category]/[city]
  const salaryEntries: MetadataRoute.Sitemap = CATEGORIES.flatMap((category) =>
    MAJOR_CITIES.map((city) => ({
      url: `${SITE_URL}/salaries/${category.slug}/${slugify(city.city)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  );

  // Blog posts: /blog/[slug]
  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated ?? post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const jobs = await prisma.job.findMany({
    where: openJobWhere(),
    select: { slug: true, updatedAt: true },
    orderBy: { postedAt: 'desc' },
    take: 50000,
  });

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${SITE_URL}/jobs/${job.slug}`,
    lastModified: job.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    ...staticEntries,
    ...categoryHubEntries,
    ...remoteCategoryEntries,
    ...cityLandingEntries,
    ...provinceLandingEntries,
    ...salaryEntries,
    ...blogEntries,
    ...jobEntries,
  ];
}
