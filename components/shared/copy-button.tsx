"use client";

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Copy, Check } from '@phosphor-icons/react';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = 'Copy' }: CopyButtonProps) {
  const { copied, copyToClipboard } = useCopyToClipboard();

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button variant="ghost" size="icon" className="size-6" onClick={() => copyToClipboard(text)}>
          {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied!' : label}</TooltipContent>
    </Tooltip>
  );
}
