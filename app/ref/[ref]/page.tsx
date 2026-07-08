import { notFound, redirect } from 'next/navigation';
import { getJobByPublicRef } from '@/lib/search';

// Shortcut: /ref/MD-7TCKQM  →  the job page (active, expired, or 404).
// Lets employers look up a posting by its public reference, as promised on
// the posting-policy page. The route is noindex (it's a redirect, not content).

export const dynamic = 'force-dynamic';

interface RefPageProps {
  params: Promise<{ ref: string }>;
}

export const metadata = { robots: { index: false, follow: false } };

export default async function RefPage({ params }: RefPageProps) {
  const { ref } = await params;
  const job = await getJobByPublicRef(ref);
  if (!job) notFound();

  // ACTIVE / EXPIRED both render at /jobs/[slug] (the job page handles the
  // expired view internally based on status + expiresAt). REMOVED jobs 404
  // at that route, which is the correct behavior (gone is gone).
  redirect(`/jobs/${job.slug}`);
}

