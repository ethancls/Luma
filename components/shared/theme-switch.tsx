"use client";

import { useTheme } from 'next-themes';
import { Kbd } from '@/components/ui/kbd';
import { Tooltip, TooltipTrigger, TooltipPopup } from '@/components/ui/tooltip';
import { Sun, Moon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

export function ThemeSwitch({ showShortcut = false }: { showShortcut?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="size-9" />;

  return (
    <div className="flex items-center gap-0">
      <Tooltip>
        <TooltipTrigger
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </TooltipTrigger>
        <TooltipPopup side="bottom">
          Toggle theme
          {showShortcut && <span className="ml-1"><Kbd>D</Kbd></span>}
        </TooltipPopup>
      </Tooltip>
      {showShortcut && <Kbd>D</Kbd>}
    </div>
  );
}
