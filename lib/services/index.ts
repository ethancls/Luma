import { db } from '@/lib/db';
import { services, checks, serviceLogs } from '@/db/schema';
import { eq, desc, like, and, or, count, sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export interface ServiceFilters {
  categoryId?: string;
  status?: 'online' | 'degraded' | 'offline' | 'unknown';
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateServiceData {
  name: string;
  url?: string;
  port?: number;
  description?: string;
  categoryId?: string;
  tags?: string[];
  dockerComposeSnippet?: string;
  notes?: string;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {
  status?: 'online' | 'degraded' | 'offline' | 'unknown';
}

// Get paginated services with filters
export async function getServices(filters: ServiceFilters = {}) {
  const { categoryId, status, search, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (categoryId) conditions.push(eq(services.categoryId, categoryId));
  if (status) conditions.push(eq(services.status, status));
  if (search) conditions.push(like(services.name, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db.select().from(services).where(where).orderBy(desc(services.updatedAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(services).where(where),
  ]);

  return { services: rows, total: totalResult[0]?.count ?? 0 };
}

// Get single service by id
export async function getService(id: string) {
  const rows = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return rows[0] ?? null;
}

// Create service
export async function createService(data: CreateServiceData) {
  const id = uuid();
  await db.insert(services).values({ id, ...data });
  return getService(id);
}

// Update service
export async function updateService(id: string, data: UpdateServiceData) {
  await db.update(services).set({ ...data, updatedAt: new Date() }).where(eq(services.id, id));
  return getService(id);
}

// Delete service
export async function deleteService(id: string) {
  await db.delete(services).where(eq(services.id, id));
}

// Run healthcheck on a service
export async function runHealthcheck(serviceId: string) {
  const service = await getService(serviceId);
  if (!service || !service.url) {
    // Log error
    await addServiceLog(serviceId, {
      level: 'error',
      message: service ? 'No URL configured for healthcheck' : 'Service not found',
      source: 'healthcheck',
    });
    return null;
  }

  const start = Date.now();
  let statusCode: number | undefined;
  let error: string | undefined;
  let tlsDaysRemaining: number | undefined;

  try {
    const res = await fetch(service.url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    statusCode = res.status;

    // Extract TLS info from response (available in Node.js fetch)
    // Note: The standard fetch API doesn't expose TLS info directly.
    // We store whatever we can; TLS expiry can be checked via a separate mechanism.

    // Update service status based on response
    const newStatus = statusCode >= 200 && statusCode < 400 ? 'online'
      : statusCode >= 400 && statusCode < 500 ? 'degraded'
      : 'offline';
    await db.update(services).set({
      status: newStatus,
      lastChecked: new Date(),
      updatedAt: new Date(),
    }).where(eq(services.id, serviceId));
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    await db.update(services).set({
      status: 'offline',
      lastChecked: new Date(),
      updatedAt: new Date(),
    }).where(eq(services.id, serviceId));
  }

  const responseMs = Date.now() - start;

  // Insert check record
  const id = uuid();
  await db.insert(checks).values({
    id,
    serviceId,
    statusCode,
    responseMs,
    error,
    tlsDaysRemaining,
  });

  // Log the result
  await addServiceLog(serviceId, {
    level: error ? 'error' : statusCode && statusCode >= 400 ? 'warn' : 'info',
    message: error || `Healthcheck returned ${statusCode} in ${responseMs}ms`,
    source: 'healthcheck',
  });

  return getCheck(id);
}

// Get checks for a service
export async function getServiceChecks(serviceId: string, opts: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;

  const [rows, totalResult] = await Promise.all([
    db.select().from(checks).where(eq(checks.serviceId, serviceId)).orderBy(desc(checks.checkedAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(checks).where(eq(checks.serviceId, serviceId)),
  ]);

  return { checks: rows, total: totalResult[0]?.count ?? 0 };
}

async function getCheck(id: string) {
  const rows = await db.select().from(checks).where(eq(checks.id, id)).limit(1);
  return rows[0] ?? null;
}

// Get logs for a service
export async function getServiceLogs(serviceId: string, opts: { level?: string; page?: number; limit?: number } = {}) {
  const { level, page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;

  const conditions = [eq(serviceLogs.serviceId, serviceId)];
  if (level) conditions.push(eq(serviceLogs.level, level as any));

  const [rows, totalResult] = await Promise.all([
    db.select().from(serviceLogs).where(and(...conditions)).orderBy(desc(serviceLogs.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(serviceLogs).where(and(...conditions)),
  ]);

  return { logs: rows, total: totalResult[0]?.count ?? 0 };
}

// Add a log entry
export async function addServiceLog(
  serviceId: string,
  data: { level?: 'info' | 'warn' | 'error'; message: string; source?: 'healthcheck' | 'manual' | 'discovery'; metadata?: Record<string, unknown> }
) {
  const id = uuid();
  await db.insert(serviceLogs).values({
    id,
    serviceId,
    level: data.level ?? 'info',
    message: data.message,
    source: data.source ?? 'manual',
    metadata: data.metadata,
  });
  return id;
}

// Run healthchecks on all services
export async function runAllHealthchecks() {
  const { services: allServices } = await getServices({ limit: 1000 });
  const results = await Promise.allSettled(
    allServices.map(s => runHealthcheck(s.id))
  );
  return results.length;
}
