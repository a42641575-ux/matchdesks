import { SITE_NAME, SITE_URL } from './constants';

// Transactional email via Brevo's v3 API (no SDK dependency — just fetch).
// If BREVO_API_KEY is not set, sends are skipped silently so the app keeps
// working without email configured.

interface SendEmailInput {
  to: string;
  from?: { name: string; email: string };
  replyTo?: { name: string; email: string };
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
  return Boolean(brevoApiKey());
}

// Map a contact category to the inbound address it corresponds to (used as
// Reply-To so replies route to the right ImprovMX-forwarded inbox) and a label.
const CATEGORY_INFO: Record<string, { address: string; label: string }> = {
  general: { address: `hello@${domainFromSiteUrl()}`, label: 'General' },
  privacy: { address: `privacy@${domainFromSiteUrl()}`, label: 'Privacy' },
  fraud: { address: `trust@${domainFromSiteUrl()}`, label: 'Fraud & safety' },
};

export function categoryLabel(category: string): string {
  return CATEGORY_INFO[category]?.label ?? 'General';
}

function categoryAddress(category: string): string {
  return CATEGORY_INFO[category]?.address ?? `hello@${domainFromSiteUrl()}`;
}

async function sendBrevoEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = brevoApiKey();
  if (!apiKey) return false; // email not configured — skip silently

  try {
    const body: Record<string, unknown> = {
      sender: input.from ?? fromAddress(),
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
    };
    if (input.replyTo) body.replyTo = input.replyTo;

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[email] Brevo send failed (${res.status}):`, text);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] sendBrevoEmail error:', err);
    return false;
  }
}

export async function notifyAdmin({ subject, html }: { subject: string; html: string }): Promise<void> {
  const to = adminNotifyTo();
  if (!to) return;
  await sendBrevoEmail({ to, subject, html });
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

// Auto-confirmation sent to a visitor who used the contact form.
export async function sendContactConfirmation(input: {
  to: string;
  name: string;
  category: string;
}): Promise<boolean> {
  const label = categoryLabel(input.category);
  const replyToAddr = categoryAddress(input.category);
  return sendBrevoEmail({
    to: input.to,
    from: fromAddress(),
    replyTo: { name: SITE_NAME, email: replyToAddr },
    subject: `Thanks for contacting ${SITE_NAME}`,
    html: `
      <p>Hi ${escapeHtml(input.name || 'there')},</p>
      <p>Thanks for reaching out to ${SITE_NAME}${label ? ` about ${escapeHtml(label)}` : ''}. We've received your message and will reply within 1–2 business days.</p>
      <p>If you have more to add, just reply to this email.</p>
      <p>— The ${SITE_NAME} team</p>
    `,
  });
}

// Notification to the operator that a contact inquiry was submitted.
export async function notifyContactInquiry(input: {
  name: string;
  email: string;
  category: string;
  subject?: string | null;
  message: string;
}): Promise<void> {
  const to = adminNotifyTo();
  if (!to) return;
  await sendBrevoEmail({
    to,
    from: fromAddress(),
    replyTo: { name: input.name, email: input.email },
    subject: `[${SITE_NAME}] Contact: ${input.subject || categoryLabel(input.category)}`,
    html: `
      <h2>New contact inquiry</h2>
      <ul>
        <li><strong>Name:</strong> ${escapeHtml(input.name)}</li>
        <li><strong>Email:</strong> ${escapeHtml(input.email)}</li>
        <li><strong>Category:</strong> ${escapeHtml(categoryLabel(input.category))}</li>
        <li><strong>Subject:</strong> ${escapeHtml(input.subject ?? '—')}</li>
      </ul>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(input.message).replace(/\n/g, '<br>')}</p>
      <p><a href="mailto:${escapeHtml(input.email)}">Reply to ${escapeHtml(input.name)} →</a></p>
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
