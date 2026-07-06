import Link from 'next/link';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/constants';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-xs font-bold text-white">
                M
              </span>
              <span className="text-base font-semibold text-gray-900">{SITE_NAME}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-gray-500">{SITE_TAGLINE} Built for job seekers and employers in every province and territory.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">For job seekers</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/jobs" className="hover:text-red-600">
                  Browse all jobs
                </Link>
              </li>
              <li>
                <Link href="/jobs?workArrangement=REMOTE" className="hover:text-red-600">
                  Remote jobs
                </Link>
              </li>
              <li>
                <Link href="/post" className="hover:text-red-600">
                  Post a job
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Trust &amp; policies</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/fraud-policy" className="hover:text-red-600">
                  Fraud policy &amp; reporting
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-red-600">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-red-600">
                  Terms of use
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-red-600">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6 text-xs text-gray-400">
          &copy; {year} {SITE_NAME}. Made in Canada.
        </div>
      </div>
    </footer>
  );
}
