import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { CATEGORIES, SITE_URL } from '@/lib/constants';
import { buildBreadcrumbLd } from '@/lib/schema-org';

export const metadata: Metadata = {
  title: 'Salary guides by role and city | MatchDesks',
  description: 'Canadian salary benchmarks by job category and city — see typical pay ranges for roles across Canada on MatchDesks.',
  alternates: { canonical: '/salaries' },
};

export default function SalariesIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={buildBreadcrumbLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Salaries', url: `${SITE_URL}/salaries` },
      ])} />
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Salary guides</h1>
      <p className="mt-2 text-sm text-gray-500">
        Typical pay ranges for Canadian roles by category and city. Pick a category to see salary benchmarks across major cities.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`}
            className="rounded-xl border border-gray-200 bg-white p-4 text-sm font-medium text-gray-800 hover:border-red-300 hover:text-red-600">
            {c.label} salaries →
          </Link>
        ))}
      </div>
    </div>
  );
}
