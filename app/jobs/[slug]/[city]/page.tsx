import type { Metadata } from 'next';
import type { Province } from '@prisma/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobCard } from '@/components/JobCard';
import { JsonLd } from '@/components/JsonLd';
import { Pagination } from '@/components/Pagination';
import { CATEGORIES, MAJOR_CITIES, SITE_URL, provinceName } from '@/lib/constants';
import { deslugify, slugify } from '@/lib/format';
import { searchJobs } from '@/lib/search';
import { countActiveJobs, salaryStats } from '@/lib/seo';
import { buildBreadcrumbLd, buildFaqLd } from '@/lib/schema-org';
import { cityLandingContent } from '@/lib/content';

const YEAR = new Date().getFullYear();

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
  const total = await countActiveJobs({ category: categorySlug, city: { equals: city, mode: 'insensitive' } });
  const title = `${category.label} jobs in ${city} (${YEAR}) — ${total} open | MatchDesks`;
  const description = `Browse ${total} ${category.label.toLowerCase()} jobs in ${city}, Canada. Salaries, remote options, and new listings added daily on MatchDesks.`;

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
  const stats = await salaryStats({ category: category.slug, city: { equals: city, mode: 'insensitive' } });
  const canonical = `${SITE_URL}/jobs/${categorySlug}/${citySlug}`;
  const content = province
    ? cityLandingContent({ category: category.slug, city, province: province as Province, count: result.total, salary: stats })
    : null;
  const salaryText = stats.avg
    ? `Typical pay is around $${stats.min?.toLocaleString() ?? '—'}–$${stats.max?.toLocaleString() ?? '—'} per year based on ${stats.count} listing${stats.count === 1 ? '' : 's'} in ${city}.`
    : `Salaries vary by role and experience — browse the current ${category.label.toLowerCase()} openings in ${city} for up-to-date ranges.`;
  const faqs = [
    { question: `How many ${category.label.toLowerCase()} jobs are in ${city}?`, answer: `There ${result.total === 1 ? 'is' : 'are'} ${result.total} ${category.label.toLowerCase()} job${result.total === 1 ? '' : 's'} in ${city} on MatchDesks.` },
    { question: `What is the average ${category.label.toLowerCase()} salary in ${city}?`, answer: salaryText },
    { question: `Are there remote ${category.label.toLowerCase()} jobs from ${city}?`, answer: `Yes — remote ${category.label.toLowerCase()} roles are open to candidates in ${city}. See the remote ${category.label.toLowerCase()} jobs page.` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd data={buildBreadcrumbLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Jobs', url: `${SITE_URL}/jobs` },
        { name: category.label, url: `${SITE_URL}/category/${category.slug}` },
        { name: city, url: canonical },
      ])} />
      <JsonLd data={buildFaqLd(faqs)} />
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

      {content && (
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600">{content.intro}</p>
      )}

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

      <div className="mt-8 flex flex-wrap gap-2">
        {province && (
          <Link href={`/jobs/${category.slug}/in/${province.toLowerCase()}`} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">
            {category.label} in {provinceName(province)}
          </Link>
        )}
        <Link href={`/jobs/remote/${category.slug}`} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">
          Remote {category.label.toLowerCase()} jobs
        </Link>
        <Link href={`/salaries/${category.slug}/${citySlug}`} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">
          {category.label} salary in {city}
        </Link>
        <Link href={`/category/${category.slug}`} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">
          All {category.label.toLowerCase()} roles
        </Link>
      </div>

      {content && (
        <section className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="text-base font-semibold text-gray-900">About {category.label.toLowerCase()} jobs in {city}</h2>
          <div className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
            <p>{content.about}</p>
          </div>
        </section>
      )}

      <section className="mt-12 border-t border-gray-100 pt-8">
        <h2 className="text-base font-semibold text-gray-900">Frequently asked questions</h2>
        <div className="mt-4 space-y-4">
          {faqs.map((f) => (
            <div key={f.question}>
              <h3 className="text-sm font-semibold text-gray-900">{f.question}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
