import { Prisma, type EmploymentType, type Province, type WorkArrangement } from '@prisma/client';
import { prisma } from './db';
import { JOBS_PAGE_SIZE } from './constants';

export type JobWithCompany = Prisma.JobGetPayload<{ include: { company: true } }>;

export interface JobSearchParams {
  q?: string;
  province?: string;
  city?: string;
  category?: string;
  employmentType?: string;
  workArrangement?: string;
  minSalary?: number;
  postedWithinDays?: number;
  page?: number;
}

export interface JobSearchResult {
  jobs: JobWithCompany[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * "Open job" filter: ACTIVE and not past its expiry. Jobs with a null
 * expiresAt are treated as never-expiring. Used everywhere jobs are listed
 * (search, home, related, counts, sitemap) so expired jobs vanish from
 * listings immediately without waiting for the expiry cron.
 */
export function openJobWhere(extra?: Prisma.JobWhereInput): Prisma.JobWhereInput {
  const base: Prisma.JobWhereInput = {
    status: 'ACTIVE',
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
  return extra ? { AND: [base, extra] } : base;
}

/**
 * Ranks jobs using real Postgres full-text search (to_tsvector/websearch_to_tsquery).
 * Returns null (rather than throwing) if the raw query fails for any reason, so callers
 * can gracefully fall back to a simpler `contains` search instead of breaking the page.
 */
async function getFullTextRankedIds(q: string): Promise<string[] | null> {
  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT j."id"
      FROM "Job" j
      JOIN "Company" c ON c."id" = j."companyId"
      WHERE j."status" = 'ACTIVE'
        AND (j."expiresAt" IS NULL OR j."expiresAt" > NOW())
        AND to_tsvector('english', j."title" || ' ' || j."description" || ' ' || coalesce(j."category", '') || ' ' || c."name")
            @@ websearch_to_tsquery('english', ${q})
      ORDER BY ts_rank(
        to_tsvector('english', j."title" || ' ' || j."description" || ' ' || coalesce(j."category", '') || ' ' || c."name"),
        websearch_to_tsquery('english', ${q})
      ) DESC
      LIMIT 500
    `;
    return rows.map((r) => r.id);
  } catch (err) {
    console.error('[search] full-text search failed, falling back to keyword filter:', err);
    return null;
  }
}

export async function searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = JOBS_PAGE_SIZE;

  const andConditions: Prisma.JobWhereInput[] = [openJobWhere()];

  if (params.category) andConditions.push({ category: params.category });
  if (params.employmentType) andConditions.push({ employmentType: params.employmentType as EmploymentType });
  if (params.workArrangement) andConditions.push({ workArrangement: params.workArrangement as WorkArrangement });
  if (params.province) andConditions.push({ province: params.province as Province });
  if (params.city) andConditions.push({ city: { equals: params.city, mode: 'insensitive' } });
  if (params.minSalary) {
    andConditions.push({
      OR: [{ salaryMax: { gte: params.minSalary } }, { salaryMax: null, salaryMin: { gte: params.minSalary } }],
    });
  }
  if (params.postedWithinDays) {
    const since = new Date();
    since.setDate(since.getDate() - params.postedWithinDays);
    andConditions.push({ postedAt: { gte: since } });
  }

  const q = params.q?.trim();
  let rankedIds: string[] | null = null;

  if (q) {
    rankedIds = await getFullTextRankedIds(q);
    if (rankedIds && rankedIds.length > 0) {
      andConditions.push({ id: { in: rankedIds } });
    } else {
      // No tsquery matches (or the query failed) — fall back to a loose substring search
      // so short/partial terms (e.g. "dev") still return something useful.
      andConditions.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { company: { name: { contains: q, mode: 'insensitive' } } },
        ],
      });
      rankedIds = null;
    }
  }

  const where: Prisma.JobWhereInput = { AND: andConditions };

  const total = await prisma.job.count({ where });

  let jobs: JobWithCompany[];
  if (rankedIds) {
    // Rank order can't be expressed as a Prisma `orderBy`, so fetch the (small,
    // already-filtered) match set and sort/paginate in memory.
    const unordered = await prisma.job.findMany({ where, include: { company: true } });
    const rankIndex = new Map(rankedIds.map((id, i) => [id, i]));
    unordered.sort((a, b) => (rankIndex.get(a.id) ?? 0) - (rankIndex.get(b.id) ?? 0));
    jobs = unordered.slice((page - 1) * pageSize, page * pageSize);
  } else {
    jobs = await prisma.job.findMany({
      where,
      include: { company: true },
      orderBy: { postedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  return {
    jobs,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getFeaturedJobs(limit = 6): Promise<JobWithCompany[]> {
  return prisma.job.findMany({
    where: openJobWhere(),
    include: { company: true },
    orderBy: { postedAt: 'desc' },
    take: limit,
  });
}

export async function getJobBySlug(slug: string): Promise<JobWithCompany | null> {
  return prisma.job.findUnique({ where: { slug }, include: { company: true } });
}

/**
 * Look up a job by its public reference (e.g. "MD-7TCKQM").
 * Returns the job regardless of status (ACTIVE, EXPIRED, REMOVED) — the caller
 * decides whether to render it. Used by the /ref/[ref] shortcut route so an
 * employer can find an expired posting by its reference number.
 */
export async function getJobByPublicRef(ref: string): Promise<JobWithCompany | null> {
  const normalized = ref.trim().toUpperCase();
  if (!normalized) return null;
  return prisma.job.findUnique({ where: { publicRef: normalized }, include: { company: true } });
}

export async function getRelatedJobs(job: JobWithCompany, limit = 4): Promise<JobWithCompany[]> {
  return prisma.job.findMany({
    where: openJobWhere({
      id: { not: job.id },
      OR: [{ category: job.category }, { companyId: job.companyId }],
    }),
    include: { company: true },
    orderBy: { postedAt: 'desc' },
    take: limit,
  });
}

export async function countActiveJobs(): Promise<number> {
  return prisma.job.count({ where: openJobWhere() });
}
