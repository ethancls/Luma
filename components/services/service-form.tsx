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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Service {
  id: string;
  name: string;
  url: string | null;
  port: number | null;
  description: string | null;
  status: "online" | "degraded" | "offline" | "unknown";
  categoryId: string | null;
  tags: string[];
  dockerComposeSnippet: string | null;
  notes: string | null;
  tlsExpiry: string | null;
  tlsIssuer: string | null;
  lastChecked: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
}

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function tagsToString(tags: string[]): string {
  return tags.join(", ");
}

function isValidUrl(value: string): boolean {
  if (!value) return true; // empty is fine
  return value.startsWith("http://") || value.startsWith("https://");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceForm({
  open,
  onOpenChange,
  service,
  onSuccess,
}: ServiceFormProps) {
  const isEdit = !!service;

  // Form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [port, setPort] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [dockerComposeSnippet, setDockerComposeSnippet] = useState("");
  const [notes, setNotes] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});

  // Reset form whenever dialog opens or service changes
  useEffect(() => {
    if (open) {
      setName(service?.name ?? "");
      setUrl(service?.url ?? "");
      setPort(service?.port != null ? String(service.port) : "");
      setDescription(service?.description ?? "");
      setCategoryId(service?.categoryId ?? "");
      setTags(tagsToString(service?.tags ?? []));
      setDockerComposeSnippet(service?.dockerComposeSnippet ?? "");
      setNotes(service?.notes ?? "");
      setErrors({});
    }
  }, [open, service]);

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      fetch("/api/categories")
        .then((res) => res.json())
        .then((json) => {
          if (Array.isArray(json.data)) {
            setCategories(json.data);
          }
        })
        .catch(() => {
          // Silently fail
        });
    }
  }, [open]);

  // Validation
  const validate = useCallback((): boolean => {
    const e: { name?: string; url?: string } = {};

    if (!name.trim()) {
      e.name = "Name is required";
    }
    if (url.trim() && !isValidUrl(url.trim())) {
      e.url = "URL must start with http:// or https://";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, url]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setSubmitting(true);

    const body: Record<string, unknown> = {
      name: name.trim(),
      url: url.trim() || undefined,
      port: port ? Number(port) : undefined,
      description: description.trim() || undefined,
      categoryId: categoryId || undefined,
      tags: parseTags(tags),
      dockerComposeSnippet: dockerComposeSnippet.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/services/${service!.id}` : "/api/services",
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
        toastError("Failed to save service", msg);
        return;
      }

      toastSuccess(
        isEdit ? "Service updated" : "Service created",
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
    url,
    port,
    description,
    categoryId,
    tags,
    dockerComposeSnippet,
    notes,
    isEdit,
    service,
    onSuccess,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Service" : "Add Service"}
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
                placeholder="e.g. Plex Media Server"
              />
              {errors.name && (
                <p className="text-destructive-foreground text-xs">
                  {errors.name}
                </p>
              )}
            </Field>

            {/* URL */}
            <Field>
              <FieldLabel>URL</FieldLabel>
              <Input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errors.url) setErrors((p) => ({ ...p, url: undefined }));
                }}
                placeholder="https://..."
              />
              {errors.url && (
                <p className="text-destructive-foreground text-xs">
                  {errors.url}
                </p>
              )}
            </Field>

            {/* Port */}
            <Field>
              <FieldLabel>Port</FieldLabel>
              <Input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="e.g. 32400"
              />
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description..."
              />
            </Field>

            {/* Category */}
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Select
                onValueChange={(value: string | null) =>
                  setCategoryId(value ?? "")
                }
                value={categoryId || "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No category">
                    {(value: string) => {
                      if (!value || value === "none") return "No category";
                      return categories.find((c) => c.id === value)?.name ?? value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Tags */}
            <Field>
              <FieldLabel>Tags</FieldLabel>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="media, self-hosted, docker (comma-separated)"
              />
            </Field>

            {/* Docker Compose Snippet */}
            <Field>
              <FieldLabel>Docker Compose Snippet</FieldLabel>
              <Textarea
                value={dockerComposeSnippet}
                onChange={(e) => setDockerComposeSnippet(e.target.value)}
                placeholder="version: '3'&#10;services:&#10;  ..."
                rows={4}
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
            {isEdit ? "Save Changes" : "Create Service"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
