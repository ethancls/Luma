"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen } from '@phosphor-icons/react';

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="flex max-w-sm flex-col items-center text-center">
        <Image
          src="/logo-black.svg"
          alt="Luma"
          width={140}
          height={35}
          style={{ height: 'auto' }}
          className="dark:hidden mb-10"
          priority
        />
        <Image
          src="/logo-white.svg"
          alt="Luma"
          width={140}
          height={35}
          style={{ height: 'auto' }}
          className="dark:block hidden mb-10"
          priority
        />

        <p className="cursor-default font-mono text-8xl font-bold tracking-tighter text-primary/30 transition-colors duration-300 hover:text-primary">
          404
        </p>

        <h2 className="mt-4 text-lg font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex items-center gap-6">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            <span className="underline-offset-4 group-hover:underline">Back to dashboard</span>
          </Link>
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
        </div>
      </div>
    </div>
  );
}
