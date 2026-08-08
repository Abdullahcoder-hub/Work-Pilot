import crypto from 'crypto';

export interface RawToken {
  /** Sent to the user (in the email link). Never stored. */
  raw: string;
  /** Stored on the document. The raw token can't be recovered from this. */
  hashed: string;
}

/** Generates a random token and its SHA-256 hash — same pattern used for
 * email verification, invite acceptance, and password reset tokens so a
 * leaked database never exposes usable links. */
export function generateRawToken(): RawToken {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hashed };
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
