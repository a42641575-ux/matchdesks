'use client';

import { useActionState } from 'react';
import { submitContactForm } from './actions';
import type { ContactFormState } from '@/lib/validation';

const initialState: ContactFormState = { ok: false };

const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';
const labelClass = 'block text-sm font-medium text-gray-700';

type Category = 'general' | 'privacy' | 'fraud';

export function ContactForm({ defaultCategory = 'general' }: { defaultCategory?: Category }) {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState);
  const errors = state?.errors;

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {/* Honeypot: hidden from humans, bots often fill it. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input id="name" name="name" type="text" required className={inputClass} />
          {errors?.name && <p className="mt-1 text-xs text-red-600">{errors.name[0]}</p>}
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
          {errors?.email && <p className="mt-1 text-xs text-red-600">{errors.email[0]}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="category" className={labelClass}>
          Category
        </label>
        <select id="category" name="category" defaultValue={defaultCategory} className={inputClass}>
          <option value="general">General inquiry</option>
          <option value="privacy">Privacy question</option>
          <option value="fraud">Fraud / safety report</option>
        </select>
        {errors?.category && <p className="mt-1 text-xs text-red-600">{errors.category[0]}</p>}
      </div>

      <div>
        <label htmlFor="subject" className={labelClass}>
          Subject (optional)
        </label>
        <input id="subject" name="subject" type="text" className={inputClass} />
        {errors?.subject && <p className="mt-1 text-xs text-red-600">{errors.subject[0]}</p>}
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea id="message" name="message" rows={6} required className={inputClass} />
        {errors?.message && <p className="mt-1 text-xs text-red-600">{errors.message[0]}</p>}
      </div>

      {state?.message && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            state.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
