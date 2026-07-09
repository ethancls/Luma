"use client";

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { SquaresFour, Stack, DesktopTower, ClockCounterClockwise, Gear, Plus, ArrowSquareOut } from '@phosphor-icons/react';

const ACTIONS = [
  {
    group: 'Navigate',
    items: [
      { label: 'Dashboard', icon: SquaresFour, action: '/dashboard' },
      { label: 'Services', icon: Stack, action: '/dashboard/services' },
      { label: 'Machines', icon: DesktopTower, action: '/dashboard/machines' },
      { label: 'Activity', icon: ClockCounterClockwise, action: '/dashboard/audit' },
      { label: 'Settings', icon: Gear, action: '/dashboard/settings' },
    ],
  },
  {
    group: 'Actions',
    items: [
      { label: 'Add Service', icon: Plus, action: '/dashboard/services' },
      { label: 'See docs', icon: ArrowSquareOut, action: 'https://github.com/ethancls/luma/docs' },
    ],
  },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    },
    [onOpenChange],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  function handleAction(action: string) {
    onOpenChange(false);
    if (action.startsWith('http')) window.open(action, '_blank', 'noreferrer');
    else router.push(action);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandDialogPopup>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList className="max-h-80 overflow-y-auto p-2">
            <CommandEmpty>No results found.</CommandEmpty>
            {ACTIONS.map((group, gi) => (
              <div key={group.group}>
                <CommandGroup>
                  <CommandGroupLabel>{group.group}</CommandGroupLabel>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.label}
                      onClick={() => handleAction(item.action)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm"
                    >
                      <item.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {gi < ACTIONS.length - 1 && <CommandSeparator />}
              </div>
            ))}
          </CommandList>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}
