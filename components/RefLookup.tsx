'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Small "search by reference" box. Lets employers look up a posting by its
// MD-XXXXXX reference (as promised on the posting-policy page). Client-side
// only because it needs to navigate to a dynamic path segment.

export function RefLookup() {
  const [ref, setRef] = useState('');
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = ref.trim().toUpperCase();
    if (!clean) return;
    // Accept both "MD-7TCKQM" and bare "7TCKQM" (prepend MD- if missing).
    const normalized = clean.startsWith('MD-') ? clean : `MD-${clean}`;
    router.push(`/ref/${normalized}`);
  }

  return (
    <form onSubmit={submit} className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
      <label htmlFor="ref-lookup" className="whitespace-nowrap">
        Have a job reference?
      </label>
      <input
        id="ref-lookup"
        type="text"
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        placeholder="MD-7TCKQM"
        className="w-32 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
      />
      <button
        type="submit"
        className="font-medium text-red-600 hover:underline"
      >
        Find
      </button>
    </form>
  );
}
