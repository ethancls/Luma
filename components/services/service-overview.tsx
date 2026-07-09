import { CopyButton } from "@/components/shared/copy-button";
import type { Service } from "@/lib/services/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Never";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ServiceOverviewProps {
  service: Service;
}

export function ServiceOverview({ service }: ServiceOverviewProps) {
  const tlsInfo = service.tlsExpiry
    ? `Valid until ${formatDate(service.tlsExpiry)}`
    : "Not configured";

  return (
    <div className="space-y-6">
      {/* Info section */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-medium">Service Information</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoRow label="Created" value={formatDate(service.createdAt)} />
          <InfoRow
            label="Last Check"
            value={service.lastChecked ? formatDate(service.lastChecked) : "Never"}
          />
          <InfoRow
            label="Category"
            value={service.categoryName || service.categoryId || "Uncategorized"}
          />
          <InfoRow
            label="Port"
            value={service.port != null ? String(service.port) : "\u2014"}
          />
          <InfoRow label="TLS" value={tlsInfo} />
        </div>
      </div>

      {/* Docker Compose section */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Docker Compose</h3>
          <CopyButton text={service.dockerComposeSnippet || ""} />
        </div>
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
          {service.dockerComposeSnippet || "No docker compose snippet"}
        </pre>
      </div>

      {/* Notes section */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-medium mb-2">Notes</h3>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
          {service.notes || "No notes"}
        </div>
      </div>

      {/* Description */}
      {service.description && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-medium mb-2">Description</h3>
          <p className="text-sm text-muted-foreground">{service.description}</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground mb-0.5">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
