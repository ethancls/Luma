"use client";

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebarContext } from './sidebar-context';
import { SquaresFour, Stack, DesktopTower, ClockCounterClockwise, Gear } from '@phosphor-icons/react';

const MAIN_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: SquaresFour, exact: true },
  { href: '/dashboard/services', label: 'Services', icon: Stack },
  { href: '/dashboard/machines', label: 'Machines', icon: DesktopTower },
];

const SYSTEM_ITEMS = [
  { href: '/dashboard/audit', label: 'Activity', icon: ClockCounterClockwise },
  { href: '/dashboard/settings', label: 'Settings', icon: Gear },
];

interface AppSidebarProps {
  hideOnMobile?: boolean;
}

export function AppSidebar({ hideOnMobile = false }: AppSidebarProps) {
  const { isCollapsed } = useSidebarContext();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className={cn(
        'group/sidebar relative border-r bg-background transition-[width] duration-300 ease-out',
        hideOnMobile ? 'hidden md:block' : '',
        'w-[15rem] min-w-[15rem] max-w-[15rem]',
        isCollapsed &&
          'md:w-[72px] md:min-w-[72px] md:hover:w-[15rem] md:hover:min-w-[15rem] md:hover:shadow-lg md:hover:z-50',
      )}
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      {/* Inner container for width transition */}
      <div
        className={cn(
          'flex h-full w-[15rem] min-w-[15rem] max-w-[15rem] flex-col transition-[width,min-width] duration-300 ease-out',
          isCollapsed &&
            'md:w-[72px] md:min-w-[72px] md:group-hover/sidebar:w-[15rem] md:group-hover/sidebar:min-w-[15rem] md:overflow-hidden md:group-hover/sidebar:overflow-visible',
        )}
      >
        {/* Spacer for top */}
        <div className="mt-4" />

        {/* Navigation groups */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-2">
          <NavGroup label="" items={MAIN_ITEMS} pathname={pathname} router={router} isCollapsed={isCollapsed} />

          <div className="mx-3 my-1 border-t" />

          <NavGroup label="" items={SYSTEM_ITEMS} pathname={pathname} router={router} isCollapsed={isCollapsed} />
        </nav>

      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  router,
  isCollapsed,
}: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType; exact?: boolean }[];
  pathname: string;
  router: ReturnType<typeof useRouter>;
  isCollapsed: boolean;
}) {
  return (
    <div>
      {label && (
        <p
          className={cn(
            'mb-1 px-3 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground/60',
            isCollapsed && 'md:overflow-hidden md:group-hover/sidebar:overflow-visible',
          )}
        >
          {label}
        </p>
      )}
      <ul className="space-y-1">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="px-1">
              <button
                onClick={() => router.push(item.href)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 text-base font-normal transition-colors',
                  active
                    ? 'bg-accent text-[#3A88FE]'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <span className="flex min-w-[26px] shrink-0 justify-center">
                  <item.icon
                    className={cn('size-6 shrink-0', active && 'text-[#3A88FE]')}
                  />
                </span>
                <span
                  className={cn(
                    'whitespace-nowrap text-left',
                    isCollapsed && 'md:overflow-hidden md:group-hover/sidebar:overflow-visible',
                  )}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
