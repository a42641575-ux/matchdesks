import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobCard } from '@/components/JobCard';
import { JsonLd } from '@/components/JsonLd';
import { Pagination } from '@/components/Pagination';
import { CATEGORIES, PROVINCES, SITE_URL, categoryLabel, provinceName } from '@/lib/constants';
import { searchJobs } from '@/lib/search';
import { citiesInCategory, countActiveJobs, provincesInCategory, salaryStats } from '@/lib/seo';
import { buildBreadcrumbLd, buildFaqLd } from '@/lib/schema-org';
import { provinceLandingContent } from '@/lib/content';

export const revalidate = 3600;

interface ProvincePageProps {
  params: Promise<{ slug: string; province: string }>;
  searchParams: Promise<{ page?: string }>;
}

const YEAR = new Date().getFullYear();

export async function generateMetadata({ params }: ProvincePageProps): Promise<Metadata> {
  const { slug, province } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  const prov = PROVINCES.find((p) => p.code === province.toUpperCase());
  if (!category || !prov) return {};
  const total = await countActiveJobs({ category: slug, province: prov.code });
  const title = `${category.label} jobs in ${prov.name} (${YEAR}) — ${total} open`;
  const description = `Browse ${total} ${category.label.toLowerCase()} jobs in ${prov.name}, Canada. Salaries, remote options, and new listings added daily on MatchDesks.`;
  return { title, description, alternates: { canonical: `/jobs/${slug}/in/${province.toLowerCase()}` } };
}

export default async function CategoryProvincePage({ params, searchParams }: ProvincePageProps) {
  const { slug, province } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  const prov = PROVINCES.find((p) => p.code === province.toUpperCase());
  if (!category || !prov) notFound();

  const sp = await searchParams;
  const page = sp.page ? Math.max(1, Number(sp.page) || 1) : 1;
  const result = await searchJobs({ category: slug, province: prov.code, page });
  const stats = await salaryStats({ category: slug, province: prov.code });
  const cities = (await citiesInCategory(slug)).filter((c) => c.province === prov.code);
  const otherProvinces = (await provincesInCategory(slug)).filter((p) => p.province !== prov.code);

  const provSlug = province.toLowerCase();
  const canonical = `${SITE_URL}/jobs/${slug}/in/${provSlug}`;
  const content = provinceLandingContent({
    category: slug,
    province: prov.code,
    count: result.total,
    salary: stats,
    cities: cities.map((c) => ({ city: c.city, count: c.count })),
  });

  const salaryText = stats.avg
    ? `Around $${stats.min?.toLocaleString() ?? '—'}–$${stats.max?.toLocaleString() ?? '—'} per year based on ${stats.count} listing${stats.count === 1 ? '' : 's'} on MatchDesks.`
    : `Salaries vary by role and experience — browse the current ${category.label.toLowerCase()} openings in ${prov.name} for up-to-date ranges.`;

  const faqs = [
    {
      question: `How many ${category.label.toLowerCase()} jobs are available in ${prov.name}?`,
      answer: `There ${result.total === 1 ? 'is' : 'are'} ${result.total} ${category.label.toLowerCase()} job${result.total === 1 ? '' : 's'} listed in ${prov.name} on MatchDesks right now, with new postings added regularly.`,
    },
    {
      question: `What is the average salary for ${category.label.toLowerCase()} jobs in ${prov.name}?`,
      answer: salaryText,
    },
    {
      question: `Are there remote ${category.label.toLowerCase()} jobs available from ${prov.name}?`,
      answer: `Yes — remote ${category.label.toLowerCase()} roles are open to candidates across ${prov.name}. See our remote ${category.label.toLowerCase()} jobs page for current openings.`,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd data={buildBreadcrumbLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Jobs', url: `${SITE_URL}/jobs` },
        { name: category.label, url: `${SITE_URL}/jobs?category=${slug}` },
        { name: prov.name, url: canonical },
      ])} />
      <JsonLd data={buildFaqLd(faqs)} />

      <nav className="text-sm text-gray-500">
        <Link href="/jobs" className="hover:text-red-600">All jobs</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/jobs?category=${slug}`} className="hover:text-red-600">{category.label}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">{prov.name}</span>
      </nav>

      <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
        {category.label} jobs in {prov.name}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        {result.total} {category.label.toLowerCase()} job{result.total === 1 ? '' : 's'} in {prov.name} right now.
        {stats.avg ? ` Typical pay: $${stats.min?.toLocaleString() ?? '—'}–$${stats.max?.toLocaleString() ?? '—'} / year.` : ''}
      </p>

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600">{content.intro}</p>

      <div className="mt-8">
        {result.jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <p className="text-gray-600">
              No {category.label.toLowerCase()} jobs in {prov.name} just yet — check back soon, or browse{' '}
              <Link href={`/jobs/remote/${slug}`} className="font-medium text-red-600 hover:underline">remote {category.label.toLowerCase()} jobs</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {result.jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )}
        <div className="mt-8">
          <Pagination page={result.page} totalPages={result.totalPages} basePath={`/jobs/${slug}/in/${provSlug}`} searchParams={{}} />
        </div>
      </div>

      {cities.length > 0 && (
        <div className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="text-base font-semibold text-gray-900">Cities in {prov.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {cities.map((c) => (
              <Link key={`${c.city}-${c.province}`} href={`/jobs/${slug}/${encodeURIComponent(c.city.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">
                {c.city} <span className="text-gray-400">· {c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={`/jobs/remote/${slug}`} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">Remote {category.label.toLowerCase()} jobs</Link>
        <Link href={`/category/${slug}`} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">All {category.label.toLowerCase()} roles</Link>
        {otherProvinces.slice(0, 8).map((p) => (
          <Link key={p.province} href={`/jobs/${slug}/in/${p.province.toLowerCase()}`}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">
            {provinceName(p.province)} <span className="text-gray-400">· {p.count}</span>
          </Link>
        ))}
      </div>

      <section className="mt-12 border-t border-gray-100 pt-8">
        <h2 className="text-base font-semibold text-gray-900">About {category.label.toLowerCase()} jobs in {prov.name}</h2>
        <div className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
          <p>{content.about}</p>
        </div>
      </section>

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
