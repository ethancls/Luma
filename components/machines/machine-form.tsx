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
import { Plus } from "@phosphor-icons/react";
import { toastSuccess, toastError } from "@/lib/toast-utils";
import { useMachineTypes } from "@/lib/use-machine-types";

const COLOR_DOTS: Record<string, string> = {
  blue: "bg-blue-500", amber: "bg-amber-500", emerald: "bg-emerald-500",
  purple: "bg-purple-500", red: "bg-red-500", slate: "bg-slate-500",
  cyan: "bg-cyan-500", pink: "bg-pink-500", indigo: "bg-indigo-500",
  teal: "bg-teal-500", orange: "bg-orange-500", lime: "bg-lime-500",
};

const ALL_COLORS = Object.keys(COLOR_DOTS);

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
  const { config: typeConfig, options: typeOptions, refetch: refetchTypes, customTypes, deleteType } = useMachineTypes();

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

  // New type dialog
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("blue");

  const handleAddType = useCallback(async () => {
    if (!newTypeName.trim()) return;
    await fetch("/api/machine-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTypeName.trim(), color: newTypeColor }),
    });
    setNewTypeName("");
    setTypeDialogOpen(false);
    refetchTypes();
  }, [newTypeName, newTypeColor, refetchTypes]);

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
              <div className="flex gap-2">
                <Select
                  onValueChange={(value: string | null) =>
                    setType(value ?? "vps")
                  }
                  value={type}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select type">
                      {(value: string) => {
                        return typeOptions.find((o) => o.value === value)?.label ?? value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <span
                            className={`inline-block size-2 shrink-0 rounded-full ${typeConfig[opt.value]?.dotColor ?? "bg-muted-foreground"}`}
                          />
                          <span className="flex-1">{opt.label}</span>
                          {opt.isCustom && (
                            <button
                              type="button"
                              className="shrink-0 cursor-pointer rounded p-0.5 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (opt.id && confirm(`Delete type "${opt.label}"?`)) {
                                  deleteType(opt.id);
                                }
                              }}
                            >
                              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    setNewTypeName("");
                    setNewTypeColor("blue");
                    setTypeDialogOpen(true);
                  }}
                >
                  <Plus className="size-3.5" />
                  New
                </Button>
              </div>
            </Field>

            {/* New Type Dialog */}
            <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
              <DialogPopup>
                <DialogHeader>
                  <DialogTitle>New Machine Type</DialogTitle>
                </DialogHeader>
                <DialogPanel>
                  <div className="flex flex-col gap-4">
                    <Field>
                      <FieldLabel>Name</FieldLabel>
                      <Input
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder="e.g. Proxmox"
                        autoFocus
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Color</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {ALL_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            title={c}
                            className={`size-7 cursor-pointer rounded-full border-2 transition-shadow ${newTypeColor === c ? "border-ring ring-2 ring-ring/30" : "border-transparent"} ${COLOR_DOTS[c]}`}
                            onClick={() => setNewTypeColor(c)}
                          />
                        ))}
                      </div>
                    </Field>
                  </div>
                </DialogPanel>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddType} disabled={!newTypeName.trim()}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogPopup>
            </Dialog>

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
