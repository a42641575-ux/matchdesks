import { z } from 'zod';
import { CATEGORY_SLUGS, PROVINCE_CODES } from './constants';

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined));

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : undefined))
  .pipe(z.string().url('Enter a valid URL, including https://').optional());

export const jobPostSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
    companyName: z.string().trim().min(2, 'Company name is required').max(120),
    companyWebsite: optionalUrl,
    companyDescription: optionalText(2000),
    description: z.string().trim().min(50, 'Description must be at least 50 characters').max(10000),
    category: z.enum(CATEGORY_SLUGS, { message: 'Choose a category' }),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
    workArrangement: z.enum(['ONSITE', 'HYBRID', 'REMOTE']),
    city: optionalText(120),
    province: z.union([z.enum(PROVINCE_CODES), z.literal('')]).optional(),
    salaryMin: z.coerce.number({ message: 'Enter a minimum salary' }).min(0, 'Must be 0 or more'),
    salaryMax: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => {
        if (v === '' || v === undefined || v === null) return undefined;
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isNaN(n) ? undefined : n;
      })
      .pipe(z.number().min(0, 'Must be 0 or more').optional()),
    salaryPeriod: z.enum(['HOURLY', 'MONTHLY', 'YEARLY']),
    compensationText: optionalText(200),
    aiScreeningUsed: z
      .union([z.literal('on'), z.literal('true'), z.literal('false')])
      .optional()
      .transform((v) => v === 'on' || v === 'true'),
    aiScreeningDetails: optionalText(500),
    applyMethod: z.enum(['URL', 'EMAIL']),
    applyUrl: optionalUrl,
    applyEmail: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .transform((v) => (v ? v : undefined))
      .pipe(z.string().email('Enter a valid email').optional()),
  })
  .refine((data) => data.salaryMax == null || data.salaryMax >= data.salaryMin, {
    message: 'Maximum salary must be greater than or equal to the minimum',
    path: ['salaryMax'],
  })
  .refine((data) => data.workArrangement === 'REMOTE' || Boolean(data.city && data.province), {
    message: 'City and province are required unless the job is fully remote',
    path: ['city'],
  })
  .refine((data) => data.applyMethod !== 'URL' || Boolean(data.applyUrl), {
    message: 'Provide an application URL',
    path: ['applyUrl'],
  })
  .refine((data) => data.applyMethod !== 'EMAIL' || Boolean(data.applyEmail), {
    message: 'Provide an application email address',
    path: ['applyEmail'],
  })
  .refine((data) => !data.aiScreeningUsed || Boolean(data.aiScreeningDetails), {
    message: 'Briefly describe how AI is used in screening (Ontario disclosure requirement)',
    path: ['aiScreeningDetails'],
  });

export type JobPostInput = z.infer<typeof jobPostSchema>;

export interface JobPostState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  jobSlug?: string;
}

export const fraudReportSchema = z.object({
  jobId: z.string().min(1),
  reason: z.enum([
    'SCAM_OR_PHISHING',
    'FAKE_COMPANY',
    'PYRAMID_OR_MLM',
    'DISCRIMINATORY',
    'ALREADY_FILLED',
    'DUPLICATE_POSTING',
    'OTHER',
  ]),
  details: optionalText(1000),
  reporterEmail: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().email('Enter a valid email').optional()),
});

export type FraudReportInput = z.infer<typeof fraudReportSchema>;

export interface FraudReportState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
}

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().email('Enter a valid email').max(200),
  category: z.enum(['general', 'privacy', 'fraud'], { message: 'Choose a category' }),
  subject: optionalText(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export interface ContactFormState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
}
