import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { BLOG_POSTS, getBlogPost } from '@/lib/blog-posts';
import { buildArticleLd, buildBreadcrumbLd } from '@/lib/schema-org';
import { formatDateLong } from '@/lib/format';

export const revalidate = 3600;

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: `${SITE_URL}/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const others = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);
  const canonical = `${SITE_URL}/blog/${post.slug}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd data={buildArticleLd({
        siteUrl: SITE_URL,
        siteName: SITE_NAME,
        title: post.title,
        description: post.description,
        slug: post.slug,
        datePublished: new Date(post.date).toISOString(),
        dateModified: post.updated ? new Date(post.updated).toISOString() : undefined,
      })} />
      <JsonLd data={buildBreadcrumbLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
        { name: post.title, url: canonical },
      ])} />

      <nav className="text-sm text-gray-500">
        <Link href="/blog" className="hover:text-red-600">Blog</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">{post.title}</span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{post.title}</h1>
      <p className="mt-2 text-xs text-gray-400">{formatDateLong(new Date(post.date))}</p>

      <article
        className="prose-like mt-8 space-y-4 text-sm leading-relaxed text-gray-700 [&_a]:font-medium [&_a]:text-red-600 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_p]:text-gray-700"
        dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
      />

      <section className="mt-12 border-t border-gray-100 pt-8">
        <h2 className="text-base font-semibold text-gray-900">More from the blog</h2>
        <ul className="mt-4 space-y-2">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={`/blog/${o.slug}`} className="text-sm text-red-600 hover:underline">{o.title}</Link>
            </li>
          ))}
        </ul>
        <Link href="/jobs" className="mt-6 inline-block rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Browse jobs →</Link>
      </section>
    </div>
  );
}
