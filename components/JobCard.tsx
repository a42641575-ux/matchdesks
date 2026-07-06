import Link from 'next/link';
import type { JobWithCompany } from '@/lib/search';
import { categoryLabel, employmentTypeLabel, workArrangementLabel } from '@/lib/constants';
import { formatLocation, formatRelativeDate, formatSalary } from '@/lib/format';
import { Badge } from './Badge';

export function JobCard({ job }: { job: JobWithCompany }) {
  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md hover:border-gray-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-gray-900">{job.title}</h3>
          <p className="mt-0.5 text-sm text-gray-600">{job.company.name}</p>
        </div>
        <span className="whitespace-nowrap text-xs text-gray-400">{formatRelativeDate(job.postedAt)}</span>
      </div>

      <p className="mt-3 text-sm font-medium text-gray-900">
        {formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod, job.compensationText)}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{formatLocation(job.city, job.province, job.workArrangement)}</Badge>
        <Badge color="blue">{workArrangementLabel(job.workArrangement)}</Badge>
        <Badge color="gray">{employmentTypeLabel(job.employmentType)}</Badge>
        <Badge color="gray">{categoryLabel(job.category)}</Badge>
        {job.aiScreeningUsed && <Badge color="amber">AI-assisted screening</Badge>}
      </div>
    </Link>
  );
}
