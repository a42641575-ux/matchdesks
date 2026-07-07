import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { BLOG_POSTS } from '@/lib/blog-posts';
import { buildBreadcrumbLd } from '@/lib/schema-org';
import { formatDateLong } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Career advice & job market insights',
  description: `Guides and data-driven reports on Canadian jobs, salaries, and the job market — from the ${SITE_NAME} team.`,
  alternates: { canonical: '/blog' },
};

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd data={buildBreadcrumbLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
      ])} />
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Career advice &amp; job market insights</h1>
      <p className="mt-2 text-sm text-gray-500">Guides and reports to help you find and land a job in Canada.</p>
      <ul className="mt-8 space-y-6">
        {posts.map((post) => (
          <li key={post.slug} className="border-b border-gray-100 pb-6">
            <Link href={`/blog/${post.slug}`} className="text-lg font-semibold text-gray-900 hover:text-red-600">
              {post.title}
            </Link>
            <p className="mt-1 text-xs text-gray-400">{formatDateLong(new Date(post.date))}</p>
            <p className="mt-2 text-sm text-gray-600">{post.description}</p>
            <Link href={`/blog/${post.slug}`} className="mt-2 inline-block text-sm font-medium text-red-600 hover:underline">
              Read more →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
