import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Submission received',
  description: 'Your job posting has been received and is pending review.',
  robots: { index: false, follow: false },
};

export default function PostPendingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Submission received</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Thanks — your job posting has been submitted and is now <strong>pending review</strong>. Our team
          reviews new listings to keep MatchDesks free of scams and spam. Once approved, it will appear in
          search results and on the home page. You will not need to resubmit.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          This page is not indexed. You can close this tab.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/post"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Post another job
          </Link>
          <Link
            href="/jobs"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Browse jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
