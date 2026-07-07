import type { Metadata } from 'next';
import Link from 'next/link';
import { JobCard } from '@/components/JobCard';
import { JsonLd } from '@/components/JsonLd';
import { Pagination } from '@/components/Pagination';
import { CATEGORIES, SITE_URL } from '@/lib/constants';
import { searchJobs } from '@/lib/search';
import { countActiveJobs } from '@/lib/seo';
import { buildBreadcrumbLd, buildFaqLd } from '@/lib/schema-org';

export const revalidate = 3600;

interface RemotePageProps {
  searchParams: Promise<{ page?: string }>;
}

const YEAR = new Date().getFullYear();

export async function generateMetadata(): Promise<Metadata> {
  const total = await countActiveJobs({ workArrangement: 'REMOTE' });
  const title = `Remote jobs in Canada (${YEAR}) — ${total} open | MatchDesks`;
  const description = `Browse ${total} remote jobs in Canada. Work from anywhere — full-time, part-time, and contract remote roles across every category on MatchDesks.`;
  return { title, description, alternates: { canonical: `/jobs/remote` } };
}

export default async function RemoteJobsPage({ searchParams }: RemotePageProps) {
  const sp = await searchParams;
  const page = sp.page ? Math.max(1, Number(sp.page) || 1) : 1;
  const result = await searchJobs({ workArrangement: 'REMOTE', page });
  const total = await countActiveJobs({ workArrangement: 'REMOTE' });

  const faqs = [
    { question: 'Are there remote jobs available in Canada?', answer: `Yes — there ${total === 1 ? 'is' : 'are'} ${total} remote job${total === 1 ? '' : 's'} listed on MatchDesks right now, across every category.` },
    { question: 'Do remote jobs in Canada pay the same as on-site roles?', answer: 'Remote roles often pay comparably to on-site equivalents, with ranges varying by category and seniority. Browse the listings for up-to-date salary ranges.' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd data={buildBreadcrumbLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Jobs', url: `${SITE_URL}/jobs` },
        { name: 'Remote', url: `${SITE_URL}/jobs/remote` },
      ])} />
      <JsonLd data={buildFaqLd(faqs)} />

      <nav className="text-sm text-gray-500">
        <Link href="/jobs" className="hover:text-red-600">All jobs</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">Remote</span>
      </nav>

      <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Remote jobs in Canada</h1>
      <p className="mt-2 text-sm text-gray-500">{result.total} remote job{result.total === 1 ? '' : 's'} — work from anywhere in Canada.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/jobs/remote/${c.slug}`}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">
            {c.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {result.jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <p className="text-gray-600">No remote jobs just yet — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {result.jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )}
        <div className="mt-8">
          <Pagination page={result.page} totalPages={result.totalPages} basePath="/jobs/remote" searchParams={{}} />
        </div>
      </div>

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
