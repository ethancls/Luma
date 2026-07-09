export interface MachineTypeConfig {
  label: string;
  className: string;
  dotColor: string;
}

const COLOR_PRESETS: Record<string, { className: string; dotColor: string }> = {
  blue: {
    className: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
    dotColor: "bg-blue-500",
  },
  amber: {
    className: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    dotColor: "bg-amber-500",
  },
  emerald: {
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
  },
  purple: {
    className: "bg-purple-50 text-purple-700 dark:bg-purple-400/10 dark:text-purple-300",
    dotColor: "bg-purple-500",
  },
  red: {
    className: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300",
    dotColor: "bg-red-500",
  },
  slate: {
    className: "bg-slate-50 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300",
    dotColor: "bg-slate-500",
  },
};

const BUILT_IN_TYPES: Record<string, { label: string; color: string }> = {
  vps: { label: "VPS", color: "blue" },
  "bare-metal": { label: "Bare Metal", color: "amber" },
  pi: { label: "Raspberry Pi", color: "emerald" },
  nas: { label: "NAS", color: "purple" },
};

export function buildMachineTypeConfig(
  customTypes: { id: string; name: string; color: string }[],
): Record<string, MachineTypeConfig> {
  const config: Record<string, MachineTypeConfig> = {};
  for (const [value, { label, color }] of Object.entries(BUILT_IN_TYPES)) {
    const preset = COLOR_PRESETS[color] ?? COLOR_PRESETS.blue;
    config[value] = { label, className: preset.className, dotColor: preset.dotColor };
  }
  for (const t of customTypes) {
    const preset = COLOR_PRESETS[t.color] ?? COLOR_PRESETS.blue;
    config[t.name] = { label: t.name, className: preset.className, dotColor: preset.dotColor };
  }
  return config;
}

export function getMachineTypeOptions(
  customTypes: { id: string; name: string; color: string }[],
): { value: string; label: string }[] {
  const options = Object.entries(BUILT_IN_TYPES).map(([value, { label }]) => ({ value, label }));
  for (const t of customTypes) {
    options.push({ value: t.name, label: t.name });
  }
  return options;
}
