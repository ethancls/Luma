"use client";

import Link from 'next/link';

export function AnimatedLogo() {
  return (
    <Link href="/dashboard" className="group block shrink-0 select-none" draggable={false}>
      <img
        src="/logo-black.svg"
        alt="Luma"
        className="h-7 w-auto transition-opacity duration-200 group-hover:opacity-70 dark:hidden"
        draggable={false}
      />
      <img
        src="/logo-white.svg"
        alt="Luma"
        className="hidden h-7 w-auto transition-opacity duration-200 group-hover:opacity-70 dark:block"
        draggable={false}
      />
    </Link>
  );
}
