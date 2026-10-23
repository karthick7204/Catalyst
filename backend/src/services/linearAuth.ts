import crypto from 'crypto';

/**
 * Verifies Linear webhook signature using HMAC-SHA256 and constant-time comparison.
 *
 * @param rawBody - The raw unparsed Buffer of the HTTP request body
 * @param signatureHeader - Value of 'Linear-Signature' header
 * @param secret - Webhook signing secret configured in Linear
 */
export function verifyLinearSignature(
  rawBody: Buffer | string | undefined,
  signatureHeader: string | string[] | undefined,
  secret: string
): boolean {
  if (!rawBody || !signatureHeader || !secret) {
    return false;
  }

  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (typeof signature !== 'string' || signature.trim() === '') {
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
    hmac.update(bodyBuffer);
    const computedSignature = hmac.digest('hex');

    const expectedBuffer = Buffer.from(computedSignature, 'utf8');
    const providedBuffer = Buffer.from(signature.trim(), 'utf8');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch (error) {
    console.error('[LinearAuth] Error during signature verification:', error);
    return false;
  }
}
