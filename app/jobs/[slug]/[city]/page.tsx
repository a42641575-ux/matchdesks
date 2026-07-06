import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobCard } from '@/components/JobCard';
import { Pagination } from '@/components/Pagination';
import { CATEGORIES, MAJOR_CITIES } from '@/lib/constants';
import { deslugify, slugify } from '@/lib/format';
import { searchJobs } from '@/lib/search';

// NOTE: this route lives inside the `[slug]` folder (shared with the job detail
// page) rather than a sibling `[category]` folder, because Next.js requires every
// dynamic segment at the same level to share one param name. Here `slug` holds the
// *category* slug (e.g. "technology") and `city` holds the city slug, so together
// this renders "/jobs/<category>/<city>" while "/jobs/<job-slug>" still resolves
// to the job detail page one level up.
export const revalidate = 3600;

interface CategoryCityPageProps {
  params: Promise<{ slug: string; city: string }>;
  searchParams: Promise<{ page?: string }>;
}

function resolveCity(citySlug: string): { city: string; province?: string } {
  const known = MAJOR_CITIES.find((c) => slugify(c.city) === citySlug);
  if (known) return { city: known.city, province: known.province };
  return { city: deslugify(citySlug) };
}

export async function generateMetadata({ params }: CategoryCityPageProps): Promise<Metadata> {
  const { slug: categorySlug, city: citySlug } = await params;
  const category = CATEGORIES.find((c) => c.slug === categorySlug);
  if (!category) return {};

  const { city } = resolveCity(citySlug);
  const title = `${category.label} Jobs in ${city}`;
  const description = `Browse the latest ${category.label.toLowerCase()} jobs in ${city}, Canada. New listings added regularly on MatchDesks.`;

  return {
    title,
    description,
    alternates: { canonical: `/jobs/${categorySlug}/${citySlug}` },
  };
}

export default async function CategoryCityPage({ params, searchParams }: CategoryCityPageProps) {
  const { slug: categorySlug, city: citySlug } = await params;
  const category = CATEGORIES.find((c) => c.slug === categorySlug);
  if (!category) notFound();

  const { city, province } = resolveCity(citySlug);
  const sp = await searchParams;
  const page = sp.page ? Math.max(1, Number(sp.page) || 1) : 1;

  const result = await searchJobs({ category: category.slug, city, province, page });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-gray-500">
        <Link href="/jobs" className="hover:text-red-600">
          All jobs
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/jobs?category=${category.slug}`} className="hover:text-red-600">
          {category.label}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">{city}</span>
      </nav>

      <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
        {category.label} Jobs in {city}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        {result.total} {category.label.toLowerCase()} job{result.total === 1 ? '' : 's'} in {city}
        {province ? `, ${province}` : ''} right now.
      </p>

      <div className="mt-8">
        {result.jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <p className="text-gray-600">
              No {category.label.toLowerCase()} jobs in {city} just yet — check back soon, or browse all{' '}
              <Link href={`/jobs?category=${category.slug}`} className="font-medium text-red-600 hover:underline">
                {category.label} jobs
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {result.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath={`/jobs/${categorySlug}/${citySlug}`}
            searchParams={{}}
          />
        </div>
      </div>

      <div className="mt-12 border-t border-gray-100 pt-8">
        <h2 className="text-base font-semibold text-gray-900">Other categories in {city}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.slug !== category.slug).map((c) => (
            <Link
              key={c.slug}
              href={`/jobs/${c.slug}/${citySlug}`}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
