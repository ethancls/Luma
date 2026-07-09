"use client";

import { useState, useEffect, useCallback } from "react";

interface CustomType {
  id: string;
  name: string;
  color: string;
}

interface TypeConfig {
  label: string;
  className: string;
  dotColor: string;
  isCustom?: boolean;
  id?: string;
}

const COLOR_PRESETS: Record<string, { className: string; dotColor: string }> = {
  blue: { className: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300", dotColor: "bg-blue-500" },
  amber: { className: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300", dotColor: "bg-amber-500" },
  emerald: { className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300", dotColor: "bg-emerald-500" },
  purple: { className: "bg-purple-50 text-purple-700 dark:bg-purple-400/10 dark:text-purple-300", dotColor: "bg-purple-500" },
  red: { className: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300", dotColor: "bg-red-500" },
  slate: { className: "bg-slate-50 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300", dotColor: "bg-slate-500" },
};

const BUILT_IN: Record<string, TypeConfig> = {
  vps: { label: "VPS", ...COLOR_PRESETS.blue },
  "bare-metal": { label: "Bare Metal", ...COLOR_PRESETS.amber },
  pi: { label: "Raspberry Pi", ...COLOR_PRESETS.emerald },
  nas: { label: "NAS", ...COLOR_PRESETS.purple },
};

export function useMachineTypes() {
  const [customTypes, setCustomTypes] = useState<CustomType[]>([]);

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/machine-types");
      const json = await res.json();
      if (Array.isArray(json.data)) setCustomTypes(json.data);
    } catch { /* optional */ }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const deleteType = useCallback(async (id: string) => {
    await fetch(`/api/machine-types/${id}`, { method: "DELETE" });
    setCustomTypes((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const allConfig: Record<string, TypeConfig> = { ...BUILT_IN };
  const options: { value: string; label: string; isCustom?: boolean; id?: string }[] = Object.entries(BUILT_IN).map(([value, { label }]) => ({ value, label }));

  for (const t of customTypes) {
    const preset = COLOR_PRESETS[t.color] ?? COLOR_PRESETS.blue;
    allConfig[t.name] = { label: t.name, ...preset, isCustom: true, id: t.id };
    options.push({ value: t.name, label: t.name, isCustom: true, id: t.id });
  }

  return { config: allConfig, options, customTypes, refetch: fetchTypes, deleteType };
}
