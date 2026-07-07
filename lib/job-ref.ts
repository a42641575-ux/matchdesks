import crypto from 'node:crypto';
import { prisma } from './db';

// Short, human-readable job reference shown on postings + expired pages.
// Format: MD-XXXXXX (6 base36 chars). Collisions are astronomically unlikely
// (~36^6 ≈ 2.2B); we still uniqueness-check against the DB and retry.
const PREFIX = 'MD-';
const SEGMENT_LENGTH = 6;
const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomSegment(len: number): string {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += CHARSET[bytes[i] % CHARSET.length];
  return out;
}

export async function generateJobRef(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const ref = PREFIX + randomSegment(SEGMENT_LENGTH);
    const exists = await prisma.job.findUnique({
      where: { publicRef: ref },
      select: { id: true },
    });
    if (!exists) return ref;
  }
  // Fallback: lengthen the tail if we somehow keep colliding.
  return PREFIX + randomSegment(SEGMENT_LENGTH) + randomSegment(3);
}
