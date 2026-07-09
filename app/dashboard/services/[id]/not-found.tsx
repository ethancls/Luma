"use client";

import { HardDrive } from '@phosphor-icons/react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ServiceNotFound() {
  const router = useRouter();
  return (
    <div className="flex h-full items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><HardDrive className="size-6 text-foreground" /></EmptyMedia>
          <EmptyTitle>Service not found</EmptyTitle>
          <EmptyDescription>This service doesn't exist or has been deleted.</EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => router.push('/dashboard/services')}>Back to services</Button>
      </Empty>
    </div>
  );
}
