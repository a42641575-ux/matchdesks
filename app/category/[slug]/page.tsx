import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { CATEGORIES, MAJOR_CITIES, PROVINCES, SITE_URL, provinceName } from '@/lib/constants';
import { slugify } from '@/lib/format';
import { countActiveJobs, provincesInCategory, topJobTitles } from '@/lib/seo';
import { buildBreadcrumbLd, buildFaqLd } from '@/lib/schema-org';

export const revalidate = 3600;

interface HubProps {
  params: Promise<{ slug: string }>;
}

const YEAR = new Date().getFullYear();

export async function generateMetadata({ params }: HubProps): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return {};
  const total = await countActiveJobs({ category: slug });
  const title = `${category.label} jobs in Canada (${YEAR}) — ${total} open | MatchDesks`;
  const description = `Browse ${total} ${category.label.toLowerCase()} jobs across Canada. Search by city, province, or remote, and see salary ranges for ${category.label.toLowerCase()} roles on MatchDesks.`;
  return { title, description, alternates: { canonical: `/category/${slug}` } };
}

export default async function CategoryHubPage({ params }: HubProps) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();

  const total = await countActiveJobs({ category: slug });
  const provinces = await provincesInCategory(slug);
  const titles = await topJobTitles({ category: slug }, 8);
  const canonical = `${SITE_URL}/category/${slug}`;

  const faqs = [
    { question: `How many ${category.label.toLowerCase()} jobs are open in Canada?`, answer: `There are ${total} ${category.label.toLowerCase()} job${total === 1 ? '' : 's'} listed on MatchDesks across Canada right now.` },
    { question: `Where are most ${category.label.toLowerCase()} jobs located?`, answer: provinces.length ? `${provinceName(provinces[0].province)} leads with ${provinces[0].count} listing${provinces[0].count === 1 ? '' : 's'}, followed by other provinces. Browse by province below.` : `Openings are spread across provinces — browse by city or province below.` },
    { question: `Can I work ${category.label.toLowerCase()} remotely from anywhere in Canada?`, answer: `Yes — many ${category.label.toLowerCase()} roles are remote-friendly. See the remote ${category.label.toLowerCase()} jobs page for current openings.` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd data={buildBreadcrumbLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Jobs', url: `${SITE_URL}/jobs` },
        { name: category.label, url: canonical },
      ])} />
      <JsonLd data={buildFaqLd(faqs)} />

      <nav className="text-sm text-gray-500">
        <Link href="/jobs" className="hover:text-red-600">All jobs</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">{category.label}</span>
      </nav>

      <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{category.label} jobs in Canada</h1>
      <p className="mt-2 text-sm text-gray-500">{total} {category.label.toLowerCase()} job{total === 1 ? '' : 's'} across Canada. Search by city, province, or remote below.</p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="text-base font-semibold text-gray-900">Browse by city</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {MAJOR_CITIES.map((c) => (
              <Link key={`${c.city}-${c.province}`} href={`/jobs/${slug}/${slugify(c.city)}`}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">
                {c.city}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Browse by province</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {PROVINCES.map((p) => (
              <Link key={p.code} href={`/jobs/${slug}/in/${p.code.toLowerCase()}`}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">
                {p.name}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={`/jobs/remote/${slug}`} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Remote {category.label.toLowerCase()} jobs →</Link>
        <Link href={`/jobs?category=${slug}`} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">All {category.label.toLowerCase()} listings</Link>
      </div>

      {titles.length > 0 && (
        <section className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="text-base font-semibold text-gray-900">Popular {category.label.toLowerCase()} roles</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {titles.map((t) => (
              <li key={t}>
                <Link href={`/jobs?q=${encodeURIComponent(t)}&category=${slug}`} className="text-sm text-red-600 hover:underline">{t}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 border-t border-gray-100 pt-8">
        <h2 className="text-base font-semibold text-gray-900">Salaries for {category.label.toLowerCase()} jobs</h2>
        <p className="mt-2 text-sm text-gray-600">See typical pay for {category.label.toLowerCase()} roles in major Canadian cities:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MAJOR_CITIES.slice(0, 8).map((c) => (
            <Link key={`sal-${c.city}`} href={`/salaries/${slug}/${slugify(c.city)}`}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">
              {category.label} salary in {c.city}
            </Link>
          ))}
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
