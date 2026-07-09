"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
}

interface ServiceFiltersProps {
  onFiltersChange: (filters: {
    categoryId?: string;
    status?: string;
    search?: string;
  }) => void;
  onAddClick: () => void;
}

const STATUS_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "degraded", label: "Degraded" },
  { value: "offline", label: "Offline" },
  { value: "unknown", label: "Unknown" },
];

export function ServiceFilters({
  onFiltersChange,
  onAddClick,
}: ServiceFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") ?? "",
  );
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevFiltersRef = useRef<string>("");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.data)) {
          setCategories(json.data);
        }
      })
      .catch(() => {
        // Silently fail - categories are optional
      });
  }, []);

  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      }
      router.replace(`${pathname}?${next.toString()}`);
    },
    [searchParams, router, pathname],
  );

  const emitFilters = useCallback(
    (overrides: {
      categoryId?: string;
      status?: string;
      search?: string;
    }) => {
      const next = {
        categoryId: (overrides.categoryId ?? categoryId) || undefined,
        status: (overrides.status ?? status) || undefined,
        search: (overrides.search ?? search) || undefined,
      };
      const key = JSON.stringify(next);
      if (key !== prevFiltersRef.current) {
        prevFiltersRef.current = key;
        onFiltersChange(next);
      }
    },
    [categoryId, status, search, onFiltersChange],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateUrl({ search: value });
        emitFilters({ search: value });
      }, 300);
    },
    [emitFilters, updateUrl],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleCategoryChange = useCallback(
    (value: string | null) => {
      const v = !value || value === "all" ? "" : value;
      setCategoryId(v);
      updateUrl({ categoryId: v });
      emitFilters({ categoryId: v });
    },
    [emitFilters, updateUrl],
  );

  const handleStatusChange = useCallback(
    (value: string | null) => {
      const v = !value || value === "all" ? "" : value;
      setStatus(v);
      updateUrl({ status: v });
      emitFilters({ status: v });
    },
    [emitFilters, updateUrl],
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        onValueChange={handleCategoryChange}
        value={categoryId || "all"}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Categories">
            {(value: string) => {
              if (!value || value === "all") return "All Categories";
              return categories.find((c) => c.id === value)?.name ?? value;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        onValueChange={handleStatusChange}
        value={status || "all"}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Statuses">
            {(value: string) => {
              if (!value || value === "all") return "All Statuses";
              return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <InputGroup className="w-[220px]">
        <InputGroupAddon>
          <MagnifyingGlass className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search services..."
          type="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </InputGroup>

      <div className="flex-1" />

      <Button onClick={onAddClick}>
        <Plus className="size-4" />
        Add Service
      </Button>
    </div>
  );
}
