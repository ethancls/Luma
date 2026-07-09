"use client";

import { DesktopTower } from "@phosphor-icons/react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function MachineNotFound() {
  const router = useRouter();
  return (
    <div className="flex h-full items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <DesktopTower className="size-6 text-foreground" />
          </EmptyMedia>
          <EmptyTitle>Machine not found</EmptyTitle>
          <EmptyDescription>
            This machine doesn't exist or has been deleted.
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => router.push("/dashboard/machines")}>
          Back to machines
        </Button>
      </Empty>
    </div>
  );
}
