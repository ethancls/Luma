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

const PROTOCOLS = [
  { value: "ssh", label: "SSH", defaultPort: 22 },
  { value: "rdp", label: "RDP", defaultPort: 3389 },
  { value: "vnc", label: "VNC", defaultPort: 5900 },
  { value: "telnet", label: "Telnet", defaultPort: 23 },
];

interface Connection {
  id: string;
  machineId: string;
  name: string;
  protocol: string;
  host: string | null;
  port: number;
  username: string;
  credentialType: string;
  parameters: Record<string, unknown> | null;
}

interface ConnectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineId: string;
  machineHost: string;
  connection?: Connection | null;
  onSuccess: () => void;
}

export function ConnectionForm({
  open,
  onOpenChange,
  machineId,
  machineHost,
  connection,
  onSuccess,
}: ConnectionFormProps) {
  const isEdit = !!connection;

  const [name, setName] = useState("");
  const [protocol, setProtocol] = useState("ssh");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("22");
  const [username, setUsername] = useState("");
  const [credential, setCredential] = useState("");
  const [credentialType, setCredentialType] = useState("password");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; username?: string; credential?: string }>({});

  // Reset form on open
  useEffect(() => {
    if (open) {
      setName(connection?.name ?? "");
      setProtocol(connection?.protocol ?? "ssh");
      setHost(connection?.host ?? "");
      setPort(connection ? String(connection.port) : "22");
      setUsername(connection?.username ?? "");
      setCredential("");
      setCredentialType(connection?.credentialType ?? "password");
      setErrors({});
    }
  }, [open, connection]);

  // Auto-set port on protocol change (only in create mode)
  useEffect(() => {
    if (!isEdit && open) {
      const proto = PROTOCOLS.find((p) => p.value === protocol);
      if (proto) setPort(String(proto.defaultPort));
    }
  }, [protocol, isEdit, open]);

  const validate = useCallback((): boolean => {
    const e: { name?: string; username?: string; credential?: string } = {};
    if (!name.trim()) e.name = "Name is required";
    if (!username.trim()) e.username = "Username is required";
    if (!isEdit && !credential.trim()) e.credential = "Credential is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, username, credential, isEdit]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSubmitting(true);

    const body: Record<string, unknown> = {
      machineId,
      name: name.trim(),
      protocol,
      host: host.trim() || undefined,
      port: Number(port),
      username: username.trim(),
      credentialType,
    };

    if (!isEdit || credential.trim()) {
      body.credential = credential;
    }

    try {
      const res = await fetch(
        isEdit ? `/api/connections/${connection!.id}` : "/api/connections",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(typeof json.error === "string" ? json.error : "Unknown error");
      }

      toastSuccess(isEdit ? "Connection updated" : "Connection created");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toastError("Failed to save connection", err instanceof Error ? err.message : "");
    } finally {
      setSubmitting(false);
    }
  }, [validate, name, protocol, host, port, username, credential, credentialType, isEdit, machineId, connection, onSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Connection" : "New Connection"}</DialogTitle>
        </DialogHeader>

        <DialogPanel>
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Name *</FieldLabel>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                placeholder="e.g. SSH root"
              />
              {errors.name && <p className="text-destructive-foreground text-xs">{errors.name}</p>}
            </Field>

            <Field>
              <FieldLabel>Protocol</FieldLabel>
              <Select onValueChange={(v) => setProtocol(v ?? "ssh")} value={protocol}>
                <SelectTrigger>
                  <SelectValue placeholder="Protocol">{(v: string) => PROTOCOLS.find((p) => p.value === v)?.label ?? v}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PROTOCOLS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Host <span className="text-muted-foreground">({machineHost})</span></FieldLabel>
                <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder={machineHost} />
              </Field>
              <Field>
                <FieldLabel>Port</FieldLabel>
                <Input type="number" value={port} onChange={(e) => setPort(e.target.value)} min={1} max={65535} />
              </Field>
            </div>

            <Field>
              <FieldLabel>Username *</FieldLabel>
              <Input
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors((p) => ({ ...p, username: undefined })); }}
                placeholder="e.g. root"
              />
              {errors.username && <p className="text-destructive-foreground text-xs">{errors.username}</p>}
            </Field>

            <Field>
              <FieldLabel>Credential Type</FieldLabel>
              <Select onValueChange={(v) => setCredentialType(v ?? "password")} value={credentialType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type">{(v: string) => v === "password" ? "Password" : "Private Key"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="password">Password</SelectItem>
                  <SelectItem value="private_key">Private Key</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>{isEdit ? "Credential (leave empty to keep)" : "Credential *"}</FieldLabel>
              {credentialType === "private_key" ? (
                <Textarea
                  value={credential}
                  onChange={(e) => { setCredential(e.target.value); if (errors.credential) setErrors((p) => ({ ...p, credential: undefined })); }}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                  rows={5}
                />
              ) : (
                <Input
                  type="password"
                  value={credential}
                  onChange={(e) => { setCredential(e.target.value); if (errors.credential) setErrors((p) => ({ ...p, credential: undefined })); }}
                  placeholder={isEdit ? "••••••••" : "Password"}
                />
              )}
              {errors.credential && <p className="text-destructive-foreground text-xs">{errors.credential}</p>}
            </Field>
          </div>
        </DialogPanel>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit}>{isEdit ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
