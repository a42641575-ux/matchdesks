import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: `The terms governing use of ${SITE_NAME}.`,
};

const LAST_UPDATED = 'July 2, 2026';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Terms of Use</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Early-stage placeholder:</strong> these are baseline terms for the MVP. Before general availability
        they need review by legal counsel, including French localization of the posting flow and these terms for
        Quebec under Bill 96.
      </div>

      <div className="mt-8 space-y-10 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Acceptance of terms</h2>
          <p className="mt-2">
            By using {SITE_NAME} (the &quot;Service&quot;) you agree to these terms. If you don&apos;t agree, please
            don&apos;t use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">The Service</h2>
          <p className="mt-2">
            {SITE_NAME} is a job board that lists job postings for positions across Canada and lets employers submit
            new postings. We don&apos;t employ job seekers or employers, and we&apos;re not a party to any employment
            relationship formed through the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Employer responsibilities</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Postings must be for genuine, currently available positions at a real organization.</li>
            <li>Postings must comply with applicable employment and human rights law, including provincial pay-transparency and AI-disclosure requirements.</li>
            <li>Postings must not request payment, banking details, or government ID numbers from applicants.</li>
            <li>We may remove any posting, or suspend an employer, for violating these terms or our fraud policy.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Job seeker responsibilities</h2>
          <p className="mt-2">
            Job seekers use the Service to discover postings and apply through the method the employer specifies. We
            encourage you to review our{' '}
            <a href="/fraud-policy" className="font-medium text-red-600 hover:underline">
              fraud policy
            </a>{' '}
            for tips on spotting scam postings before you apply.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">No warranty</h2>
          <p className="mt-2">
            We work to keep listings accurate and to act on fraud reports promptly, but we don&apos;t guarantee the
            accuracy, completeness, or legality of any posting, and we&apos;re not responsible for the hiring
            practices of any employer listed on the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Prohibited use</h2>
          <p className="mt-2">
            You may not scrape or bulk-download listings, post fraudulent or discriminatory content, impersonate
            another company or person, or otherwise misuse the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Changes to these terms</h2>
          <p className="mt-2">
            We may update these terms as the Service evolves. We&apos;ll update the &quot;Last updated&quot; date
            above when we do.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Governing law</h2>
          <p className="mt-2">These terms are governed by the laws of Canada and the province in which you reside.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          <p className="mt-2">
            Questions about these terms can be sent to{' '}
            <a href="mailto:hello@matchdesks.com" className="font-medium text-red-600 hover:underline">
              hello@matchdesks.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
