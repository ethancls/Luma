"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ServiceDetailHeader } from '@/components/services/service-detail-header';
import { ServiceDetailTabs } from '@/components/services/service-detail-tabs';
import { ServiceForm } from '@/components/services/service-form';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingTable } from '@/components/shared/loading-table';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { HardDrive } from '@phosphor-icons/react';
import type { Service } from '@/lib/services/types';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const fetchService = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/services/${id}`);
      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      if (!res.ok) throw new Error('Failed to fetch service');
      const json = await res.json();
      setService(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchService(); }, [fetchService]);

  async function handleCheck() {
    await fetch(`/api/services/${id}/check`, { method: 'POST' });
    fetchService();
  }

  async function handleDelete() {
    await fetch(`/api/services/${id}`, { method: 'DELETE' });
    router.push('/dashboard/services');
  }

  if (loading) return <div className="space-y-6"><LoadingTable rows={6} cols={4} /></div>;

  if (notFound) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><HardDrive className="size-6 text-foreground" /></EmptyMedia>
            <EmptyTitle>Service not found</EmptyTitle>
            <EmptyDescription>This service doesn't exist or has been deleted.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={fetchService} />;
  if (!service) return null;

  return (
    <div className="space-y-6">
      <ServiceDetailHeader service={service} onCheck={handleCheck} onEdit={() => setFormOpen(true)} onDelete={handleDelete} />
      <ServiceDetailTabs service={service} />

      <ServiceForm open={formOpen} onOpenChange={setFormOpen} service={service} onSuccess={fetchService} />
    </div>
  );
}
