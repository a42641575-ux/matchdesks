'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { fraudReportSchema, type FraudReportState } from '@/lib/validation';

export async function submitFraudReport(
  jobId: string,
  _prevState: FraudReportState,
  formData: FormData,
): Promise<FraudReportState> {
  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim();
  const rl = rateLimit(`fraud:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return {
      ok: false,
      message: 'You have submitted too many reports from this network. Please try again later.',
    };
  }

  const parsed = fraudReportSchema.safeParse({
    jobId,
    reason: formData.get('reason'),
    details: formData.get('details'),
    reporterEmail: formData.get('reporterEmail'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the errors below.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const job = await prisma.job.findUnique({ where: { id: parsed.data.jobId }, select: { id: true } });
  if (!job) {
    return { ok: false, message: 'This job posting could not be found — it may have already been removed.' };
  }

  await prisma.fraudReport.create({
    data: {
      jobId: parsed.data.jobId,
      reason: parsed.data.reason,
      details: parsed.data.details,
      reporterEmail: parsed.data.reporterEmail,
    },
  });

  return {
    ok: true,
    message:
      'Thanks — our team will review this posting. We take fraud reports seriously and handle them per our published fraud policy.',
  };
}
