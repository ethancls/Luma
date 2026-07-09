"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ServiceOverview } from "@/components/services/service-overview";
import { ServiceChecksTable } from "@/components/services/service-checks-table";
import { ServiceLogsTable } from "@/components/services/service-logs-table";
import type { Service } from "@/lib/services/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceDetailTabsProps {
  service: Service;
}

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "checks", label: "Checks" },
  { value: "logs", label: "Logs" },
  { value: "documentation", label: "Documentation" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceDetailTabs({ service }: ServiceDetailTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = (searchParams.get("tab") || "overview") as TabValue;

  const handleTabChange = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === "overview") {
        next.delete("tab");
      } else {
        next.set("tab", value);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      <TabsList>
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview">
        <div className="pt-4">
          <ServiceOverview service={service} />
        </div>
      </TabsContent>

      <TabsContent value="checks">
        <div className="pt-4">
          <ServiceChecksTable serviceId={service.id} />
        </div>
      </TabsContent>

      <TabsContent value="logs">
        <div className="pt-4">
          <ServiceLogsTable serviceId={service.id} />
        </div>
      </TabsContent>

      <TabsContent value="documentation">
        <div className="pt-4">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-medium mb-3">Documentation</h3>
            {service.notes ? (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {service.notes}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No documentation provided. Add notes to this service to populate
                the documentation tab.
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
