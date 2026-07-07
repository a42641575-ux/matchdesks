import { type Prisma, type Province, type SalaryPeriod } from '@prisma/client';
import { prisma } from './db';

const ACTIVE = { status: 'ACTIVE' as const };

/** Count active jobs matching a filter (used for landing-page headlines + sitemap priority). */
export async function countActiveJobs(where: Prisma.JobWhereInput = {}): Promise<number> {
  return prisma.job.count({ where: { ...ACTIVE, ...where } });
}

/** Convert a salary amount to a yearly equivalent for apples-to-apples stats. */
function toYearly(amount: number, period: SalaryPeriod | null | undefined): number {
  switch (period) {
    case 'HOURLY':
      return Math.round(amount * 2080);
    case 'MONTHLY':
      return amount * 12;
    case 'YEARLY':
    default:
      return amount;
  }
}

export interface SalaryStats {
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  /** sample period of the averages (always normalized to YEARLY for display). */
}

/** Yearly-normalized salary stats for active jobs matching the filter. */
export async function salaryStats(where: Prisma.JobWhereInput = {}): Promise<SalaryStats> {
  const jobs = await prisma.job.findMany({
    where: { ...ACTIVE, salaryMin: { not: null }, ...where },
    select: { salaryMin: true, salaryMax: true, salaryPeriod: true },
  });
  if (jobs.length === 0) return { count: 0, min: null, max: null, avg: null };

  const lows: number[] = [];
  const highs: number[] = [];
  const mids: number[] = [];
  for (const j of jobs) {
    const lo = j.salaryMin != null ? toYearly(j.salaryMin, j.salaryPeriod) : null;
    const hi = j.salaryMax != null ? toYearly(j.salaryMax, j.salaryPeriod) : null;
    if (lo != null) lows.push(lo);
    if (hi != null) highs.push(hi);
    const mid = (lo ?? hi ?? 0) && (lo != null || hi != null) ? ((lo ?? hi!)! + (hi ?? lo!)!) / 2 : null;
    if (mid != null) mids.push(mid);
  }
  const min = lows.length ? Math.min(...lows) : null;
  const max = highs.length ? Math.max(...highs) : null;
  const avg = mids.length ? Math.round(mids.reduce((a, b) => a + b, 0) / mids.length) : null;
  return { count: jobs.length, min, max, avg };
}

/** Most common job titles for a filter (for "top roles" sections + internal links). */
export async function topJobTitles(where: Prisma.JobWhereInput = {}, limit = 6): Promise<string[]> {
  const jobs = await prisma.job.findMany({
    where: { ...ACTIVE, ...where },
    select: { title: true },
    take: 250,
  });
  const counts = new Map<string, number>();
  for (const j of jobs) counts.set(j.title, (counts.get(j.title) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([t]) => t);
}

/** Cities (with province + count) that have active jobs for a filter. */
export async function citiesInCategory(category: string): Promise<{ city: string; province: Province; count: number }[]> {
  const rows = await prisma.job.findMany({
    where: { ...ACTIVE, category, city: { not: null }, province: { not: null } },
    select: { city: true, province: true },
  });
  const m = new Map<string, { city: string; province: Province; count: number }>();
  for (const r of rows) {
    if (!r.city || !r.province) continue;
    const key = `${r.city}|${r.province}`;
    const e = m.get(key) ?? { city: r.city, province: r.province, count: 0 };
    e.count++;
    m.set(key, e);
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}

/** Provinces that have active jobs for a category, with counts. */
export async function provincesInCategory(category: string): Promise<{ province: Province; count: number }[]> {
  const rows = await prisma.job.findMany({
    where: { ...ACTIVE, category, province: { not: null } },
    select: { province: true },
  });
  const m = new Map<string, { province: Province; count: number }>();
  for (const r of rows) {
    if (!r.province) continue;
    const e = m.get(r.province) ?? { province: r.province, count: 0 };
    e.count++;
    m.set(r.province, e);
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}
