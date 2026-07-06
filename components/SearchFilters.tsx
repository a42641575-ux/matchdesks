'use client';

import { useRef } from 'react';
import { CATEGORIES, DATE_POSTED_FILTERS, EMPLOYMENT_TYPES, PROVINCES, WORK_ARRANGEMENTS } from '@/lib/constants';

export interface SearchFiltersValues {
  q?: string;
  category?: string;
  province?: string;
  city?: string;
  employmentType?: string;
  workArrangement?: string;
  minSalary?: string;
  postedWithinDays?: string;
}

const selectClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';
const inputClass = selectClass;
const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

export function SearchFilters({ initial, action = '/jobs' }: { initial: SearchFiltersValues; action?: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      method="GET"
      action={action}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <div>
        <label htmlFor="q" className={labelClass}>
          Keyword
        </label>
        <input
          type="text"
          id="q"
          name="q"
          defaultValue={initial.q ?? ''}
          placeholder="Job title, company, or keyword"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="category" className={labelClass}>
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={initial.category ?? ''}
          onChange={() => formRef.current?.requestSubmit()}
          className={selectClass}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="province" className={labelClass}>
            Province
          </label>
          <select
            id="province"
            name="province"
            defaultValue={initial.province ?? ''}
            onChange={() => formRef.current?.requestSubmit()}
            className={selectClass}
          >
            <option value="">All</option>
            {PROVINCES.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city" className={labelClass}>
            City
          </label>
          <input type="text" id="city" name="city" defaultValue={initial.city ?? ''} placeholder="e.g. Toronto" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="employmentType" className={labelClass}>
          Job type
        </label>
        <select
          id="employmentType"
          name="employmentType"
          defaultValue={initial.employmentType ?? ''}
          onChange={() => formRef.current?.requestSubmit()}
          className={selectClass}
        >
          <option value="">Any</option>
          {EMPLOYMENT_TYPES.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="workArrangement" className={labelClass}>
          Work arrangement
        </label>
        <select
          id="workArrangement"
          name="workArrangement"
          defaultValue={initial.workArrangement ?? ''}
          onChange={() => formRef.current?.requestSubmit()}
          className={selectClass}
        >
          <option value="">Any</option>
          {WORK_ARRANGEMENTS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="minSalary" className={labelClass}>
          Minimum salary
        </label>
        <input
          type="number"
          id="minSalary"
          name="minSalary"
          min={0}
          step={1000}
          defaultValue={initial.minSalary ?? ''}
          placeholder="e.g. 60000"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="postedWithinDays" className={labelClass}>
          Date posted
        </label>
        <select
          id="postedWithinDays"
          name="postedWithinDays"
          defaultValue={initial.postedWithinDays ?? ''}
          onChange={() => formRef.current?.requestSubmit()}
          className={selectClass}
        >
          <option value="">Any time</option>
          {DATE_POSTED_FILTERS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          Search
        </button>
        <a href={action} className="text-sm font-medium text-gray-500 hover:text-gray-700">
          Clear filters
        </a>
      </div>
    </form>
  );
}
