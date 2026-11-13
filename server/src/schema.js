import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  organization: z.string().trim().max(140).optional().default(''),
  service: z.enum([
    '', 'Film & Video Production', 'Brand Strategy & Identity',
    'PR & Communications', 'Digital & Web Experiences',
    'Social & Digital Campaigns', 'Events & Live Media', 'Not sure yet'
  ]).optional().default(''),
  message: z.string().trim().min(15).max(4000),
  website: z.string().max(200).optional().default(''),
  consent: z.literal(true),
}).strict();
