import { z } from 'zod';

const safeUrl = z.string().trim().url().max(500).refine((value) => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol); }
  catch { return false; }
}, 'Use a valid HTTP or HTTPS URL');

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  organization: z.string().trim().max(140).optional().default(''),
  service: z.enum(['', 'Film & Video Production', 'Brand Strategy & Identity', 'PR & Communications',
    'Digital & Web Experiences', 'Social & Digital Campaigns', 'Events & Live Media',
    'International News & Editorial', 'Advertising & Media Buying', 'Not sure yet']).optional().default(''),
  message: z.string().trim().min(15).max(4000),
  website: z.string().max(200).optional().default(''),
  consent: z.literal(true),
}).strict();

export const adRequestSchema = z.object({
  company: z.string().trim().min(2).max(120), name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200), website_url: z.union([safeUrl,z.literal('')]).default(''),
  placement: z.enum(['homepage','news','sidebar']), message: z.string().trim().min(15).max(2000),
  consent: z.literal(true), website: z.string().max(200).optional().default(''),
}).strict();

export const loginSchema = z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(500) }).strict();
export const articleSchema = z.object({
  title: z.string().trim().min(5).max(180), excerpt: z.string().trim().min(15).max(500),
  body: z.string().trim().min(30).max(30000), category: z.enum(['World','Africa','Business','Technology','Culture','Company']),
  language: z.enum(['en','am','ti']), status: z.enum(['draft','published']),
}).strict();
export const campaignSchema = z.object({
  company: z.string().trim().min(2).max(120), headline: z.string().trim().min(4).max(120),
  description: z.string().trim().min(10).max(360), link_url: safeUrl,
  placement: z.enum(['homepage','news','sidebar']), status: z.enum(['draft','active','paused']),
  payment_verified: z.boolean(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict().refine(v => v.start_date <= v.end_date, { message: 'End date must be after start date' });
export const portfolioSchema = z.object({
  title: z.string().trim().min(3).max(160), category: z.string().trim().min(3).max(100),
  description: z.string().trim().min(15).max(2000),
  case_url: z.union([safeUrl, z.literal('')]).default(''),
  status: z.enum(['draft','published']),
}).strict();
