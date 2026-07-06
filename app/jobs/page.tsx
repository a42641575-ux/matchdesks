import type { Metadata } from 'next';
import Link from 'next/link';
import { JobCard } from '@/components/JobCard';
import { Pagination } from '@/components/Pagination';
import { SearchFilters } from '@/components/SearchFilters';
import { searchJobs } from '@/lib/search';

export const metadata: Metadata = {
  title: 'Find jobs across Canada',
  description:
    'Search jobs across every Canadian province and territory. Filter by category, city, salary, employment type, and more.',
};

export const revalidate = 60;

interface JobsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const sp = await searchParams;

  const q = first(sp.q);
  const category = first(sp.category);
  const province = first(sp.province);
  const city = first(sp.city);
  const employmentType = first(sp.employmentType);
  const workArrangement = first(sp.workArrangement);
  const minSalaryStr = first(sp.minSalary);
  const postedWithinDaysStr = first(sp.postedWithinDays);
  const pageStr = first(sp.page);

  const minSalary = minSalaryStr ? Number(minSalaryStr) : undefined;
  const postedWithinDays = postedWithinDaysStr ? Number(postedWithinDaysStr) : undefined;
  const page = pageStr ? Math.max(1, Number(pageStr) || 1) : 1;

  const result = await searchJobs({
    q,
    category,
    province,
    city,
    employmentType,
    workArrangement,
    minSalary: Number.isFinite(minSalary) ? minSalary : undefined,
    postedWithinDays: Number.isFinite(postedWithinDays) ? postedWithinDays : undefined,
    page,
  });

  const filterSearchParams = {
    q,
    category,
    province,
    city,
    employmentType,
    workArrangement,
    minSalary: minSalaryStr,
    postedWithinDays: postedWithinDaysStr,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Find jobs across Canada</h1>
      <p className="mt-1 text-sm text-gray-500">
        {result.total} job{result.total === 1 ? '' : 's'} found
      </p>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <SearchFilters initial={filterSearchParams} />
        </aside>

        <div>
          {result.jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
              <p className="text-gray-600">No jobs match your filters right now.</p>
              <Link href="/jobs" className="mt-2 inline-block text-sm font-medium text-red-600 hover:underline">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {result.jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          <div className="mt-8">
            <Pagination page={result.page} totalPages={result.totalPages} basePath="/jobs" searchParams={filterSearchParams} />
          </div>
        </div>
      </div>
    </div>
  );
}
