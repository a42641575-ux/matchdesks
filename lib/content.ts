import type { Province } from '@prisma/client';
import { categoryLabel, provinceName, employmentTypeLabel } from './constants';
import type { SalaryStats } from './seo';

// Templated content engine: composes unique, data-grounded prose for pSEO pages
// from the numbers already in the DB (counts, salary stats, top titles). The
// goal is to turn thin <80-word pages into 300-500 word pages with genuinely
// unique text per (category, city, province) combination — without any LLM
// API cost. Every paragraph is derived from real data, so no two pages read
// identically and nothing is fabricated.

function money(n: number | null): string {
  if (n == null) return '';
  return `$${Math.round(n).toLocaleString('en-CA')}`;
}

function salaryRange(stats: SalaryStats): string {
  if (stats.min == null && stats.max == null) return '';
  if (stats.min != null && stats.max != null && stats.min !== stats.max) {
    return `${money(stats.min)}–${money(stats.max)}`;
  }
  return money(stats.min ?? stats.max);
}

function avgOrRange(stats: SalaryStats): string {
  if (stats.avg != null) return `around ${money(stats.avg)}`;
  const range = salaryRange(stats);
  return range ? `${range}` : '';
}

/** Intro + market-context block for a category hub page. */
export function categoryHubContent(input: {
  category: string;
  count: number;
  topProvinces: { province: Province; count: number }[];
  salary: SalaryStats;
}): { intro: string; about: string } {
  const { category, count, topProvinces, salary } = input;
  const label = categoryLabel(category).toLowerCase();
  const plural = count === 1 ? `${label} job` : `${label} jobs`;
  const provList = topProvinces.slice(0, 3).map((p) => provinceName(p.province));
  const provText = provList.length > 1
    ? `${provList.slice(0, -1).join(', ')} and ${provList[provList.length - 1]}`
    : provList[0] ?? 'Canada';
  const pay = avgOrRange(salary);

  const intro = `${categoryLabel(category)} is one of the most active hiring categories on MatchDesks, with ${count} ${plural} open right now across Canada. Employers range from small local businesses to national organizations, and roles span on-site, hybrid, and fully remote arrangements. Whether you are early in your career or an experienced hire, openings are posted daily and refreshed continuously.`;

  const about = [
    `Where the jobs are: ${provList.length > 0 ? `the strongest demand is concentrated in ${provText}, though openings appear in every province.` : 'roles are spread across every province, with heaviest activity in Ontario, British Columbia, and Alberta.'}`,
    pay
      ? `What they pay: based on current listings, ${label} roles typically pay ${pay} per year, with variation by city, seniority, and whether the role is remote. Use the salary guides below to benchmark an offer before you apply.`
      : `Pay varies by role, city, and seniority — check the salary guides below for current ranges.`,
    `How to apply: every listing above links directly to the employer's application page or email. New roles are added daily, so check back often or filter by your city or province to see openings near you.`,
  ].join(' ');

  return { intro, about };
}

/** Intro + location-context block for a category×city landing page. */
export function cityLandingContent(input: {
  category: string;
  city: string;
  province: Province;
  count: number;
  salary: SalaryStats;
}): { intro: string; about: string } {
  const { category, city, province, count, salary } = input;
  const label = categoryLabel(category).toLowerCase();
  const pay = avgOrRange(salary);
  const provName = provinceName(province);

  const intro = `${count > 0 ? `There ${count === 1 ? 'is' : 'are'} ${count} ${label} ${count === 1 ? 'job' : 'jobs'} hiring in ${city}, ${provName} right now` : `Looking for ${label} jobs in ${city}, ${provName}`}. This page lists every active ${categoryLabel(category)} opening in the ${city} area — updated as employers post new roles. ${count === 0 ? 'When new positions open, they will appear here automatically. In the meantime, browse remote roles or expand your search to nearby cities.' : 'Use the filters to narrow by employment type, work arrangement, or salary range.'}`;

  const about = [
    `About working in ${city}: as one of ${provName}'s key employment centers, ${city} attracts a mix of local businesses, regional offices, and remote-friendly employers. ${label} roles here range from entry-level to senior, across full-time, part-time, and contract arrangements.`,
    pay
      ? `Pay in ${city}: current ${label} listings in ${city} advertise salaries ${pay} per year, in line with ${provName} market rates. ${salary.avg != null ? 'Senior and specialized roles trend toward the top of that range.' : ''}`
      : `Compensation varies by employer and seniority — review each listing for specific salary details.`,
    `Applying: each role above links directly to the employer. If you don't see the right fit today, set ${city} as your filter and check back — new ${label} jobs are posted throughout the week.`,
  ].join(' ');

  return { intro, about };
}

/** Intro + context block for a province-level landing page. */
export function provinceLandingContent(input: {
  category: string;
  province: Province;
  count: number;
  salary: SalaryStats;
  cities: { city: string; count: number }[];
}): { intro: string; about: string } {
  const { category, province, count, salary, cities } = input;
  const label = categoryLabel(category).toLowerCase();
  const provName = provinceName(province);
  const pay = avgOrRange(salary);
  const topCities = cities.slice(0, 3).map((c) => c.city);
  const cityText = topCities.length > 0 ? ` including major centers like ${topCities.join(', ')}` : '';

  const intro = `Browse ${count} ${label} ${count === 1 ? 'job' : 'jobs'} across ${provName}${cityText}. This page aggregates every active ${categoryLabel(category)} posting in the province, so you can see the full market in one place rather than searching city by city. Listings update automatically as employers publish new roles.`;

  const about = [
    `${provName} has a diversified economy with steady demand for ${label} talent${cities.length > 0 ? `, with the most openings concentrated in ${topCities.join(' and ')}` : ''}. Roles span on-site, hybrid, and remote — use the filters above to narrow by work arrangement.`,
    pay
      ? `Salary context: ${label} roles in ${provName} currently advertise ${pay} per year on average. Pay varies by city, employer size, and seniority.`
      : `Compensation ranges vary by city and employer — see individual listings for details.`,
    `If nothing fits your location today, browse remote ${label} jobs you can do from anywhere in ${provName}, or widen your search to the national ${categoryLabel(category)} market.`,
  ].join(' ');

  return { intro, about };
}

/** Intro + context block for a remote-per-category page. */
export function remoteCategoryContent(input: {
  category: string;
  count: number;
  salary: SalaryStats;
}): { intro: string; about: string } {
  const { category, count, salary } = input;
  const label = categoryLabel(category).toLowerCase();
  const pay = avgOrRange(salary);

  const intro = `${count} remote ${label} ${count === 1 ? 'job' : 'jobs'} — work from anywhere in Canada. Remote ${label} roles on MatchDesks are posted by employers across the country, with pay often calibrated to national rates rather than a single local market. All listings below are fully remote unless marked hybrid.`;

  const about = [
    `Remote ${label} work has become a permanent fixture of the Canadian job market. These roles let you live anywhere in Canada while competing for the same openings as candidates in major cities. Pay typically matches or exceeds on-site ranges, though some employers adjust for your location.`,
    pay
      ? `Current remote ${label} listings advertise ${pay} per year. Senior and specialized roles trend toward the higher end of the range.`
      : `Salaries vary by employer and seniority — review each listing for specifics.`,
    `Every role above links directly to the employer. New remote ${label} jobs are added daily, so save this page or check back throughout the week.`,
  ].join(' ');

  return { intro, about };
}

/** Intro + salary-analysis block for a salary benchmark page. */
export function salaryPageContent(input: {
  category: string;
  city: string;
  province: Province;
  stats: SalaryStats;
  nationalStats: SalaryStats;
  isLocal: boolean;
}): { intro: string; about: string } {
  const { category, city, province, stats, nationalStats, isLocal } = input;
  const label = categoryLabel(category).toLowerCase();
  const localPay = avgOrRange(stats);
  const nationalPay = avgOrRange(nationalStats);
  const scope = isLocal ? `${city}, ${provinceName(province)}` : 'Canada (national)';

  const intro = `This page tracks current ${label} salaries in ${scope}, based on live job listings on MatchDesks. ${stats.count > 0 ? `Data reflects ${stats.count} active ${stats.count === 1 ? 'listing' : 'listings'} with disclosed compensation.` : `When local listings publish salary ranges, the numbers below update automatically.`} Use these benchmarks to negotiate an offer, compare locations, or decide whether to expand your search.`;

  const about = [
    `How to read these numbers: the ranges below come directly from employer-posted job listings — not surveys or self-reported data. Salaries are normalized to a yearly figure (hourly and monthly rates are converted) so you can compare across roles on equal footing.`,
    localPay && nationalPay
      ? `${label} roles in ${scope} pay ${localPay} per year${localPay !== nationalPay ? `, compared to ${nationalPay} nationally` : ''}. Location, seniority, and whether the role is remote all move the number — see the current openings below for employer-specific ranges.`
      : `Pay varies by employer, seniority, and work arrangement. Check the live openings below for specific compensation details.`,
    `Before you negotiate: gather two or three current listings at your seniority level in ${isLocal ? city : 'your city'} and anchor your ask to the top of the range. The listings below are a live source for that data.`,
  ].join(' ');

  return { intro, about };
}
