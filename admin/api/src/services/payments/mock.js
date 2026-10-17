import crypto from 'node:crypto';
import { WebhookAuthError } from '../../utils/errors.js';

// Development only: lets you test the whole flow with no gateway account.
// Set PAYMENT_PROVIDER=mock, then run scripts/simulate-payment.js to "pay". Disabled in production.
export const name = 'mock';
export const enabled = () => process.env.NODE_ENV !== 'production';
export const secret = () => process.env.MOCK_WEBHOOK_SECRET || 'dev-secret';

export async function createCheckout({ reference }) {
  return { url: `https://example.invalid/mock-checkout/${reference}` }; // not a real page
}

export async function parseWebhook(req) {
  const sent = Buffer.from(req.get('x-mock-signature') || '');
  const expected = Buffer.from(crypto.createHmac('sha256', secret()).update(req.body).digest('hex'));
  if (sent.length !== expected.length || !crypto.timingSafeEqual(sent, expected)) throw new WebhookAuthError('bad signature');
  const e = JSON.parse(req.body.toString('utf8'));
  return { provider: name, reference: e.reference, amountMinor: e.amountMinor, currency: e.currency, txnId: `mock-${Date.now()}` };
}
