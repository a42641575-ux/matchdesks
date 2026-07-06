'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { adminToken, clearAdminCookie, isAuthConfigured, isAdmin, setAdminCookie } from '@/lib/admin';

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
  await prisma.job.update({ where: { id: jobId }, data: { status: 'ACTIVE' } });
  revalidatePath('/admin');
  revalidatePath('/jobs');
  revalidatePath('/');
}

export async function removeJob(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect('/admin');
  const jobId = String(formData.get('jobId') ?? '');
  if (!jobId) return;
  await prisma.job.update({ where: { id: jobId }, data: { status: 'REMOVED' } });
  revalidatePath('/admin');
  revalidatePath('/jobs');
  revalidatePath('/');
}
