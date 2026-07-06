import type { Metadata } from 'next';
import Link from 'next/link';
import { FRAUD_REPORT_REASONS, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Fraud Policy & Reporting',
  description: `How ${SITE_NAME} identifies, reports on, and handles fraudulent job postings.`,
};

const LAST_UPDATED = 'July 2, 2026';

export default function FraudPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Fraud Policy &amp; Reporting</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
      <p className="mt-1 text-sm text-gray-500">
        This policy is version-dated and retained for at least three years after it stops being in effect, in line
        with Ontario&apos;s requirements for job-posting platforms.
      </p>

      <div className="mt-8 space-y-10 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Our commitment</h2>
          <p className="mt-2">
            {SITE_NAME} exists to connect job seekers with real employers across Canada. Scams, phishing attempts,
            and deceptive postings hurt everyone who uses this platform in good faith, so every job posting can be
            reported directly from its page, and every report is reviewed by a person on our team.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">How to report a posting</h2>
          <p className="mt-2">
            Every job posting on {SITE_NAME} has a <strong>&quot;Report this posting&quot;</strong> button. Selecting
            it opens a short form where you can choose a reason and add details. You can report a posting
            anonymously, or leave an email address if you&apos;re open to us following up with you.
          </p>
          <p className="mt-2">Reportable reasons include:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {FRAUD_REPORT_REASONS.map((reason) => (
              <li key={reason.value}>{reason.label}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">What we consider fraudulent or prohibited</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Asking candidates to pay for training, equipment, or a background check before being hired</li>
            <li>Requesting a Social Insurance Number, banking details, or a copy of a passport before an offer is made</li>
            <li>Postings for companies that don&apos;t exist, or that impersonate a real company</li>
            <li>Pyramid schemes, multi-level marketing, or &quot;be your own boss&quot; postings disguised as jobs</li>
            <li>Positions that are already filled but remain posted to harvest resumes</li>
            <li>Discriminatory requirements based on age, sex, disability, national origin, or other protected grounds</li>
            <li>Duplicate postings intended to manipulate search rankings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">What happens after you submit a report</h2>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>Your report is logged immediately and queued for review by our team.</li>
            <li>We review most reports within three business days.</li>
            <li>
              If a posting violates this policy, we remove it and may suspend the employer account or block future
              postings from the same company or contact details.
            </li>
            <li>If we can&apos;t substantiate a report, the posting stays up and no action is taken against it.</li>
            <li>
              Your identity and any email address you provide are kept confidential and are never shared with the
              employer being reported.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Protecting yourself as a job seeker</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>A legitimate employer will never ask you to pay money to get hired.</li>
            <li>Be cautious of interviews conducted entirely over chat apps with no video or phone call.</li>
            <li>Independently verify a company&apos;s website, domain age, and public presence before sharing personal information.</li>
            <li>Never send banking details, a SIN, or ID scans before you have a signed offer from a verified employer.</li>
            <li>If an offer feels rushed, too good to be true, or pressures you to decide immediately, treat it as a red flag.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Policy changes &amp; retention</h2>
          <p className="mt-2">
            When this policy changes, we update the &quot;Last updated&quot; date above and keep a record of prior
            versions for at least three years after they cease to be in effect.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          <p className="mt-2">
            Questions about this policy, or about a report you&apos;ve submitted, can be sent to{' '}
            <a href="mailto:trust@matchdesks.com" className="font-medium text-red-600 hover:underline">
              trust@matchdesks.com
            </a>
            . You can also read our{' '}
            <Link href="/privacy" className="font-medium text-red-600 hover:underline">
              privacy policy
            </Link>{' '}
            for details on how we handle personal information.
          </p>
        </section>
      </div>
    </div>
  );
}
