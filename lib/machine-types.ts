export interface MachineTypeConfig {
  label: string;
  className: string;
  dotColor: string;
}

export const MACHINE_TYPE_CONFIG: Record<string, MachineTypeConfig> = {
  vps: {
    label: "VPS",
    className:
      "bg-blue-50 px-2.5 text-blue-700 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20",
    dotColor: "bg-blue-500",
  },
  "bare-metal": {
    label: "Bare Metal",
    className:
      "bg-amber-50 px-2.5 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
    dotColor: "bg-amber-500",
  },
  pi: {
    label: "Raspberry Pi",
    className:
      "bg-emerald-50 px-2.5 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
    dotColor: "bg-emerald-500",
  },
  nas: {
    label: "NAS",
    className:
      "bg-purple-50 px-2.5 text-purple-700 ring-purple-600/20 dark:bg-purple-400/10 dark:text-purple-300 dark:ring-purple-400/20",
    dotColor: "bg-purple-500",
  },
};

export const MACHINE_TYPE_OPTIONS = Object.entries(MACHINE_TYPE_CONFIG).map(
  ([value, { label }]) => ({ value, label }),
);
