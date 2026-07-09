"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const SETTINGS_LINKS = [
  { href: '/dashboard/settings', label: 'Account', exact: true },
  { href: '/dashboard/settings/discovery', label: 'Discovery', exact: false },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <nav className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-0">
        <div className="flex gap-1">
          {SETTINGS_LINKS.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="pt-6">{children}</div>
    </div>
  );
}
