import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobCard } from '@/components/JobCard';
import { JsonLd } from '@/components/JsonLd';
import { CATEGORIES, MAJOR_CITIES, SITE_URL, categoryLabel, provinceName } from '@/lib/constants';
import { deslugify, slugify } from '@/lib/format';
import { searchJobs } from '@/lib/search';
import { countActiveJobs, salaryStats } from '@/lib/seo';
import { buildBreadcrumbLd, buildFaqLd } from '@/lib/schema-org';

export const revalidate = 3600;

interface SalaryPageProps {
  params: Promise<{ slug: string; city: string }>;
}

const YEAR = new Date().getFullYear();

function resolveCity(citySlug: string): { city: string; province?: string } {
  const known = MAJOR_CITIES.find((c) => slugify(c.city) === citySlug);
  if (known) return { city: known.city, province: known.province };
  return { city: deslugify(citySlug) };
}

export async function generateMetadata({ params }: SalaryPageProps): Promise<Metadata> {
  const { slug, city: citySlug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return {};
  const { city } = resolveCity(citySlug);
  const stats = await salaryStats({ category: slug, city: { equals: city, mode: 'insensitive' } });
  const range = stats.avg ? `$${stats.min?.toLocaleString() ?? ''}–$${stats.max?.toLocaleString() ?? ''}` : 'salaries';
  const title = `${category.label} salary in ${city} (${YEAR}) — ${range} | MatchDesks`;
  const description = `Average ${category.label.toLowerCase()} salary in ${city}, Canada. See pay ranges, current openings, and what ${category.label.toLowerCase()} roles earn in ${city} on MatchDesks.`;
  return { title, description, alternates: { canonical: `/salaries/${slug}/${citySlug}` } };
}

export default async function SalaryPage({ params }: SalaryPageProps) {
  const { slug, city: citySlug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();
  const { city, province } = resolveCity(citySlug);

  const whereCity = { category: slug, city: { equals: city, mode: 'insensitive' } as const };
  let stats = await salaryStats(whereCity);
  let scope = `${city}`;
  if (stats.count === 0) {
    // Fall back to national category data so the page stays useful.
    stats = await salaryStats({ category: slug });
    scope = `Canada (national)`;
  }
  const total = await countActiveJobs(whereCity);
  const result = await searchJobs({ category: slug, city, page: 1 });
  const canonical = `${SITE_URL}/salaries/${slug}/${citySlug}`;

  const rangeText = stats.avg
    ? `$${stats.min?.toLocaleString() ?? '—'} – $${stats.max?.toLocaleString() ?? '—'} per year (average $${stats.avg?.toLocaleString() ?? '—'}), based on ${stats.count} listing${stats.count === 1 ? '' : 's'} in ${scope}.`
    : `We don't have enough ${category.label.toLowerCase()} salary data for ${city} yet. Salaries vary by role, seniority, and employer — browse the current ${category.label.toLowerCase()} openings in ${city} for up-to-date ranges.`;

  const faqs = [
    { question: `How much do ${category.label.toLowerCase()} roles pay in ${city}?`, answer: rangeText },
    { question: `How many ${category.label.toLowerCase()} jobs are open in ${city}?`, answer: `There ${total === 1 ? 'is' : 'are'} ${total} ${category.label.toLowerCase()} job${total === 1 ? '' : 's'} listed in ${city} on MatchDesks right now.` },
    { question: `Are remote ${category.label.toLowerCase()} roles available from ${city}?`, answer: `Yes — remote ${category.label.toLowerCase()} roles are open to candidates in ${city}. See the remote ${category.label.toLowerCase()} jobs page.` },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={buildBreadcrumbLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Salaries', url: `${SITE_URL}/salaries` },
        { name: category.label, url: `${SITE_URL}/category/${slug}` },
        { name: city, url: canonical },
      ])} />
      <JsonLd data={buildFaqLd(faqs)} />

      <nav className="text-sm text-gray-500">
        <Link href={`/category/${slug}`} className="hover:text-red-600">{category.label}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">Salary · {city}</span>
      </nav>

      <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{category.label} salary in {city} ({YEAR})</h1>
      <p className="mt-2 text-sm text-gray-500">
        Typical pay for {category.label.toLowerCase()} roles in {city}{province ? `, ${provinceName(province)}` : ''}.
      </p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">{scope === `${city}` ? 'Based on local listings' : 'Based on national listings (local data pending)'}</p>
        {stats.avg ? (
          <p className="mt-2 text-3xl font-bold text-gray-900">
            ${stats.min?.toLocaleString() ?? '—'} – ${stats.max?.toLocaleString() ?? '—'}
            <span className="ml-2 text-base font-normal text-gray-500">/ year</span>
          </p>
        ) : (
          <p className="mt-2 text-lg text-gray-700">Salary data coming soon — see current openings below.</p>
        )}
        {stats.avg && <p className="mt-1 text-sm text-gray-500">Average: ${stats.avg?.toLocaleString()}/year · {stats.count} listing{stats.count === 1 ? '' : 's'}</p>}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={`/jobs/${slug}/${citySlug}`} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Browse {category.label.toLowerCase()} jobs in {city} →</Link>
        <Link href={`/jobs/remote/${slug}`} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Remote {category.label.toLowerCase()} jobs</Link>
        <Link href={`/jobs/${slug}/in/${(province ?? 'on').toLowerCase()}`} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{category.label} in {provinceName(province)}</Link>
      </div>

      {result.jobs.length > 0 && (
        <section className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="text-base font-semibold text-gray-900">Current {category.label.toLowerCase()} openings in {city}</h2>
          <div className="mt-4 space-y-4">
            {result.jobs.slice(0, 5).map((job) => <JobCard key={job.id} job={job} />)}
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
