import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/admin';
import {
  categoryLabel,
  employmentTypeLabel,
  workArrangementLabel,
} from '@/lib/constants';
import { formatDateLong, formatLocation, formatSalary } from '@/lib/format';
import { approveJob, adminLogout, removeJob } from './actions';
import { AdminLoginForm } from './AdminLoginForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin moderation',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const authed = await isAdmin();
  if (!authed) return <AdminLoginForm />;

  const [pendingJobs, pendingCount, openReports] = await Promise.all([
    prisma.job.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: { company: true },
      orderBy: { postedAt: 'desc' },
    }),
    prisma.job.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.fraudReport.count({ where: { status: 'OPEN' } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moderation queue</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pendingCount} pending · {openReports} open fraud report{openReports === 1 ? '' : 's'}
          </p>
        </div>
        <form action={adminLogout}>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </form>
      </div>

      {pendingJobs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">Nothing pending. New submissions will appear here for review.</p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {pendingJobs.map((job) => (
            <li key={job.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-gray-900">{job.title}</h2>
                  <p className="truncate text-sm text-gray-600">{job.company.name}</p>
                </div>
                <p className="whitespace-nowrap text-xs text-gray-400">Submitted {formatDateLong(job.postedAt)}</p>
              </div>

              <p className="mt-2 text-sm font-semibold text-gray-900">
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod, job.compensationText)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                <span>{formatLocation(job.city, job.province, job.workArrangement)}</span>
                <span>·</span>
                <span>{workArrangementLabel(job.workArrangement)}</span>
                <span>·</span>
                <span>{employmentTypeLabel(job.employmentType)}</span>
                <span>·</span>
                <span>{categoryLabel(job.category)}</span>
              </div>

              <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-gray-600">{job.description}</p>

              {job.applyEmail && <p className="mt-2 text-xs text-gray-500">Apply email: {job.applyEmail}</p>}
              {job.applyUrl && (
                <p className="mt-1 truncate text-xs text-gray-500">
                  Apply URL:{' '}
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                    {job.applyUrl}
                  </a>
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <form action={approveJob}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Approve &amp; publish
                  </button>
                </form>
                <form action={removeJob}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
