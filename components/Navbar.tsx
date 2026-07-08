import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';

export function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
            M
          </span>
          <span className="text-lg font-semibold tracking-tight text-gray-900">{SITE_NAME}</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-gray-700">
          <Link href="/jobs" className="hover:text-red-600">
            Find jobs
          </Link>
          <Link href="/jobs/remote" className="hover:text-red-600">
            Remote
          </Link>
          <Link href="/salaries" className="hover:text-red-600">
            Salaries
          </Link>
          <Link href="/blog" className="hover:text-red-600">
            Blog
          </Link>
        </nav>

        <Link
          href="/post"
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Post a job
        </Link>
      </div>
    </header>
  );
}
