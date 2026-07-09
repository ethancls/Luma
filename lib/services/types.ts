export interface Service {
  id: string;
  name: string;
  url: string | null;
  port: number | null;
  description: string | null;
  status: 'online' | 'degraded' | 'offline' | 'unknown';
  categoryId: string | null;
  categoryName?: string | null;
  tags: string[];
  dockerComposeSnippet: string | null;
  notes: string | null;
  tlsExpiry: string | null;
  tlsIssuer: string | null;
  lastChecked: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Check {
  id: string;
  serviceId: string;
  statusCode: number | null;
  responseMs: number | null;
  error: string | null;
  tlsDaysRemaining: number | null;
  checkedAt: string;
}

export interface LogEntry {
  id: string;
  serviceId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: 'healthcheck' | 'manual' | 'discovery';
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
