import { LoadingTable } from "@/components/shared/loading-table";

export default function MachinesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Machines</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and monitor your homelab machines
        </p>
      </div>
      <LoadingTable rows={6} cols={5} />
    </div>
  );
}
