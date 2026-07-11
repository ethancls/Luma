"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowClockwise } from "@phosphor-icons/react";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  async function handleRefresh() {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 600);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      className="cursor-pointer"
    >
      <ArrowClockwise
        className={`size-4 transition-transform ${spinning ? "animate-spin" : ""}`}
      />
      Refresh
    </Button>
  );
}
