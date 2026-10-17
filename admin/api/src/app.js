import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes/index.js';
import { paymentWebhook } from './controllers/webhook.controller.js';
import { errorHandler, notFound } from './utils/errors.js';

const app = express();
app.set('trust proxy', 1); // correct client IPs for rate limiting behind a host's proxy
// "upgrade-insecure-requests" would break http://localhost during a test run, so only use it in production.
const csp = helmet.contentSecurityPolicy.getDefaultDirectives();
if (process.env.NODE_ENV !== 'production') delete csp['upgrade-insecure-requests'];
app.use(helmet({ contentSecurityPolicy: { directives: csp } }));

const origins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : false }));
// The gateway's signature is computed over the raw bytes, so this route must come before express.json().
// (/api/webhooks/paystack is kept as an alias for webhook URLs you may already have saved.)
app.post(['/api/webhooks/payment', '/api/webhooks/paystack'], express.raw({ type: '*/*', limit: '100kb' }), paymentWebhook);
app.use(express.json({ limit: '50kb' }));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
