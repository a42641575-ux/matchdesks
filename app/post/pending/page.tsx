import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Submission received',
  description: 'Your job posting has been received and is pending review.',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function PostPendingPage({ searchParams }: PageProps) {
  const { ref } = await searchParams;
  const cleanRef = ref?.trim().slice(0, 16) || null;

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

        {cleanRef && (
          <div className="mt-5 rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p>
              Your job reference is{' '}
              <strong className="font-mono tracking-wide text-gray-900">{cleanRef}</strong>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Keep it — you&apos;ll need it to reference this posting or repost the role after it expires.{' '}
              <Link href="/posting-policy" className="text-red-600 hover:underline">Read the posting policy</Link>.
            </p>
          </div>
        )}

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
