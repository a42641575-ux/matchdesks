import type { Metadata } from 'next';
import Link from 'next/link';
import { PostJobForm } from './PostJobForm';

export const metadata: Metadata = {
  title: 'Post a job',
  description: 'Post a job to MatchDesks for free. Reach job seekers across Canada with a compliant, transparent listing.',
};

export default function PostJobPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Post a job</h1>
      <p className="mt-2 text-sm text-gray-600">
        Free while we grow. Every posting includes a clear salary range and fraud-reporting tools — the transparency
        Canadian job seekers increasingly expect, and provinces increasingly require.
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Listings are active for 30 days, then expire. To keep a role live, repost it.{' '}
        <Link href="/posting-policy" className="font-medium text-red-600 hover:underline">Read the posting policy</Link>.
      </p>

      <div className="mt-8">
        <PostJobForm />
      </div>
    </div>
  );
}
