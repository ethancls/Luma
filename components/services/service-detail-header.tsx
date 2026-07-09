"use client";

import Link from "next/link";
import { ArrowLeft, ArrowClockwise, PencilSimple, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import type { Service } from "@/lib/services/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: "bg-emerald-400",
    degraded: "bg-amber-400",
    offline: "bg-red-400",
    unknown: "bg-muted-foreground/30",
  };
  return (
    <span
      className={`inline-block size-2.5 shrink-0 rounded-full ${colors[status] || colors.unknown}`}
      title={status}
    />
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Never";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncateUrl(url: string | null): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ServiceDetailHeaderProps {
  service: Service;
  onCheck: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ServiceDetailHeader({
  service,
  onCheck,
  onEdit,
  onDelete,
}: ServiceDetailHeaderProps) {
  const tlsInfo = service.tlsExpiry
    ? `Valid until ${formatDate(service.tlsExpiry)}`
    : "Not configured";

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/dashboard/services"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Services
      </Link>

      {/* Name + status row */}
      <div className="flex items-center gap-3">
        <StatusDot status={service.status} />
        <h1 className="text-2xl font-bold tracking-tight">{service.name}</h1>
      </div>

      {/* URL */}
      {service.url && (
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline break-all"
        >
          {truncateUrl(service.url)}
          {service.port ? `:${service.port}` : ""}
        </a>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>
          Port: {service.port ?? <span className="text-muted-foreground/50">--</span>}
        </span>
        <span className="hidden h-4 w-px bg-border sm:inline" aria-hidden />
        <span>TLS: {tlsInfo}</span>
        <span className="hidden h-4 w-px bg-border sm:inline" aria-hidden />
        <span>
          Last checked: {formatDate(service.lastChecked)}
        </span>
      </div>

      {/* Tags */}
      {service.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {service.tags.map((tag) => (
            <Badge key={tag} size="sm" variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onCheck}>
          <ArrowClockwise className="size-4" />
          Check Now
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <PencilSimple className="size-4" />
          Edit
        </Button>

        {/* Delete with confirmation */}
        <AlertDialog>
          <AlertDialogTrigger>
            <Button variant="destructive-outline" size="sm">
              <Trash className="size-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{service.name}</strong>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </AlertDialogClose>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete();
                }}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
