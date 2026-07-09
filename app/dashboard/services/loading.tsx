import { LoadingTable } from '@/components/shared/loading-table';

export default function ServicesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage and monitor your homelab services</p>
      </div>
      <LoadingTable rows={8} cols={5} />
    </div>
  );
}
