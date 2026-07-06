'use client';

import { useActionState, useEffect, useState } from 'react';
import { FRAUD_REPORT_REASONS, SITE_NAME } from '@/lib/constants';
import type { FraudReportState } from '@/lib/validation';
import { submitFraudReport } from './actions';

const initialState: FraudReportState = { ok: false };

export function ReportJobButton({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = submitFraudReport.bind(null, jobId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:border-red-300 hover:text-red-600"
      >
        Report this posting
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            {state.ok ? (
              <>
                <h2 id="report-dialog-title" className="text-lg font-semibold text-gray-900">
                  Report received
                </h2>
                <p className="mt-2 text-sm text-gray-600">{state.message}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-6 w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Close
                </button>
              </>
            ) : (
              <form action={formAction}>
                <h2 id="report-dialog-title" className="text-lg font-semibold text-gray-900">
                  Report &quot;{jobTitle}&quot;
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Help us keep {SITE_NAME} trustworthy. Reports are reviewed by our team — see our{' '}
                  <a href="/fraud-policy" className="text-red-600 hover:underline">
                    fraud policy
                  </a>
                  .
                </p>

                {state.message && !state.ok && (
                  <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
                )}

                <div className="mt-4">
                  <label htmlFor="reason" className="mb-1 block text-sm font-medium text-gray-700">
                    Reason
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    required
                    defaultValue={FRAUD_REPORT_REASONS[0].value}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    {FRAUD_REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <label htmlFor="details" className="mb-1 block text-sm font-medium text-gray-700">
                    Details (optional)
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Anything else we should know?"
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="reporterEmail" className="mb-1 block text-sm font-medium text-gray-700">
                    Your email (optional)
                  </label>
                  <input
                    id="reporterEmail"
                    name="reporterEmail"
                    type="email"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="In case we need to follow up"
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {isPending ? 'Submitting…' : 'Submit report'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
