"use client";

import { useState, useEffect, useCallback, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { ServiceFilters } from '@/components/services/service-filters';
import { ServiceTable } from '@/components/services/service-table';
import { ServiceForm } from '@/components/services/service-form';

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ categoryId?: string; status?: string; search?: string }>({});
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<ComponentProps<typeof ServiceForm>['service']>(null);
  const limit = 20;

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/services?${params}`);
      if (!res.ok) throw new Error('Failed to fetch services');
      const json = await res.json();
      setServices(json.data.services);
      setTotal(json.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  function handleFiltersChange(newFilters: { categoryId?: string; status?: string; search?: string }) {
    setFilters(newFilters);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Services" description="Manage and monitor your homelab services" />

      <ServiceFilters onFiltersChange={handleFiltersChange} onAddClick={() => { setEditingService(null); setFormOpen(true); }} />

      {error ? (
        <ErrorState message={error} onRetry={fetchServices} />
      ) : (
        <ServiceTable
          services={services}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onRowClick={(id) => router.push(`/dashboard/services/${id}`)}
          onEdit={async (id) => {
            const res = await fetch(`/api/services/${id}`);
            if (res.ok) {
              const json = await res.json();
              setEditingService(json.data);
              setFormOpen(true);
            }
          }}
          onDelete={() => fetchServices()}
          loading={loading}
        />
      )}

      <ServiceForm open={formOpen} onOpenChange={setFormOpen} service={editingService} onSuccess={fetchServices} />
    </div>
  );
}
