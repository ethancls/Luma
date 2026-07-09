"use client";

import { Skeleton } from '@/components/ui/skeleton';

export function LoadingCard() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-2 h-9 w-16" />
    </div>
  );
}
