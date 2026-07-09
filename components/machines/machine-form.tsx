"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogPanel,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toastSuccess, toastError } from "@/lib/toast-utils";
import { MACHINE_TYPE_CONFIG, MACHINE_TYPE_OPTIONS } from "@/lib/machine-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Machine {
  id: string;
  name: string;
  host: string;
  type: string;
  cpuCores: number | null;
  ramGb: number | null;
  diskGb: number | null;
  notes: string | null;
  status: "online" | "offline" | "unknown";
  lastSeen: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MachineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine?: Machine | null;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MachineForm({
  open,
  onOpenChange,
  machine,
  onSuccess,
}: MachineFormProps) {
  const isEdit = !!machine;

  // Form state
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [type, setType] = useState("vps");
  const [cpuCores, setCpuCores] = useState("");
  const [ramGb, setRamGb] = useState("");
  const [diskGb, setDiskGb] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; host?: string }>({});

  // Reset form whenever dialog opens or machine changes
  useEffect(() => {
    if (open) {
      setName(machine?.name ?? "");
      setHost(machine?.host ?? "");
      setType(machine?.type ?? "vps");
      setCpuCores(machine?.cpuCores != null ? String(machine.cpuCores) : "");
      setRamGb(machine?.ramGb != null ? String(machine.ramGb) : "");
      setDiskGb(machine?.diskGb != null ? String(machine.diskGb) : "");
      setNotes(machine?.notes ?? "");
      setErrors({});
    }
  }, [open, machine]);

  // Validation
  const validate = useCallback((): boolean => {
    const e: { name?: string; host?: string } = {};

    if (!name.trim()) {
      e.name = "Name is required";
    }
    if (!host.trim()) {
      e.host = "Host is required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, host]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setSubmitting(true);

    const body: Record<string, unknown> = {
      name: name.trim(),
      host: host.trim(),
      type,
      cpuCores: cpuCores ? Number(cpuCores) : undefined,
      ramGb: ramGb ? Number(ramGb) : undefined,
      diskGb: diskGb ? Number(diskGb) : undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/machines/${machine!.id}` : "/api/machines",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg =
          typeof json.error === "string"
            ? json.error
            : JSON.stringify(json.error ?? "Unknown error");
        toastError("Failed to save machine", msg);
        return;
      }

      toastSuccess(
        isEdit ? "Machine updated" : "Machine created",
        isEdit
          ? `"${name}" has been updated.`
          : `"${name}" has been added.`,
      );

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toastError(
        "Network error",
        err instanceof Error ? err.message : "Could not reach the server.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    validate,
    name,
    host,
    type,
    cpuCores,
    ramGb,
    diskGb,
    notes,
    isEdit,
    machine,
    onSuccess,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Machine" : "Add Machine"}
          </DialogTitle>
        </DialogHeader>

        <DialogPanel>
          <div className="flex flex-col gap-4">
            {/* Name */}
            <Field>
              <FieldLabel>Name *</FieldLabel>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                }}
                placeholder="e.g. Proxmox Node 1"
              />
              {errors.name && (
                <p className="text-destructive-foreground text-xs">
                  {errors.name}
                </p>
              )}
            </Field>

            {/* Host */}
            <Field>
              <FieldLabel>Host *</FieldLabel>
              <Input
                value={host}
                onChange={(e) => {
                  setHost(e.target.value);
                  if (errors.host) setErrors((p) => ({ ...p, host: undefined }));
                }}
                placeholder="e.g. 192.168.1.10"
              />
              {errors.host && (
                <p className="text-destructive-foreground text-xs">
                  {errors.host}
                </p>
              )}
            </Field>

            {/* Type */}
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Select
                onValueChange={(value: string | null) =>
                  setType(value ?? "vps")
                }
                value={type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type">
                    {(value: string) => {
                      return MACHINE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MACHINE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-block size-2 shrink-0 rounded-full ${MACHINE_TYPE_CONFIG[opt.value]?.dotColor ?? "bg-muted-foreground"}`}
                        />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* CPU Cores */}
            <Field>
              <FieldLabel>CPU Cores</FieldLabel>
              <Input
                type="number"
                value={cpuCores}
                onChange={(e) => setCpuCores(e.target.value)}
                placeholder="e.g. 4"
                min={0}
              />
            </Field>

            {/* RAM (GB) */}
            <Field>
              <FieldLabel>RAM (GB)</FieldLabel>
              <Input
                type="number"
                value={ramGb}
                onChange={(e) => setRamGb(e.target.value)}
                placeholder="e.g. 8"
                min={0}
              />
            </Field>

            {/* Disk (GB) */}
            <Field>
              <FieldLabel>Disk (GB)</FieldLabel>
              <Input
                type="number"
                value={diskGb}
                onChange={(e) => setDiskGb(e.target.value)}
                placeholder="e.g. 256"
                min={0}
              />
            </Field>

            {/* Notes */}
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
              />
            </Field>
          </div>
        </DialogPanel>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button loading={submitting} onClick={handleSubmit}>
            {isEdit ? "Save Changes" : "Create Machine"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
