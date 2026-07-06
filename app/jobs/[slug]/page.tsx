import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/Badge';
import { JobCard } from '@/components/JobCard';
import { JsonLd } from '@/components/JsonLd';
import { CATEGORIES, categoryLabel, employmentTypeLabel, provinceName, SITE_URL, workArrangementLabel } from '@/lib/constants';
import { formatDateLong, formatLocation, formatSalary, slugify } from '@/lib/format';
import { buildJobPostingJsonLd } from '@/lib/schema-org';
import { getJobBySlug, getRelatedJobs } from '@/lib/search';
import { ReportJobButton } from './ReportJobButton';

export const revalidate = 60;

interface JobPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job || job.status !== 'ACTIVE') return {};

  const location = formatLocation(job.city, job.province, job.workArrangement);
  const title = `${job.title} at ${job.company.name} — ${location}`;
  const trimmedDescription =
    job.description.length > 155 ? `${job.description.slice(0, 155).trim()}…` : job.description;

  return {
    title,
    description: trimmedDescription,
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: {
      title,
      description: trimmedDescription,
      type: 'website',
      url: `${SITE_URL}/jobs/${job.slug}`,
    },
  };
}

export default async function JobDetailPage({ params }: JobPageProps) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job || job.status !== 'ACTIVE') notFound();

  const [relatedJobs] = await Promise.all([getRelatedJobs(job)]);
  const jsonLd = buildJobPostingJsonLd(job, SITE_URL);

  const applyHref =
    job.applyUrl ?? (job.applyEmail ? `mailto:${job.applyEmail}?subject=${encodeURIComponent(`Application: ${job.title}`)}` : undefined);

  const categoryHref =
    CATEGORIES.some((c) => c.slug === job.category) && job.city
      ? `/jobs/${job.category}/${slugify(job.city)}`
      : `/jobs?category=${job.category}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={jsonLd} />

      <Link href="/jobs" className="text-sm font-medium text-gray-500 hover:text-red-600">
        ← Back to all jobs
      </Link>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{job.title}</h1>
            <p className="mt-1 text-base text-gray-600">
              {job.company.website ? (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="hover:text-red-600 hover:underline"
                >
                  {job.company.name}
                </a>
              ) : (
                job.company.name
              )}
            </p>
          </div>
          <p className="whitespace-nowrap text-sm text-gray-400">Posted {formatDateLong(job.postedAt)}</p>
        </div>

        <p className="mt-4 text-xl font-semibold text-gray-900">
          {formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod, job.compensationText)}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{formatLocation(job.city, job.province, job.workArrangement)}</Badge>
          <Badge color="blue">{workArrangementLabel(job.workArrangement)}</Badge>
          <Badge>{employmentTypeLabel(job.employmentType)}</Badge>
          <Link href={categoryHref}>
            <Badge>{categoryLabel(job.category)}</Badge>
          </Link>
        </div>

        {job.aiScreeningUsed && (
          <div className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">AI is used in candidate screening for this role</p>
            <p className="mt-1">{job.aiScreeningDetails}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {applyHref && (
            <a
              href={applyHref}
              target={job.applyUrl ? '_blank' : undefined}
              rel={job.applyUrl ? 'noopener noreferrer nofollow' : undefined}
              className="rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Apply now
            </a>
          )}
          <ReportJobButton jobId={job.id} jobTitle={job.title} />
        </div>

        <hr className="my-8 border-gray-100" />

        <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{job.description}</div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">About {job.company.name}</h2>
        {job.company.description && <p className="mt-2 text-sm text-gray-600">{job.company.description}</p>}
        <p className="mt-2 text-sm text-gray-500">
          {[job.company.city, job.company.province ? provinceName(job.company.province) : null].filter(Boolean).join(', ') ||
            'Canada'}
        </p>
      </div>

      {relatedJobs.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">More jobs you might like</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {relatedJobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
