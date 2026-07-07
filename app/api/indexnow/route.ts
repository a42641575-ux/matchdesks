import { NextRequest, NextResponse } from 'next/server';
import { notifyIndexNow } from '@/lib/indexing';
import { SITE_URL } from '@/lib/constants';

// Manually trigger an IndexNow (Bing) batch submission for any set of site URLs.
// Token-protected so only the operator can fire it — mirrors the same endpoint on
// thefoods-that-shaped-us. Auth via Bearer token or x-indexnow-token header,
// checked against INDEXNOW_ADMIN_TOKEN.
//
// Usage:
//   curl -X POST https://matchdesks.com/api/indexnow \
//     -H "Authorization: Bearer $INDEXNOW_ADMIN_TOKEN" \
//     -H "content-type: application/json" \
//     -d '{"urls":["https://matchdesks.com/", "..."], "slugs":["some-job-slug"]}'
//
// `slugs` are treated as job slugs -> https://matchdesks.com/jobs/<slug>.

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const token = process.env.INDEXNOW_ADMIN_TOKEN?.trim();
  if (!token) return false; // not configured -> always reject
  const authorization = request.headers.get('authorization');
  const headerToken = request.headers.get('x-indexnow-token');
  return authorization === `Bearer ${token}` || headerToken === token;
}

function jobSlugToUrl(slug: string): string {
  const clean = slug.replace(/^\/+|\/+$/g, '');
  return `${SITE_URL}/jobs/${clean}`;
}

export async function POST(request: NextRequest): Promise<Response> {
  const token = process.env.INDEXNOW_ADMIN_TOKEN;
  if (!token || token.trim() === '' || token === 'change-me') {
    // Diagnostic: report presence + shape of the env var (NOT the value).
    const tokenInfo = token
      ? { present: true, length: token.length, first2: token.slice(0, 2), last2: token.slice(-2) }
      : { present: false };
    return NextResponse.json(
      {
        success: false,
        error: 'IndexNow is not configured (INDEXNOW_ADMIN_TOKEN missing, empty, or placeholder).',
        debug: {
          token: tokenInfo,
          expectedLength: 48,
          expectedFirst2: 'a7',
          expectedLast2: '73',
        },
      },
      { status: 501 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  let body: { urls?: string[]; slugs?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const urls = Array.isArray(body.urls) ? body.urls : [];
  const slugUrls = Array.isArray(body.slugs) ? body.slugs.map(jobSlugToUrl) : [];
  const all = [...urls, ...slugUrls];

  if (all.length === 0) {
    return NextResponse.json({ success: false, error: 'No URLs or slugs provided.' }, { status: 400 });
  }

  await notifyIndexNow(all);

  return NextResponse.json({
    success: true,
    submitted: all.length,
    note: 'IndexNow accepts the batch silently; verify in Bing Webmaster Tools.',
  });
}
