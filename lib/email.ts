import { SITE_NAME, SITE_URL } from './constants';

// Transactional email via Brevo's v3 API (no SDK dependency — just fetch).
// If BREVO_API_KEY / ADMIN_NOTIFY_EMAIL are not set, notifications are skipped
// silently so the app keeps working without email configured.

interface AdminNotification {
  subject: string;
  html: string;
}

function domainFromSiteUrl(): string {
  return SITE_URL.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function fromAddress(): { name: string; email: string } {
  const email = process.env.CONTACT_FROM_EMAIL ?? `hello@${domainFromSiteUrl()}`;
  return { name: SITE_NAME, email };
}

function adminNotifyTo(): string | undefined {
  return process.env.ADMIN_NOTIFY_EMAIL;
}

function brevoApiKey(): string | undefined {
  return process.env.BREVO_API_KEY;
}

export function isEmailConfigured(): boolean {
  return Boolean(brevoApiKey() && adminNotifyTo());
}

export async function notifyAdmin({ subject, html }: AdminNotification): Promise<void> {
  const apiKey = brevoApiKey();
  const to = adminNotifyTo();
  if (!apiKey || !to) return; // email not configured — skip silently

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: fromAddress(),
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[email] Brevo send failed (${res.status}):`, text);
    }
  } catch (err) {
    console.error('[email] notifyAdmin error:', err);
  }
}

export function notifyNewPendingJob(input: {
  title: string;
  companyName: string;
  category: string;
  slug: string;
}): Promise<void> {
  const { title, companyName, category, slug } = input;
  return notifyAdmin({
    subject: `[${SITE_NAME}] New job pending review: ${title}`,
    html: `
      <h2>New job submission pending review</h2>
      <p><strong>${escapeHtml(title)}</strong> at ${escapeHtml(companyName)}</p>
      <ul>
        <li>Category: ${escapeHtml(category)}</li>
        <li><a href="${SITE_URL}/jobs/${encodeURIComponent(slug)}">View the posting</a></li>
        <li><a href="${SITE_URL}/admin">Review &amp; publish in admin →</a></li>
      </ul>
    `,
  });
}

export function notifyFraudReport(input: {
  jobTitle: string;
  jobSlug: string;
  reason: string;
  details?: string | null;
  reporterEmail?: string | null;
}): Promise<void> {
  const { jobTitle, jobSlug, reason, details, reporterEmail } = input;
  return notifyAdmin({
    subject: `[${SITE_NAME}] Fraud report: ${reason} — ${jobTitle}`,
    html: `
      <h2>Fraud report submitted</h2>
      <p><strong>Job:</strong> ${escapeHtml(jobTitle)}</p>
      <ul>
        <li><strong>Reason:</strong> ${escapeHtml(reason)}</li>
        <li><strong>Reporter email:</strong> ${escapeHtml(reporterEmail ?? '—')}</li>
        <li><strong>Details:</strong> ${escapeHtml(details ?? '—')}</li>
        <li><a href="${SITE_URL}/jobs/${encodeURIComponent(jobSlug)}">View the reported posting</a></li>
        <li><a href="${SITE_URL}/admin">Open admin →</a></li>
      </ul>
    `,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
