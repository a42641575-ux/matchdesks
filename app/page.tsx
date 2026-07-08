import type { Metadata } from 'next';
import Link from 'next/link';
import { JobCard } from '@/components/JobCard';
import { RefLookup } from '@/components/RefLookup';
import { CATEGORIES, MAJOR_CITIES, SITE_TAGLINE, SITE_URL } from '@/lib/constants';
import { countActiveJobs, getFeaturedJobs } from '@/lib/search';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const count = await countActiveJobs();
  return {
    title: `${SITE_TAGLINE} — ${count}+ Canadian jobs hiring now`,
    description: `Search ${count}+ jobs across Canada. Find work in Toronto, Vancouver, Calgary, Montreal and every province. Full-time, part-time, remote — free to search, free to post.`,
    alternates: { canonical: '/' },
    openGraph: {
      title: 'MatchDesks — Canadian jobs, coast to coast.',
      description: `Search ${count}+ jobs across every Canadian province and territory.`,
      url: SITE_URL,
      type: 'website',
      siteName: 'MatchDesks',
    },
  };
}

export default async function Home() {
  const [featuredJobs, activeJobCount] = await Promise.all([getFeaturedJobs(6), countActiveJobs()]);

  return (
    <div>
      <section className="border-b border-gray-100 bg-gradient-to-b from-red-50/60 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Find your next job, anywhere in Canada
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {SITE_TAGLINE} {activeJobCount}+ jobs from Canadian employers across every province and territory.
          </p>

          <form action="/jobs" method="GET" className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              type="text"
              name="q"
              placeholder="Job title, company, or keyword"
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              type="submit"
              className="whitespace-nowrap rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Search jobs
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-500">
            Hiring?{' '}
            <Link href="/post" className="font-medium text-red-600 hover:underline">
              Post a job — it&apos;s free
            </Link>
          </p>

          <RefLookup />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-900">Browse by category</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600"
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/jobs/remote" className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">Remote jobs in Canada</Link>
          <Link href="/salaries" className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">Salary guides</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-900">Browse by city</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {MAJOR_CITIES.map((c) => (
            <Link
              key={c.city}
              href={`/jobs?city=${encodeURIComponent(c.city)}&province=${c.province}`}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600"
            >
              {c.city}, {c.province}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recently posted</h2>
          <Link href="/jobs" className="text-sm font-medium text-red-600 hover:underline">
            View all jobs →
          </Link>
        </div>
        {featuredJobs.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No jobs posted yet — be the first!</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6">
          <h2 className="text-xl font-semibold text-gray-900">Hiring in Canada?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
            Post a job in minutes — free while we grow. Every posting includes a clear compensation range and the
            fraud-reporting tools candidates trust.
          </p>
          <Link
            href="/post"
            className="mt-6 inline-block rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            Post a job
          </Link>
        </div>
      </section>
    </div>
  );
}
