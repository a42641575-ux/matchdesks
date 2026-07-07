import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { buildBreadcrumbLd } from '@/lib/schema-org';

export const metadata: Metadata = {
  title: 'Posting policy',
  description: `How job postings work on ${SITE_NAME}: 30-day expiry, reposting, job references, moderation, and employer requirements.`,
  alternates: { canonical: '/posting-policy' },
};

export default function PostingPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd data={buildBreadcrumbLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Posting policy', url: `${SITE_URL}/posting-policy` },
      ])} />

      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Posting policy</h1>
      <p className="mt-2 text-sm text-gray-500">
        How job postings work on {SITE_NAME} — for employers and job seekers.
      </p>

      <div className="prose-like mt-8 space-y-8 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-base font-semibold text-gray-900">Listings expire after 30 days</h2>
          <p className="mt-2">
            Every job posting on {SITE_NAME} is active for <strong>30 days</strong> from the time it is published.
            After 30 days, the listing expires and is no longer shown in search results, and the job page displays
            a &ldquo;this role is no longer accepting applications&rdquo; notice instead of the apply form.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">To keep a role live, repost it</h2>
          <p className="mt-2">
            {SITE_NAME} does not auto-renew listings. If a role is still open after 30 days, the employer should{' '}
            <Link href="/post" className="font-medium text-red-600 hover:underline">repost it</Link>. A repost creates
            a fresh 30-day listing (and a new job reference) so candidates see current, active opportunities — and so
            stale, filled roles don&apos;t clutter search results.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Job references (MD-XXXXXX)</h2>
          <p className="mt-2">
            Each posting is assigned a short, unique reference (for example, <code>MD-7K3X9</code>) shown on the job
            page. Keep this reference — it helps you identify a posting when contacting {SITE_NAME}, reporting an
            issue, or reposting a similar role.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Moderation &amp; review</h2>
          <p className="mt-2">
            New postings are reviewed by our team before they appear publicly. This keeps {SITE_NAME} free of spam,
            duplicates, and fraudulent listings. Once approved, a posting goes live and is submitted to search
            engines (including Google for Jobs). Postings that violate our{' '}
            <Link href="/fraud-policy" className="font-medium text-red-600 hover:underline">fraud policy</Link> may be
            removed at any time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Employer requirements</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>A clear compensation range is required on every posting (pay-transparency rules apply in several Canadian provinces).</li>
            <li>If AI is used to screen or assess applicants, it must be disclosed on the posting.</li>
            <li>Postings must describe a real, open role. Misleading, duplicate, or fraudulent postings are removed.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Questions?</h2>
          <p className="mt-2">
            See our <Link href="/fraud-policy" className="font-medium text-red-600 hover:underline">fraud policy</Link> or{' '}
            <Link href="/contact" className="font-medium text-red-600 hover:underline">contact us</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
