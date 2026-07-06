'use client';

import { useActionState, useState } from 'react';
import { CATEGORIES, EMPLOYMENT_TYPES, PROVINCES, SALARY_PERIODS, WORK_ARRANGEMENTS } from '@/lib/constants';
import type { JobPostState } from '@/lib/validation';
import { createJobPosting } from './actions';

const initialState: JobPostState = { ok: false };

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';
const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

export function PostJobForm() {
  const [state, formAction, isPending] = useActionState(createJobPosting, initialState);
  const [workArrangement, setWorkArrangement] = useState('ONSITE');
  const [aiScreeningUsed, setAiScreeningUsed] = useState(false);
  const [applyMethod, setApplyMethod] = useState<'URL' | 'EMAIL'>('URL');

  const locationRequired = workArrangement !== 'REMOTE';

  return (
    <form action={formAction} className="space-y-8">
      {state.message && (
        <div className={`rounded-md px-4 py-3 text-sm ${state.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      )}

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">Job details</h2>

        <div>
          <label htmlFor="title" className={labelClass}>
            Job title *
          </label>
          <input id="title" name="title" type="text" required className={inputClass} placeholder="e.g. Senior Frontend Developer" />
          <FieldError errors={state.errors?.title} />
        </div>

        <div>
          <label htmlFor="category" className={labelClass}>
            Category *
          </label>
          <select id="category" name="category" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose a category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
          <FieldError errors={state.errors?.category} />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={8}
            minLength={50}
            className={inputClass}
            placeholder="Responsibilities, qualifications, benefits… (minimum 50 characters)"
          />
          <FieldError errors={state.errors?.description} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">Location &amp; work arrangement</h2>

        <div>
          <label htmlFor="workArrangement" className={labelClass}>
            Work arrangement *
          </label>
          <select
            id="workArrangement"
            name="workArrangement"
            required
            value={workArrangement}
            onChange={(e) => setWorkArrangement(e.target.value)}
            className={inputClass}
          >
            {WORK_ARRANGEMENTS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className={labelClass}>
              City {locationRequired ? '*' : '(optional)'}
            </label>
            <input id="city" name="city" type="text" required={locationRequired} className={inputClass} placeholder="e.g. Toronto" />
            <FieldError errors={state.errors?.city} />
          </div>
          <div>
            <label htmlFor="province" className={labelClass}>
              Province {locationRequired ? '*' : '(optional)'}
            </label>
            <select id="province" name="province" required={locationRequired} defaultValue="" className={inputClass}>
              <option value="">{locationRequired ? 'Choose a province' : 'Not applicable'}</option>
              {PROVINCES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="employmentType" className={labelClass}>
            Employment type *
          </label>
          <select id="employmentType" name="employmentType" required defaultValue="FULL_TIME" className={inputClass}>
            {EMPLOYMENT_TYPES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">Compensation</h2>
        <p className="text-sm text-gray-500">
          A salary range is required on MatchDesks — pay transparency rules in Ontario, BC, and other provinces
          increasingly require this on public job postings.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="salaryMin" className={labelClass}>
              Minimum salary *
            </label>
            <input id="salaryMin" name="salaryMin" type="number" min={0} step="0.01" required className={inputClass} placeholder="e.g. 70000" />
            <FieldError errors={state.errors?.salaryMin} />
          </div>
          <div>
            <label htmlFor="salaryMax" className={labelClass}>
              Maximum salary *
            </label>
            <input id="salaryMax" name="salaryMax" type="number" min={0} step="0.01" required className={inputClass} placeholder="e.g. 90000" />
            <FieldError errors={state.errors?.salaryMax} />
          </div>
        </div>

        <div>
          <label htmlFor="salaryPeriod" className={labelClass}>
            Pay period *
          </label>
          <select id="salaryPeriod" name="salaryPeriod" required defaultValue="YEARLY" className={inputClass}>
            {SALARY_PERIODS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="compensationText" className={labelClass}>
            Additional compensation notes (optional)
          </label>
          <input
            id="compensationText"
            name="compensationText"
            type="text"
            className={inputClass}
            placeholder="e.g. plus commission, plus tips, equity available"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">AI in hiring</h2>
        <p className="text-sm text-gray-500">
          Ontario requires disclosure if AI is used to screen, assess, or select applicants for a posted role.
        </p>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="aiScreeningUsed"
            checked={aiScreeningUsed}
            onChange={(e) => setAiScreeningUsed(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          AI is used to screen, assess, or select applicants for this role
        </label>

        {aiScreeningUsed && (
          <div>
            <label htmlFor="aiScreeningDetails" className={labelClass}>
              How is AI used? *
            </label>
            <textarea
              id="aiScreeningDetails"
              name="aiScreeningDetails"
              rows={2}
              className={inputClass}
              placeholder="e.g. Resumes are ranked by an AI tool; a recruiter reviews all shortlists."
            />
            <FieldError errors={state.errors?.aiScreeningDetails} />
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">Company</h2>

        <div>
          <label htmlFor="companyName" className={labelClass}>
            Company name *
          </label>
          <input id="companyName" name="companyName" type="text" required className={inputClass} placeholder="e.g. Acme Corp" />
          <FieldError errors={state.errors?.companyName} />
        </div>

        <div>
          <label htmlFor="companyWebsite" className={labelClass}>
            Company website (optional)
          </label>
          <input id="companyWebsite" name="companyWebsite" type="url" className={inputClass} placeholder="https://example.com" />
          <FieldError errors={state.errors?.companyWebsite} />
        </div>

        <div>
          <label htmlFor="companyDescription" className={labelClass}>
            About the company (optional)
          </label>
          <textarea
            id="companyDescription"
            name="companyDescription"
            rows={3}
            className={inputClass}
            placeholder="A short description shown on the job posting"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">How should candidates apply?</h2>

        <div className="flex gap-4 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="applyMethod"
              value="URL"
              checked={applyMethod === 'URL'}
              onChange={() => setApplyMethod('URL')}
              className="h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500"
            />
            Application link
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="applyMethod"
              value="EMAIL"
              checked={applyMethod === 'EMAIL'}
              onChange={() => setApplyMethod('EMAIL')}
              className="h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500"
            />
            Email
          </label>
        </div>

        {applyMethod === 'URL' ? (
          <div>
            <label htmlFor="applyUrl" className={labelClass}>
              Application URL *
            </label>
            <input id="applyUrl" name="applyUrl" type="url" className={inputClass} placeholder="https://example.com/careers/apply" />
            <FieldError errors={state.errors?.applyUrl} />
          </div>
        ) : (
          <div>
            <label htmlFor="applyEmail" className={labelClass}>
              Application email *
            </label>
            <input id="applyEmail" name="applyEmail" type="email" className={inputClass} placeholder="careers@example.com" />
            <FieldError errors={state.errors?.applyEmail} />
          </div>
        )}
      </section>

      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isPending ? 'Posting…' : "Post job — it's free"}
        </button>
      </div>
    </form>
  );
}
