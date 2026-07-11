import { db } from '@/lib/db';
import { machines, machineLogs } from '@/db/schema';
import { eq, desc, like, and, or, count } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export interface MachineFilters {
  status?: 'online' | 'offline' | 'unknown';
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateMachineData {
  name: string;
  host: string;
  type?: string;
  cpuCores?: number;
  ramGb?: number;
  diskGb?: number;
  notes?: string;
}

export interface UpdateMachineData extends Partial<CreateMachineData> {
  status?: 'online' | 'offline' | 'unknown';
  lastSeen?: Date;
  latency?: number;
}

// Get paginated machines with filters
export async function getMachines(filters: MachineFilters = {}) {
  const { status, search, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(machines.status, status));
  if (search) conditions.push(or(like(machines.name, `%${search}%`), like(machines.host, `%${search}%`)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db.select().from(machines).where(where).orderBy(desc(machines.updatedAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(machines).where(where),
  ]);

  return { machines: rows, total: totalResult[0]?.count ?? 0 };
}

// Get single machine by id
export async function getMachine(id: string) {
  const rows = await db.select().from(machines).where(eq(machines.id, id)).limit(1);
  return rows[0] ?? null;
}

// Create machine
export async function createMachine(data: CreateMachineData) {
  const id = uuid();
  await db.insert(machines).values({ id, ...data });
  return getMachine(id);
}

// Update machine
export async function updateMachine(id: string, data: UpdateMachineData) {
  await db.update(machines).set({ ...data, updatedAt: new Date() }).where(eq(machines.id, id));
  return getMachine(id);
}

// Delete machine
export async function deleteMachine(id: string) {
  await db.delete(machines).where(eq(machines.id, id));
}

// Get logs for a machine
export async function getMachineLogs(machineId: string, opts: { level?: string; source?: string; page?: number; limit?: number } = {}) {
  const { level, source, page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;

  const conditions = [eq(machineLogs.machineId, machineId)];
  if (level) conditions.push(eq(machineLogs.level, level as any));
  if (source) conditions.push(eq(machineLogs.source, source as any));

  const [rows, totalResult] = await Promise.all([
    db.select().from(machineLogs).where(and(...conditions)).orderBy(desc(machineLogs.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(machineLogs).where(and(...conditions)),
  ]);

  return { logs: rows, total: totalResult[0]?.count ?? 0 };
}

// Add a log entry
export async function addMachineLog(
  machineId: string,
  data: { level?: 'info' | 'warn' | 'error'; message: string; source?: 'ping' | 'manual' | 'discovery'; metadata?: Record<string, unknown> }
) {
  const id = uuid();
  await db.insert(machineLogs).values({
    id,
    machineId,
    level: data.level ?? 'info',
    message: data.message,
    source: data.source ?? 'manual',
    metadata: data.metadata,
  });
  return id;
}
