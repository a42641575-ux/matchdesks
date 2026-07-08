'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { adminToken, clearAdminCookie, isAuthConfigured, isAdmin, setAdminCookie } from '@/lib/admin';
import { notifySearchEngines } from '@/lib/indexing';
import { notifyJobApproved } from '@/lib/email';
import { SITE_URL } from '@/lib/constants';

export interface AdminLoginState {
  ok: boolean;
  message?: string;
}

const TOKEN_SALT = 'matchdesks-admin-v1';

export async function adminLogin(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  if (!isAuthConfigured()) {
    return { ok: false, message: 'Admin login is not configured — set ADMIN_SECRET in the environment.' };
  }
  const submitted = String(formData.get('password') ?? '');
  const expected = adminToken();
  if (!submitted || !expected) {
    return { ok: false, message: 'Incorrect password.' };
  }
  const submittedToken = crypto.createHmac('sha256', submitted).update(TOKEN_SALT).digest('hex');
  const a = Buffer.from(submittedToken);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, message: 'Incorrect password.' };
  }
  await setAdminCookie();
  revalidatePath('/admin');
  return { ok: true, message: 'Signed in.' };
}

export async function adminLogout(): Promise<void> {
  await clearAdminCookie();
  revalidatePath('/admin');
  redirect('/admin');
}

export async function approveJob(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect('/admin');
  const jobId = String(formData.get('jobId') ?? '');
  if (!jobId) return;
  const job = await prisma.job.update({
    where: { id: jobId },
    data: { status: 'ACTIVE' },
    select: { slug: true, title: true, postedByEmail: true, company: { select: { name: true } } },
  });
  revalidatePath('/admin');
  revalidatePath('/jobs');
  revalidatePath('/');
  // Fast-path into Google for Jobs + Bing: notify search engines immediately.
  await notifySearchEngines(`${SITE_URL}/jobs/${job.slug}`, 'URL_UPDATED');

  // Notify the employer their posting is live (only if they gave us an email).
  // Wrapped so a Brevo failure never blocks the approve action.
  if (job.postedByEmail) {
    try {
      await notifyJobApproved({
        to: job.postedByEmail,
        jobTitle: job.title,
        companyName: job.company.name,
        slug: job.slug,
      });
    } catch (err) {
      console.error('[approveJob] failed to send employer notification:', err);
    }
  }
}

export async function removeJob(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect('/admin');
  const jobId = String(formData.get('jobId') ?? '');
  if (!jobId) return;
  const job = await prisma.job.update({
    where: { id: jobId },
    data: { status: 'REMOVED' },
    select: { slug: true },
  });
  revalidatePath('/admin');
  revalidatePath('/jobs');
  revalidatePath('/');
  // Tell Google the page is gone so it drops from Google for Jobs quickly.
  await notifySearchEngines(`${SITE_URL}/jobs/${job.slug}`, 'URL_DELETED');
}
