"use client";

import { useState } from 'react';
import { toastManager } from '@/components/ui/toast';
import { Copy, Check } from '@phosphor-icons/react';

export function toastError(title: string, description: string) {
  toastManager.add({
    type: 'error',
    title,
    description,
    actionProps: {
      className: '!bg-transparent !border-0 !p-0 !text-[#3A88FE] !shadow-none size-6',
      children: <CopyIconComponent text={`${title}: ${description}`} />,
    },
  });
}

export function toastSuccess(title: string, description?: string) {
  toastManager.add({ type: 'success', title, description });
}

function CopyIconComponent({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <span
      className="inline-flex cursor-pointer items-center"
      title="Copy error"
      onClick={async (e) => {
        e.stopPropagation();
        e.preventDefault();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? (
        <Check className="size-3.5 text-green-400" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </span>
  );
}
