"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatedLogo } from './animated-logo';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { CommandPalette } from './command-palette';
import { Kbd } from '@/components/ui/kbd';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Menu,
  MenuPopup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';
import { ThemeSwitch } from '@/components/shared/theme-switch';
import { useSidebarContext } from './sidebar-context';
import { MagnifyingGlass, SignOut, User, ArrowLineLeft, ArrowLineRight } from '@phosphor-icons/react';

interface AppTopbarProps {
  user?: { name: string; email: string; image?: string } | null;
}

export function AppTopbar({ user }: AppTopbarProps) {
  const { isCollapsed, toggleSidebar } = useSidebarContext();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 flex h-16 w-full shrink-0 items-center gap-4 border-b bg-background px-6">
      {/* Logo + collapse toggle */}
      <div className="flex items-center gap-8">
        <AnimatedLogo />
        <div className="flex items-center gap-0">
          <button
            onClick={toggleSidebar}
            className="hidden cursor-pointer text-muted-foreground transition-colors hover:text-foreground md:flex size-9 items-center justify-center"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ArrowLineRight className="size-4" /> : <ArrowLineLeft className="size-4" />}
          </button>
          <Kbd>⌘B</Kbd>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-1 justify-center">
        <div className="w-full max-w-sm cursor-pointer" onClick={() => setPaletteOpen(true)}>
          <InputGroup>
            <InputGroupAddon>
              <MagnifyingGlass className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput type="search" placeholder="Search..." readOnly />
            <InputGroupAddon align="inline-end">
              <Kbd>⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Right section */}
      <div className="flex shrink-0 items-center gap-4">
        <a
          href="https://github.com/ethancls/luma"
          target="_blank"
          rel="noreferrer"
          className="group mr-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span className="underline-offset-4 group-hover:underline">See project</span>
          <svg className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </a>

        <ThemeSwitch showShortcut />

        <Menu>
          <MenuTrigger className="ml-1 cursor-pointer rounded-full">
            <Avatar className="size-9 ring-1 ring-border transition-shadow hover:ring-2 hover:ring-primary/30">
              <AvatarImage src={user?.image} alt={user?.name || 'User'} />
              <AvatarFallback className="text-xs">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </MenuTrigger>
          <MenuPopup align="end" className="w-52">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <MenuSeparator />
            <MenuItem className="cursor-pointer">
              <Link href="/dashboard/settings" className="flex items-center gap-2">
                <User className="size-4" />
                Account
              </Link>
            </MenuItem>
            <MenuSeparator />
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-500/10"
              onClick={async () => {
                await fetch('/api/auth/sign-out', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: '{}',
                  credentials: 'include',
                });
                router.push('/login');
                router.refresh();
              }}
            >
              <SignOut className="size-4" />
              Sign out
            </button>
          </MenuPopup>
        </Menu>
      </div>
    </header>
  );
}
