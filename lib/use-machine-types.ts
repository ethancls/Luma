"use client";

import { useState, useEffect, useCallback } from "react";
import type { MachineTypeConfig } from "@/lib/machine-types";
import { buildMachineTypeConfig, getMachineTypeOptions } from "@/lib/machine-types";

interface CustomType {
  id: string;
  name: string;
  color: string;
}

export function useMachineTypes() {
  const [customTypes, setCustomTypes] = useState<CustomType[]>([]);

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/machine-types");
      const json = await res.json();
      if (Array.isArray(json.data)) setCustomTypes(json.data);
    } catch {
      // Silently fail — custom types are optional
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const config: Record<string, MachineTypeConfig> = buildMachineTypeConfig(customTypes);
  const options = getMachineTypeOptions(customTypes);

  return { config, options, refetch: fetchTypes };
}
