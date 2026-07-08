import Link from 'next/link';
import { CATEGORIES, MAJOR_CITIES, PROVINCES, SITE_NAME, SITE_TAGLINE } from '@/lib/constants';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-xs font-bold text-white">
                M
              </span>
              <span className="text-base font-semibold text-gray-900">{SITE_NAME}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-gray-500">{SITE_TAGLINE} Built for job seekers and employers in every province and territory.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Job categories</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              {CATEGORIES.slice(0, 8).map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="hover:text-red-600">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Jobs by city</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              {MAJOR_CITIES.slice(0, 8).map((c) => (
                <li key={c.city}>
                  <Link href={`/jobs?city=${encodeURIComponent(c.city)}&province=${c.province}`} className="hover:text-red-600">
                    {c.city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Jobs by province</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 space-y-2 text-sm text-gray-500">
              {PROVINCES.slice(0, 10).map((p) => (
                <li key={p.code}>
                  <Link href={`/jobs?province=${p.code}`} className="hover:text-red-600">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Resources</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li><Link href="/jobs/remote" className="hover:text-red-600">Remote jobs</Link></li>
              <li><Link href="/salaries" className="hover:text-red-600">Salary guides</Link></li>
              <li><Link href="/blog" className="hover:text-red-600">Career blog</Link></li>
              <li><Link href="/post" className="hover:text-red-600">Post a job (free)</Link></li>
              <li><Link href="/contact" className="hover:text-red-600">Contact</Link></li>
            </ul>
            <h3 className="mt-6 text-sm font-semibold text-gray-900">Trust &amp; policies</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li><Link href="/fraud-policy" className="hover:text-red-600">Fraud policy</Link></li>
              <li><Link href="/posting-policy" className="hover:text-red-600">Posting policy</Link></li>
              <li><Link href="/privacy" className="hover:text-red-600">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-red-600">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-xs text-gray-400">
          &copy; {year} {SITE_NAME}. Made in Canada.
        </div>
      </div>
    </footer>
  );
}
