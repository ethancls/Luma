"use client";

import { useState } from 'react';
import { HardDrive, DotsThree, PencilSimple, Trash } from '@phosphor-icons/react';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator } from '@/components/ui/menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogClose } from '@/components/ui/alert-dialog';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { LoadingTable } from '@/components/shared/loading-table';
import { toastSuccess, toastError } from '@/lib/toast-utils';

interface Service {
  id: string;
  name: string;
  url: string | null;
  port: number | null;
  status: 'online' | 'degraded' | 'offline' | 'unknown';
  tags: string[];
  lastChecked: string | null;
}

interface ServiceTableProps {
  services: Service[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onRowClick: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: 'bg-emerald-400',
    degraded: 'bg-amber-400',
    offline: 'bg-red-400',
    unknown: 'bg-muted-foreground/40',
  };
  return <span className={`inline-block size-2.5 shrink-0 rounded-full ${colors[status] || colors.unknown}`} title={status} />;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Never';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function getVisiblePages(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (page > 3) pages.push('ellipsis');
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
  if (page < totalPages - 2) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

export function ServiceTable({ services, total, page, limit, onPageChange, onRowClick, onEdit, onDelete, loading }: ServiceTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = services.length > 0 && services.every(s => selected.has(s.id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) { setSelected(new Set()); }
    else { setSelected(new Set(services.map(s => s.id))); }
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  async function deleteSelected() {
    for (const id of selected) {
      try { await fetch(`/api/services/${id}`, { method: 'DELETE' }); onDelete(id); } catch {}
    }
    toastSuccess('Deleted', `${selected.size} service(s) deleted`);
    setSelected(new Set());
  }

  if (loading) return <LoadingTable rows={8} cols={6} />;

  if (services.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><HardDrive className="size-6 text-foreground" /></EmptyMedia>
          <EmptyTitle>No services found</EmptyTitle>
          <EmptyDescription>Add your first service to start monitoring.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-lg border bg-accent/30 px-4 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <AlertDialog>
            <AlertDialogTrigger>
              <Button variant="destructive-outline" size="xs">Delete selected</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selected.size} service(s)?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose><Button variant="outline" size="sm">Cancel</Button></AlertDialogClose>
                <Button variant="destructive" size="sm" onClick={deleteSelected}>Delete</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" size="xs" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <Table variant="card">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead className="w-10" />
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">URL</TableHead>
            <TableHead className="hidden lg:table-cell">Tags</TableHead>
            <TableHead className="hidden sm:table-cell w-[100px]">Last Check</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id} className={selected.has(service.id) ? 'bg-accent/50' : undefined}>
              <TableCell>
                <Checkbox checked={selected.has(service.id)} onCheckedChange={() => toggleOne(service.id)} />
              </TableCell>
              <TableCell className="text-center">
                <StatusDot status={service.status} />
              </TableCell>
              <TableCell>
                <button
                  className="cursor-pointer text-left font-medium text-primary hover:underline"
                  onClick={(e) => { e.stopPropagation(); onRowClick(service.id); }}
                >
                  {service.name}
                </button>
              </TableCell>
              <TableCell className="hidden max-w-[180px] truncate text-sm text-muted-foreground sm:table-cell">
                {service.url || <span className="text-muted-foreground/40">—</span>}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {service.tags.length === 0 && <span className="text-xs text-muted-foreground/40">—</span>}
                  {service.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                {formatTime(service.lastChecked)}
              </TableCell>
              <TableCell>
                <Menu>
                  <MenuTrigger>
                    <Button variant="ghost" size="icon-xs" className="text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                      <DotsThree className="size-4" />
                    </Button>
                  </MenuTrigger>
                  <MenuPopup align="end" className="w-36">
                    <MenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onEdit?.(service.id); }}>
                      <PencilSimple className="size-4" />
                      Edit
                    </MenuItem>
                    <MenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger>
                        <MenuItem className="cursor-pointer text-red-500" onClick={(e) => e.stopPropagation()}>
                          <Trash className="size-4" />
                          Delete
                        </MenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {service.name}?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogClose><Button variant="outline" size="sm">Cancel</Button></AlertDialogClose>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            try {
                              const res = await fetch(`/api/services/${service.id}`, { method: 'DELETE' });
                              if (!res.ok) throw new Error();
                              toastSuccess('Deleted', service.name);
                              onDelete(service.id);
                            } catch { toastError('Failed', 'Could not delete service'); }
                          }}>Delete</Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </MenuPopup>
                </Menu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => page > 1 && onPageChange(page - 1)} className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
            </PaginationItem>
            {getVisiblePages(page, totalPages).map((p, i) =>
              p === 'ellipsis' ? (
                <PaginationItem key={`e-${i}`}><span className="flex min-w-7 justify-center text-muted-foreground">...</span></PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === page} onClick={() => onPageChange(p)} className="cursor-pointer">{p}</PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext onClick={() => page < totalPages && onPageChange(page + 1)} className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
