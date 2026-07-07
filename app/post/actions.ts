'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/format';
import { rateLimit } from '@/lib/rate-limit';
import { notifyNewPendingJob } from '@/lib/email';
import { generateJobRef } from '@/lib/job-ref';
import { jobPostSchema, type JobPostState } from '@/lib/validation';

export async function createJobPosting(_prevState: JobPostState, formData: FormData): Promise<JobPostState> {
  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim();
  const rl = rateLimit(`post:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return {
      ok: false,
      message: 'You have submitted too many job posts from this network. Please try again later.',
    };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = jobPostSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the errors below.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  let jobSlug: string;
  let publicRef = '';

  try {
    const companySlug = slugify(data.companyName);
    let company = await prisma.company.findUnique({ where: { slug: companySlug } });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: data.companyName,
          slug: companySlug,
          website: data.companyWebsite ?? null,
          description: data.companyDescription ?? null,
          city: data.city ?? null,
          province: data.province || null,
        },
      });
    }

    const baseSlug = slugify(`${data.title}-${data.companyName}`);
    jobSlug = baseSlug;
    let counter = 2;
    while (await prisma.job.findUnique({ where: { slug: jobSlug }, select: { id: true } })) {
      jobSlug = `${baseSlug}-${counter++}`;
    }

    publicRef = await generateJobRef();

    const postedAt = new Date();
    const expiresAt = new Date(postedAt);
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.job.create({
      data: {
        title: data.title,
        slug: jobSlug,
        publicRef,
        description: data.description,
        companyId: company.id,
        category: data.category,
        employmentType: data.employmentType,
        workArrangement: data.workArrangement,
        city: data.city || null,
        province: data.province || null,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax ?? null,
        salaryPeriod: data.salaryPeriod,
        compensationText: data.compensationText ?? null,
        aiScreeningUsed: data.aiScreeningUsed,
        aiScreeningDetails: data.aiScreeningUsed ? (data.aiScreeningDetails ?? null) : null,
        applyUrl: data.applyMethod === 'URL' ? (data.applyUrl ?? null) : null,
        applyEmail: data.applyMethod === 'EMAIL' ? (data.applyEmail ?? null) : null,
        source: 'NATIVE',
        status: 'PENDING_REVIEW',
        postedAt,
        expiresAt,
      },
    });
  } catch (err) {
    console.error('[createJobPosting] failed:', err);
    return { ok: false, message: 'Something went wrong while posting your job. Please try again.' };
  }

  await notifyNewPendingJob({
    title: data.title,
    companyName: data.companyName,
    category: data.category,
    slug: jobSlug,
  });

  redirect(`/post/pending?ref=${encodeURIComponent(publicRef)}`);
}
