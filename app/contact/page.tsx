import type { Metadata } from 'next';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the MatchDesks team — general inquiries, privacy questions, or fraud/safety reports.',
};

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

const VALID = ['general', 'privacy', 'fraud'] as const;
type Category = (typeof VALID)[number];

export default async function ContactPage({ searchParams }: PageProps) {
  const { category } = await searchParams;
  const defaultCategory: Category = (VALID as readonly string[]).includes(category ?? '')
    ? (category as Category)
    : 'general';

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Contact us</h1>
      <p className="mt-2 text-sm text-gray-600">
        Questions, privacy requests, or a fraud/safety report — send us a message and we&apos;ll get back to you
        within 1–2 business days. You&apos;ll receive an automatic confirmation email when you submit.
      </p>

      <ContactForm defaultCategory={defaultCategory} />
    </div>
  );
}
