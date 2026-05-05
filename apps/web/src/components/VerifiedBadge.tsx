'use client';

import { CheckCircle2 } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md';
}

export default function VerifiedBadge({ size = 'md' }: VerifiedBadgeProps) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return <CheckCircle2 className={`${cls} text-brand-500 shrink-0`} aria-label="Verified" />;
}
