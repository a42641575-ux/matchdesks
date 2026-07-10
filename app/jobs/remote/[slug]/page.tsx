import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobCard } from '@/components/JobCard';
import { JsonLd } from '@/components/JsonLd';
import { Pagination } from '@/components/Pagination';
import { CATEGORIES, MAJOR_CITIES, SITE_URL } from '@/lib/constants';
import { slugify } from '@/lib/format';
import { searchJobs } from '@/lib/search';
import { countActiveJobs, salaryStats } from '@/lib/seo';
import { buildBreadcrumbLd, buildFaqLd } from '@/lib/schema-org';
import { remoteCategoryContent } from '@/lib/content';

export const revalidate = 3600;

interface RemoteCategoryProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const YEAR = new Date().getFullYear();

export async function generateMetadata({ params }: RemoteCategoryProps): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return {};
  const total = await countActiveJobs({ category: slug, workArrangement: 'REMOTE' });
  const title = `Remote ${category.label} jobs in Canada (${YEAR}) — ${total} open`;
  const description = `Browse ${total} remote ${category.label.toLowerCase()} jobs in Canada. Work from anywhere — salaries, contract and full-time remote ${category.label.toLowerCase()} roles on MatchDesks.`;
  return { title, description, alternates: { canonical: `/jobs/remote/${slug}` } };
}

export default async function RemoteCategoryPage({ params, searchParams }: RemoteCategoryProps) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();

  const sp = await searchParams;
  const page = sp.page ? Math.max(1, Number(sp.page) || 1) : 1;
  const result = await searchJobs({ category: slug, workArrangement: 'REMOTE', page });
  const stats = await salaryStats({ category: slug, workArrangement: 'REMOTE' });
  const canonical = `${SITE_URL}/jobs/remote/${slug}`;
  const content = remoteCategoryContent({ category: slug, count: result.total, salary: stats });

  const salaryText = stats.avg
    ? `Remote ${category.label.toLowerCase()} roles typically pay $${stats.min?.toLocaleString() ?? '—'}–$${stats.max?.toLocaleString() ?? '—'} per year based on ${stats.count} listing${stats.count === 1 ? '' : 's'}.`
    : `Salaries vary by role and experience — browse the current remote ${category.label.toLowerCase()} openings for up-to-date ranges.`;

  const faqs = [
    { question: `Are there remote ${category.label.toLowerCase()} jobs in Canada?`, answer: `There ${result.total === 1 ? 'is' : 'are'} ${result.total} remote ${category.label.toLowerCase()} job${result.total === 1 ? '' : 's'} on MatchDesks, open to candidates across Canada.` },
    { question: `What is the average salary for remote ${category.label.toLowerCase()} jobs?`, answer: salaryText },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd data={buildBreadcrumbLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Jobs', url: `${SITE_URL}/jobs` },
        { name: 'Remote', url: `${SITE_URL}/jobs/remote` },
        { name: category.label, url: canonical },
      ])} />
      <JsonLd data={buildFaqLd(faqs)} />

      <nav className="text-sm text-gray-500">
        <Link href="/jobs/remote" className="hover:text-red-600">Remote</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">{category.label}</span>
      </nav>

      <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Remote {category.label} jobs in Canada</h1>
      <p className="mt-2 text-sm text-gray-500">{result.total} remote {category.label.toLowerCase()} job{result.total === 1 ? '' : 's'} — work from anywhere in Canada.</p>

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600">{content.intro}</p>

      <div className="mt-8">
        {result.jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <p className="text-gray-600">
              No remote {category.label.toLowerCase()} jobs just yet — browse{' '}
              <Link href={`/jobs/${slug}`} className="font-medium text-red-600 hover:underline">all {category.label.toLowerCase()} jobs</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {result.jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )}
        <div className="mt-8">
          <Pagination page={result.page} totalPages={result.totalPages} basePath={`/jobs/remote/${slug}`} searchParams={{}} />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={`/category/${slug}`} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">All {category.label.toLowerCase()} roles</Link>
        {MAJOR_CITIES.slice(0, 8).map((c) => (
          <Link key={`r-${c.city}`} href={`/jobs/${slug}/${slugify(c.city)}`}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">
            {category.label} in {c.city}
          </Link>
        ))}
      </div>

      <section className="mt-12 border-t border-gray-100 pt-8">
        <h2 className="text-base font-semibold text-gray-900">About remote {category.label.toLowerCase()} jobs in Canada</h2>
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
