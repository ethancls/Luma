import { LoadingTable } from '@/components/shared/loading-table';

export default function ServiceDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-2.5 rounded-full bg-muted" />
        <div className="h-6 w-48 rounded bg-muted" />
      </div>
      <LoadingTable rows={4} cols={4} />
    </div>
  );
}
