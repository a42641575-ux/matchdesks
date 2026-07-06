import type { Metadata } from 'next';
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

      <div className="mt-8">
        <PostJobForm />
      </div>
    </div>
  );
}
