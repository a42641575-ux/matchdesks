import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/Badge';
import { JobCard } from '@/components/JobCard';
import { JsonLd } from '@/components/JsonLd';
import { CATEGORIES, categoryLabel, employmentTypeLabel, provinceName, SITE_URL, workArrangementLabel } from '@/lib/constants';
import { formatDateLong, formatLocation, formatSalary, slugify } from '@/lib/format';
import { buildJobPostingJsonLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/schema-org';
import { getJobBySlug, getRelatedJobs, type JobWithCompany } from '@/lib/search';
import { ReportJobButton } from './ReportJobButton';

export const revalidate = 60;

interface JobPageProps {
  params: Promise<{ slug: string }>;
}

// A job is "open" (full posting + JobPosting JSON-LD) only when ACTIVE and not
// past its expiry. EXPIRED (or ACTIVE past expiresAt) renders the 200 "expired"
// view. PENDING_REVIEW / REMOVED => 404 (not public / gone).
function isOpenJob(job: JobWithCompany): boolean {
  return job.status === 'ACTIVE' && (!job.expiresAt || job.expiresAt > new Date());
}
function isExpiredJob(job: JobWithCompany): boolean {
  if (job.status === 'EXPIRED') return true;
  return job.status === 'ACTIVE' && !!job.expiresAt && job.expiresAt <= new Date();
}

function daysUntilExpiry(expiresAt: Date | null | undefined): number | null {
  if (!expiresAt) return null;
  return Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000);
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return {};

  if (isExpiredJob(job)) {
    const title = `${job.title} at ${job.company.name} — this role has been filled | MatchDesks`;
    const description = `This ${job.title} role at ${job.company.name} is no longer accepting applications. Browse similar ${categoryLabel(job.category).toLowerCase()} jobs on MatchDesks.`;
    return { title, description, alternates: { canonical: job.canonicalUrl ?? `/jobs/${job.slug}` } };
  }

  if (!isOpenJob(job)) return {}; // pending/removed => 404, no meta

  const location = formatLocation(job.city, job.province, job.workArrangement);
  const salaryHint =
    job.salaryMin != null && job.salaryMax != null
      ? ` — $${job.salaryMin.toLocaleString()}–$${job.salaryMax.toLocaleString()}`
      : job.compensationText
        ? ` — ${job.compensationText}`
        : '';
  const title = `${job.title} at ${job.company.name}${salaryHint} | MatchDesks`;
  const trimmedDescription =
    job.description.length > 155 ? `${job.description.slice(0, 155).trim()}…` : job.description;
  const description = `${job.title} at ${job.company.name} in ${location}. ${employmentTypeLabel(job.employmentType)} · ${workArrangementLabel(job.workArrangement)}. Apply now on MatchDesks.`;

  return {
    title,
    description,
    alternates: { canonical: job.canonicalUrl ?? `/jobs/${job.slug}` },
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
  if (!job) notFound();

  if (isExpiredJob(job)) return <ExpiredJobView job={job} />;
  if (!isOpenJob(job)) notFound(); // PENDING_REVIEW / REMOVED

  const [relatedJobs] = await Promise.all([getRelatedJobs(job)]);
  const jsonLd = buildJobPostingJsonLd(job, SITE_URL);
  const daysLeft = daysUntilExpiry(job.expiresAt);

  const applyHref =
    job.applyUrl ?? (job.applyEmail ? `mailto:${job.applyEmail}?subject=${encodeURIComponent(`Application: ${job.title}`)}` : undefined);

  const categoryHref =
    CATEGORIES.some((c) => c.slug === job.category) && job.city
      ? `/jobs/${job.category}/${slugify(job.city)}`
      : `/jobs?category=${job.category}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={jsonLd} />
      <JsonLd data={buildBreadcrumbLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Jobs', url: `${SITE_URL}/jobs` },
        { name: categoryLabel(job.category), url: `${SITE_URL}/category/${job.category}` },
        ...(job.city ? [{ name: job.city, url: `${SITE_URL}/jobs/${job.category}/${slugify(job.city)}` }] : []),
        { name: job.title, url: `${SITE_URL}/jobs/${job.slug}` },
      ])} />
      <JsonLd data={buildFaqLd([
        {
          question: `How much does ${job.title} at ${job.company.name} pay?`,
          answer:
            job.salaryMin != null && job.salaryMax != null
              ? `The listed salary range is $${job.salaryMin.toLocaleString()}–$${job.salaryMax.toLocaleString()} ${job.salaryPeriod ?? ''}.`
              : job.compensationText ?? 'See the posting for compensation details.',
        },
        {
          question: `Is the ${job.title} role at ${job.company.name} remote?`,
          answer:
            job.workArrangement === 'REMOTE'
              ? 'Yes — this role is fully remote.'
              : job.workArrangement === 'HYBRID'
                ? 'This role is hybrid (a mix of on-site and remote).'
                : `This role is on-site${job.city ? ` in ${job.city}` : ''}.`,
        },
      ])} />

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
          <div className="whitespace-nowrap text-right text-sm text-gray-400">
            <p>Posted {formatDateLong(job.postedAt)}</p>
            {job.publicRef && <p className="mt-0.5">Ref {job.publicRef}</p>}
            {daysLeft != null && daysLeft >= 0 && (
              <p className="mt-0.5">
                {daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`} ·{' '}
                <Link href="/posting-policy" className="text-red-600 hover:underline">policy</Link>
              </p>
            )}
          </div>
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

// --- Expired view (HTTP 200, SEO-safe: related jobs + context, NO JobPosting JSON-LD) ---
async function ExpiredJobView({ job }: { job: JobWithCompany }) {
  const relatedJobs = await getRelatedJobs(job);
  const categoryHref = `/category/${job.category}`;
  const cityHref = job.city ? `/jobs/${job.category}/${slugify(job.city)}` : null;
  const remoteHref = `/jobs/remote/${job.category}`;

  const faqs = [
    { question: `Is the ${job.title} role at ${job.company.name} still open?`, answer: `No — this listing has expired or been filled. Browse similar open ${categoryLabel(job.category).toLowerCase()} roles below.` },
    { question: 'How long do job postings stay live on MatchDesks?', answer: 'Listings are active for 30 days, then expire. Employers can repost a role to keep it live. See our posting policy.' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={buildBreadcrumbLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Jobs', url: `${SITE_URL}/jobs` },
        { name: categoryLabel(job.category), url: `${SITE_URL}/category/${job.category}` },
        ...(job.city ? [{ name: job.city, url: `${SITE_URL}/jobs/${job.category}/${slugify(job.city)}` }] : []),
        { name: job.title, url: `${SITE_URL}/jobs/${job.slug}` },
      ])} />
      <JsonLd data={buildFaqLd(faqs)} />

      <Link href="/jobs" className="text-sm font-medium text-gray-500 hover:text-red-600">
        ← Back to all jobs
      </Link>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">This role is no longer accepting applications</p>
          <p className="mt-1">This listing has expired or been filled. See similar open roles below, or{' '}
            <Link href="/post" className="font-medium text-red-600 hover:underline">repost this role</Link>.
          </p>
        </div>

        <h1 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">{job.title}</h1>
        <p className="mt-1 text-base text-gray-600">{job.company.name}</p>
        <p className="mt-3 text-lg font-semibold text-gray-900">
          {formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod, job.compensationText)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{formatLocation(job.city, job.province, job.workArrangement)}</Badge>
          <Badge color="blue">{workArrangementLabel(job.workArrangement)}</Badge>
          <Badge>{employmentTypeLabel(job.employmentType)}</Badge>
          <Link href={categoryHref}><Badge>{categoryLabel(job.category)}</Badge></Link>
        </div>
        {job.publicRef && (
          <p className="mt-3 text-xs text-gray-400">
            Job ref {job.publicRef} · Posted {formatDateLong(job.postedAt)} ·{' '}
            <Link href="/posting-policy" className="text-red-600 hover:underline">posting policy</Link>
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/post" className="rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
            Repost this role
          </Link>
          <Link href="/jobs" className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Browse all jobs
          </Link>
        </div>
      </div>

      {relatedJobs.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Similar open roles</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {relatedJobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={categoryHref} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">All {categoryLabel(job.category).toLowerCase()} jobs</Link>
        {cityHref && <Link href={cityHref} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">{categoryLabel(job.category)} in {job.city}</Link>}
        <Link href={remoteHref} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-600">Remote {categoryLabel(job.category).toLowerCase()} jobs</Link>
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
