import crypto from 'node:crypto';
import { SITE_URL } from './constants';

// Instant-indexing for search engines — the top free lever for a new job board.
// - Bing IndexNow: batch-submit URLs to Bing's IndexNow API (instant Bing indexing).
//   Requires the key file at /<INDEXNOW_KEY>.txt (served from /public).
// - Google Indexing API: per-URL submit (instant Google indexing for JobPosting /
//   livestream pages — the legit fast-path into Google for Jobs). Requires a
//   Google Cloud service account with the Indexing API enabled and Search Console
//   owner on the domain; pass the JSON key via GOOGLE_INDEXING_SERVICE_ACCOUNT.
// Both skip silently if not configured so the app keeps working.

export const INDEXNOW_KEY = '1f56910f087f4710b8dea01d178b20ae';

function hostOf(): string {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return '';
  }
}

// --- Bing IndexNow ---
export async function notifyIndexNow(urls: string | string[]): Promise<void> {
  const list = Array.isArray(urls) ? urls : [urls];
  if (list.length === 0) return;
  const host = hostOf();
  if (!host) return;
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: list,
      }),
    });
    if (!res.ok && res.status !== 200 && res.status !== 202) {
      console.error(`[indexing] IndexNow failed (${res.status}):`, await res.text());
    }
  } catch (err) {
    console.error('[indexing] IndexNow error:', err);
  }
}

// --- Google Indexing API ---
interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function mintAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(sa.private_key.replace(/\\n/g, '\n'));
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`token endpoint ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function notifyGoogleIndexing(
  url: string,
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED',
): Promise<void> {
  const sa = getServiceAccount();
  if (!sa) return; // not configured — skip silently
  try {
    const token = await mintAccessToken(sa);
    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, type }),
    });
    if (!res.ok) {
      console.error(`[indexing] Google Indexing failed (${res.status}):`, await res.text());
    }
  } catch (err) {
    console.error('[indexing] Google Indexing error:', err);
  }
}

// Convenience: ping both Google Indexing API and Bing IndexNow for one URL.
export async function notifySearchEngines(
  url: string,
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED',
): Promise<void> {
  await Promise.allSettled([
    notifyGoogleIndexing(url, type),
    type === 'URL_UPDATED' ? notifyIndexNow([url]) : Promise.resolve(),
  ]);
}
