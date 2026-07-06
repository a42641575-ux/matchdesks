import type { ReactNode } from 'react';

const COLORS = {
  gray: 'bg-gray-100 text-gray-700',
  red: 'bg-red-50 text-red-700',
  green: 'bg-green-50 text-green-700',
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-800',
} as const;

export function Badge({ children, color = 'gray' }: { children: ReactNode; color?: keyof typeof COLORS }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${COLORS[color]}`}>
      {children}
    </span>
  );
}
