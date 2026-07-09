import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardPanel } from "@/components/ui/card";

export default function MachineDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Info card skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardPanel>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </CardPanel>
      </Card>

      {/* Notes skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardPanel>
          <Skeleton className="h-16 w-full" />
        </CardPanel>
      </Card>

      {/* Services empty skeleton */}
      <Card>
        <CardPanel>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardPanel>
      </Card>
    </div>
  );
}
