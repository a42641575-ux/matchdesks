import 'dotenv/config';
import crypto from 'node:crypto';
import { SITE_URL } from '../lib/constants';

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function main(): Promise<void> {
  const raw = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT;
  if (!raw) {
    console.error('GOOGLE_INDEXING_SERVICE_ACCOUNT not set');
    process.exit(1);
  }
  const sa = JSON.parse(raw) as { client_email: string; private_key: string };
  console.log('Service account:', sa.client_email);

  // Mint a JWT and exchange it for an access token.
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

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  console.log('Token endpoint status:', tokenRes.status);
  if (!tokenRes.ok) {
    console.error('Token error:', await tokenRes.text());
    process.exit(1);
  }
  const tokenData = (await tokenRes.json()) as { access_token: string };
  console.log('Access token minted ✓');

  // Submit a real job URL for indexing.
  const url = `${SITE_URL}/jobs/welder-fabricator-lakeside-education-partners`;
  console.log('Submitting URL:', url);
  const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${tokenData.access_token}`,
    },
    body: JSON.stringify({ url, type: 'URL_UPDATED' }),
  });
  console.log('Indexing API status:', res.status);
  console.log('Indexing API response:', await res.text());
}

main().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
