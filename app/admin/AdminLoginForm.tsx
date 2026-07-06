'use client';

import { useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin, type AdminLoginState } from './actions';

const initialState: AdminLoginState = { ok: false };

export function AdminLoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(adminLogin, initialState);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <form action={formAction} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin sign in</h1>
          <p className="mt-1 text-sm text-gray-500">Moderation queue access for MatchDesks operators.</p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            autoComplete="current-password"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        {state?.message && !state.ok && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
