'use server';

import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { notifyContactInquiry, sendContactConfirmation } from '@/lib/email';
import { contactFormSchema, type ContactFormState } from '@/lib/validation';

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot: a hidden field humans leave blank; bots often fill it.
  const honey = String(formData.get('website') ?? '').trim();

  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim();
  const rl = rateLimit(`contact:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return {
      ok: false,
      message: 'You have sent too many messages from this network. Please try again later.',
    };
  }

  const parsed = contactFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the errors below.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // Bot caught by honeypot — pretend success without actually sending.
  if (honey) {
    return { ok: true, message: 'Thanks for reaching out! We will reply within 1–2 business days.' };
  }

  // (1) auto-confirmation to the visitor, (2) notify the operator — in parallel.
  await Promise.all([
    sendContactConfirmation({ to: data.email, name: data.name, category: data.category }),
    notifyContactInquiry({
      name: data.name,
      email: data.email,
      category: data.category,
      subject: data.subject,
      message: data.message,
    }),
  ]);

  return {
    ok: true,
    message:
      'Thanks for reaching out! We received your message and sent a confirmation to your email. We will reply within 1–2 business days.',
  };
}
