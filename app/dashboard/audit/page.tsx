"use client";

import { BookOpen, ClockCounterClockwise } from '@phosphor-icons/react';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export default function AuditPage() {
  return (
    <div className="flex h-full flex-col">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track actions and changes across your infrastructure</p>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClockCounterClockwise className="size-6 text-foreground" />
            </EmptyMedia>
            <EmptyTitle>Coming soon</EmptyTitle>
            <EmptyDescription>
              Audit logs will be available once actions are performed.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <a
              href="https://github.com/ethancls/luma/docs"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <BookOpen className="size-4" />
              <span className="underline-offset-4 group-hover:underline">See docs</span>
              <svg className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  );
}
