import { SITE_NAME, SITE_URL } from './constants';

// Transactional email via Brevo's v3 API (no SDK dependency — just fetch).
// If BREVO_API_KEY is not set, sends are skipped silently so the app keeps
// working without email configured.
//
// All emails use a shared Apple-style branded shell (centered white card,
// red "M" logo mark, SF-style typography, refined footer). The logo mark is
// pure HTML/CSS so it renders even when the email client blocks images.

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

function btn(href: string, label: string): string {
  return `<a class="btn" href="${href}">${escapeHtml(label)}</a>`;
}

// Shared branded email shell.
function emailShell(title: string, bodyHtml: string): string {
  const domain = domainFromSiteUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body{margin:0;padding:0;background:#f5f5f7;-webkit-text-size-adjust:100%;}
  table{border-collapse:collapse;}
  .card{max-width:560px;background:#ffffff;border:1px solid #e8e8ed;border-radius:18px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
  .head{padding:28px 40px 6px;text-align:center;}
  .mark{display:inline-block;width:40px;height:40px;line-height:40px;border-radius:11px;background:#dc2626;color:#ffffff;font-weight:700;font-size:22px;text-align:center;}
  .brand{font-size:17px;font-weight:600;color:#1d1d1f;margin-left:10px;vertical-align:middle;}
  .body{padding:24px 40px 32px;color:#1d1d1f;font-size:15px;line-height:1.6;}
  .body h2{font-size:19px;font-weight:600;margin:0 0 14px;color:#1d1d1f;}
  .body p{margin:0 0 14px;}
  .body ul{margin:0 0 18px;padding-left:20px;}
  .body li{margin-bottom:6px;}
  .muted{color:#6e6e73;}
  .btn{display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;}
  .btn+.btn{margin-top:10px;}
  .foot{padding:20px 40px 28px;border-top:1px solid #f0f0f3;font-size:12px;color:#86868b;line-height:1.5;text-align:center;}
  .foot a{color:#86868b;text-decoration:none;}
</style>
</head>
<body>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" class="card" cellpadding="0" cellspacing="0" width="560">
        <tr><td class="head">
          <span class="mark">M</span><span class="brand">${escapeHtml(SITE_NAME)}</span>
        </td></tr>
        <tr><td class="body">
          ${bodyHtml}
        </td></tr>
        <tr><td class="foot">
          ${escapeHtml(SITE_NAME)} &middot; Canadian jobs, coast to coast.<br>
          <a href="${SITE_URL}">${escapeHtml(domain)}</a> &middot; Made in Canada.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
  const body = `
    <h2>New job pending review</h2>
    <p><strong>${escapeHtml(title)}</strong> at ${escapeHtml(companyName)}</p>
    <ul>
      <li>Category: ${escapeHtml(category)}</li>
    </ul>
    <p>${btn(`${SITE_URL}/jobs/${encodeURIComponent(slug)}`, 'View the posting')}</p>
    <p>${btn(`${SITE_URL}/admin`, 'Review & publish in admin')}</p>
  `;
  return notifyAdmin({
    subject: `[${SITE_NAME}] New job pending review: ${title}`,
    html: emailShell(`New job pending review: ${title}`, body),
  });
}

// Sent to the employer when their pending job is approved and goes live.
// Skips silently if Brevo isn't configured OR if the poster left the optional
// postedByEmail field blank when submitting.
export async function notifyJobApproved(input: {
  to: string;
  jobTitle: string;
  companyName: string;
  slug: string;
}): Promise<void> {
  const { to, jobTitle, companyName, slug } = input;
  const body = `
    <h2>Your job posting is live</h2>
    <p>Hi there,</p>
    <p>Your posting for <strong>${escapeHtml(jobTitle)}</strong> at ${escapeHtml(companyName)} has been approved and is now live on ${SITE_NAME}.</p>
    <p>${btn(`${SITE_URL}/jobs/${encodeURIComponent(slug)}`, 'View your live posting')}</p>
    <p class="muted">Your posting will remain active for 30 days. Candidates can apply using the instructions on the listing. Thanks for hiring on ${SITE_NAME}.</p>
  `;
  await sendBrevoEmail({
    to,
    from: fromAddress(),
    subject: `Your job posting is live on ${SITE_NAME}`,
    html: emailShell(`Your job posting is live`, body),
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
  const body = `
    <h2>Fraud report submitted</h2>
    <p><strong>Job:</strong> ${escapeHtml(jobTitle)}</p>
    <ul>
      <li><strong>Reason:</strong> ${escapeHtml(reason)}</li>
      <li><strong>Reporter email:</strong> ${escapeHtml(reporterEmail ?? '—')}</li>
      <li><strong>Details:</strong> ${escapeHtml(details ?? '—')}</li>
    </ul>
    <p>${btn(`${SITE_URL}/jobs/${encodeURIComponent(jobSlug)}`, 'View the reported posting')}</p>
    <p>${btn(`${SITE_URL}/admin`, 'Open admin')}</p>
  `;
  return notifyAdmin({
    subject: `[${SITE_NAME}] Fraud report: ${reason} — ${jobTitle}`,
    html: emailShell(`Fraud report: ${reason}`, body),
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
  const body = `
    <h2>Thanks for reaching out</h2>
    <p>Hi ${escapeHtml(input.name || 'there')},</p>
    <p>We&rsquo;ve received your message${label ? ` about ${escapeHtml(label)}` : ''} and will reply within 1&ndash;2 business days.</p>
    <p class="muted">If you have more to add, just reply to this email.</p>
  `;
  return sendBrevoEmail({
    to: input.to,
    from: fromAddress(),
    replyTo: { name: SITE_NAME, email: replyToAddr },
    subject: `Thanks for contacting ${SITE_NAME}`,
    html: emailShell(`Thanks for contacting ${SITE_NAME}`, body),
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
  const body = `
    <h2>New contact inquiry</h2>
    <ul>
      <li><strong>Name:</strong> ${escapeHtml(input.name)}</li>
      <li><strong>Email:</strong> ${escapeHtml(input.email)}</li>
      <li><strong>Category:</strong> ${escapeHtml(categoryLabel(input.category))}</li>
      <li><strong>Subject:</strong> ${escapeHtml(input.subject ?? '—')}</li>
    </ul>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(input.message).replace(/\n/g, '<br>')}</p>
    <p>${btn(`mailto:${encodeURIComponent(input.email)}`, `Reply to ${input.name}`)}</p>
  `;
  await sendBrevoEmail({
    to,
    from: fromAddress(),
    replyTo: { name: input.name, email: input.email },
    subject: `[${SITE_NAME}] Contact: ${input.subject || categoryLabel(input.category)}`,
    html: emailShell(`Contact: ${input.subject || categoryLabel(input.category)}`, body),
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
