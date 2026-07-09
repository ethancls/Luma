import { db } from '@/lib/db';
import { auditLogs, accessLogs } from '@/db/schema';

interface AuditEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceName: string;
  project?: string;
  status: 'success' | 'error';
  metadata?: Record<string, unknown>;
  req?: Request;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const ipAddress = entry.req?.headers?.get('x-forwarded-for') || entry.req?.headers?.get('x-real-ip') || undefined;
    const userAgent = entry.req?.headers?.get('user-agent') || undefined;

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceName: entry.resourceName,
      project: entry.project,
      status: entry.status,
      metadata: entry.metadata,
      ipAddress,
      userAgent,
    });
  } catch {
    // Don't let audit logging failures break the app
    console.error('Failed to write audit log', entry);
  }
}

interface AccessEntry {
  userId?: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs?: number;
  req: Request;
}

export async function logAccess(entry: AccessEntry): Promise<void> {
  try {
    const ipAddress = entry.req.headers.get('x-forwarded-for') || entry.req.headers.get('x-real-ip') || undefined;
    const userAgent = entry.req.headers.get('user-agent') || undefined;

    await db.insert(accessLogs).values({
      id: crypto.randomUUID(),
      userId: entry.userId,
      method: entry.method,
      path: entry.path,
      statusCode: entry.statusCode,
      durationMs: entry.durationMs,
      ipAddress,
      userAgent,
    });
  } catch {
    console.error('Failed to write access log', entry);
  }
}
