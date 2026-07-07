import { SITE_URL } from './constants';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date
  updated?: string;
  bodyHtml: string;
}

// Data-driven, linkable content. Kept as HTML strings to avoid an MDX
// dependency. Internal links point to category/landing/salary pages to pass
// equity and funnel readers to live job listings.

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'average-software-developer-salary-canada-2026',
    title: 'Average software developer salary in Canada (2026)',
    description:
      'What software developers earn across Canada in 2026 — by city, seniority, and remote vs on-site, with current job listings.',
    date: '2026-06-20',
    bodyHtml: `
      <p>Software development remains one of Canada's highest-demand and best-paid categories in 2026. This guide breaks down what you can expect to earn as a software developer across major Canadian cities, and where the openings are right now.</p>
      <h2>Salary ranges by city</h2>
      <p>Pay varies meaningfully by location. Toronto, Vancouver, and Calgary tend to offer the highest base ranges, while remote roles often match major-city pay regardless of where you live. For current, location-specific ranges, see <a href="${SITE_URL}/salaries/technology/toronto">technology salaries in Toronto</a>, <a href="${SITE_URL}/salaries/technology/vancouver">Vancouver</a>, and <a href="${SITE_URL}/salaries/technology/calgary">Calgary</a>.</p>
      <h2>Remote vs on-site</h2>
      <p>Remote developer roles are now a permanent fixture of the Canadian market, and they frequently pay comparably to on-site equivalents. Browse <a href="${SITE_URL}/jobs/remote/technology">remote technology jobs</a> for openings you can do from anywhere in Canada.</p>
      <h2>Where the jobs are</h2>
      <p>Ontario and British Columbia account for the largest share of developer openings, followed by Alberta and Quebec. See all <a href="${SITE_URL}/category/technology">technology jobs in Canada</a> or filter by province — for example, <a href="${SITE_URL}/jobs/technology/in/on">technology jobs in Ontario</a>.</p>
      <h2>How to negotiate a higher offer</h2>
      <p>Know the local range before you negotiate. Use the salary pages above as a benchmark, then anchor your ask to the top of the band for your city and seniority. For help structuring your application, see our <a href="${SITE_URL}/blog/how-to-write-a-canadian-resume">Canadian resume guide</a>.</p>
    `,
  },
  {
    slug: 'canada-job-market-report-2026',
    title: 'Canada job market report 2026',
    description:
      'Where Canadian hiring is concentrated in 2026 — the fastest-growing categories, top provinces, and what job seekers should target.',
    date: '2026-06-28',
    bodyHtml: `
      <p>The 2026 Canadian job market is leaning into technology, healthcare, and skilled trades. This report summarizes where hiring is concentrated and where job seekers have the most leverage.</p>
      <h2>Fastest-growing categories</h2>
      <p>Technology and healthcare lead hiring volume, with skilled trades close behind as infrastructure and housing investment continue. Skilled trades in particular are seeing sustained wage growth as demand outpaces supply. Browse <a href="${SITE_URL}/category/technology">technology jobs</a>, <a href="${SITE_URL}/category/healthcare">healthcare jobs</a>, and <a href="${SITE_URL}/category/skilled-trades">skilled trades jobs</a>.</p>
      <h2>Top provinces for hiring</h2>
      <p>Ontario and British Columbia continue to post the most openings, with Alberta growing fastest in percentage terms. See <a href="${SITE_URL}/jobs/technology/in/on">technology jobs in Ontario</a> and <a href="${SITE_URL}/jobs/technology/in/ab">technology jobs in Alberta</a>.</p>
      <h2>Remote work is holding steady</h2>
      <p>Remote roles stabilized rather than disappeared in 2026. See all <a href="${SITE_URL}/jobs/remote">remote jobs in Canada</a>.</p>
      <h2>What this means for job seekers</h2>
      <p>Target categories and provinces with thick hiring — competition per role is lower and leverage is higher. Use the category pages above to filter by city and province, and check <a href="${SITE_URL}/salaries">salary guides</a> before you apply.</p>
    `,
  },
  {
    slug: 'how-to-write-a-canadian-resume',
    title: 'How to write a Canadian resume (with examples)',
    description:
      'A practical guide to writing a Canadian-style resume — length, format, what to include, and what to leave off for employers in Canada.',
    date: '2026-06-12',
    bodyHtml: `
      <p>A Canadian-style resume is typically concise, achievement-focused, and tailored to the role. Here's how to structure one that gets past recruiters and into interviews.</p>
      <h2>Keep it to two pages</h2>
      <p>For most roles in Canada, one to two pages is the norm. Lead with a short professional summary, then a skills section, then reverse-chronological experience with quantified achievements.</p>
      <h2>Tailor to the role</h2>
      <p>Mirror the keywords in the job posting — especially the job title and required skills. Find openings to tailor to via <a href="${SITE_URL}/jobs">job search</a> or by category, e.g. <a href="${SITE_URL}/category/marketing">marketing jobs</a> or <a href="${SITE_URL}/category/finance-accounting">finance &amp; accounting jobs</a>.</p>
      <h2>Quantify your impact</h2>
      <p>"Increased conversion by 18%" beats "responsible for conversion." Numbers signal seniority and credibility.</p>
      <h2>What to leave off</h2>
      <p>No photo, age, marital status, or full home address (city and province are enough). Canadian employers expect a skills-forward, bias-resistant document.</p>
    `,
  },
  {
    slug: 'remote-jobs-in-canada-guide',
    title: 'Remote jobs in Canada: a 2026 guide',
    description:
      'How to find remote jobs in Canada in 2026 — which categories hire remote, what remote roles pay, and how to stand out as a remote candidate.',
    date: '2026-07-02',
    bodyHtml: `
      <p>Remote work in Canada is no longer a perk — for many categories it's the default. Here's how to find a remote role, what to expect on pay, and how to compete.</p>
      <h2>Which categories hire remote</h2>
      <p>Technology, marketing, finance, and customer service lead remote hiring in Canada. Trades and healthcare remain mostly on-site (with hybrid admin roles). Start with <a href="${SITE_URL}/jobs/remote/technology">remote technology jobs</a> or <a href="${SITE_URL}/jobs/remote/marketing">remote marketing jobs</a>.</p>
      <h2>Do remote roles pay less?</h2>
      <p>Generally no — remote Canadian roles frequently match on-site ranges, though pay can be calibrated to your location. See <a href="${SITE_URL}/salaries">salary guides</a> for category-level ranges.</p>
      <h2>How to stand out</h2>
      <p>Highlight async communication, written clarity, and remote-tool fluency. Tailor your resume using our <a href="${SITE_URL}/blog/how-to-write-a-canadian-resume">Canadian resume guide</a>, then apply to <a href="${SITE_URL}/jobs/remote">remote jobs in Canada</a>.</p>
    `,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
