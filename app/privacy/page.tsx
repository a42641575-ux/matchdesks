import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} collects, uses, and protects personal information.`,
};

const LAST_UPDATED = 'July 2, 2026';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Early-stage placeholder:</strong> this policy accurately describes what {SITE_NAME} collects today,
        as a small MVP. Before we accept users at scale, it needs review by legal counsel familiar with PIPEDA and
        applicable provincial laws — including Quebec&apos;s Law 25 and its French-language requirements, and the
        substantially-similar regimes in British Columbia and Alberta.
      </div>

      <div className="mt-8 space-y-10 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Who this applies to</h2>
          <p className="mt-2">
            This policy covers personal information collected through {SITE_NAME} (the &quot;Service&quot;),
            operated for job seekers and employers in Canada. It is governed by the federal Personal Information
            Protection and Electronic Documents Act (PIPEDA), and by provincial privacy legislation where it applies
            instead of or alongside PIPEDA.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">What we collect today</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Job postings:</strong> the company and contact details an employer submits when posting a job
              (company name, website, description, application email or URL).
            </li>
            <li>
              <strong>Fraud reports:</strong> the reason, optional details, and optional reporter email submitted
              through the &quot;Report this posting&quot; form.
            </li>
            <li>
              <strong>Standard server logs:</strong> basic technical request logs kept for security and reliability.
            </li>
          </ul>
          <p className="mt-2">
            We do not yet support accounts, resume uploads, or applying directly through the Service — job seekers
            apply via the employer&apos;s own link or email. Those features, along with any related analytics or
            advertising cookies, will get their own privacy review before they launch.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">How we use it</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>To publish and display job postings on the Service.</li>
            <li>To review and act on fraud reports, per our fraud policy.</li>
            <li>To operate, secure, and improve the Service.</li>
          </ul>
          <p className="mt-2">We do not sell personal information.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Your rights</h2>
          <p className="mt-2">
            Under PIPEDA and applicable provincial law, you can ask what personal information we hold about you,
            request corrections, or ask us to delete it where we&apos;re not required to keep it. Contact us using
            the details below to make a request.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Data retention</h2>
          <p className="mt-2">
            Job postings are retained while active and for a reasonable period afterward for record-keeping. Fraud
            reports are retained in line with our{' '}
            <a href="/fraud-policy" className="font-medium text-red-600 hover:underline">
              fraud policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          <p className="mt-2">
            Privacy questions or requests can be submitted via our{' '}
            <Link href="/contact?category=privacy" className="font-medium text-red-600 hover:underline">
              contact form
            </Link>
            . You&apos;ll receive an automatic confirmation, and we&apos;ll reply within 1–2 business days.
          </p>
        </section>
      </div>
    </div>
  );
}
