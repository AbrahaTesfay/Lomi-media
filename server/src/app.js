import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { contactSchema } from './schema.js';

const ACCEPTED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(s => s.trim()).filter(Boolean);

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: (origin, done) => {
    if (!origin || ACCEPTED_ORIGINS.includes(origin)) return done(null, true);
    return done(new Error('CORS origin rejected'));
  }, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'lomi-api' }));
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many requests. Please try again later.' } });
  const insert = db.prepare('INSERT INTO inquiries (name, email, organization, service, message) VALUES (?, ?, ?, ?, ?)');

  app.post('/api/contact', limiter, (request, response) => {
    const parsed = contactSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ message: 'Please check your details and complete the required fields.' });
    const { name, email, organization, service, message, website } = parsed.data;
    // Honeypot: silently discard automated spam without confirming whether it was detected.
    if (website) return response.status(202).json({ message: 'Your request has been received.' });
    insert.run(name, email, organization, service, message);
    return response.status(201).json({ message: 'Thank you. Your inquiry has been recorded. Thank you for contacting Lomi Media & Communication.' });
  });

  app.use((_request, response) => response.status(404).json({ message: 'Endpoint not found.' }));
  app.use((error, _request, response, _next) => {
    // Never return internal errors, stack traces, or customer data to clients.
    console.error('[API error]', error?.message || 'Unknown error');
    return response.status(500).json({ message: 'The service is temporarily unavailable. Please try again later.' });
  });
  return app;
}
