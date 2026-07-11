import { db } from '@/lib/db';
import { connections } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '@/lib/env';

// ── Encryption ──────────────────────────────────────────────────────────────

const ALGO = 'aes-256-gcm';
const KEY = Buffer.from(env.CONNECTION_ENCRYPTION_KEY.slice(0, 32), 'utf8');

function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

function decrypt(ciphertext: string): string {
  const [ivHex, dataHex, tagHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface CreateConnectionData {
  machineId: string;
  name: string;
  protocol: 'ssh' | 'rdp' | 'vnc' | 'telnet';
  host?: string;
  port: number;
  username: string;
  credential: string;
  credentialType: 'password' | 'private_key';
  parameters?: Record<string, unknown>;
}

export interface UpdateConnectionData extends Partial<Omit<CreateConnectionData, 'machineId'>> {}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function getConnections(machineId: string) {
  return db
    .select({
      id: connections.id,
      machineId: connections.machineId,
      name: connections.name,
      protocol: connections.protocol,
      host: connections.host,
      port: connections.port,
      username: connections.username,
      credentialType: connections.credentialType,
      parameters: connections.parameters,
      createdAt: connections.createdAt,
      updatedAt: connections.updatedAt,
    })
    .from(connections)
    .where(eq(connections.machineId, machineId))
    .orderBy(desc(connections.updatedAt));
}

export async function getConnection(id: string) {
  const rows = await db
    .select()
    .from(connections)
    .where(eq(connections.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Returns connection with credential decrypted — NEVER expose to client */
export async function getConnectionWithCredential(id: string) {
  const conn = await getConnection(id);
  if (!conn) return null;
  return { ...conn, credential: decrypt(conn.credential) };
}

export async function createConnection(data: CreateConnectionData) {
  const id = uuid();
  const encrypted = encrypt(data.credential);
  await db.insert(connections).values({
    id,
    machineId: data.machineId,
    name: data.name,
    protocol: data.protocol,
    host: data.host ?? null,
    port: data.port,
    username: data.username,
    credential: encrypted,
    credentialType: data.credentialType,
    parameters: data.parameters ?? {},
  });
  return getConnection(id);
}

export async function updateConnection(id: string, data: UpdateConnectionData) {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) values.name = data.name;
  if (data.protocol !== undefined) values.protocol = data.protocol;
  if (data.host !== undefined) values.host = data.host;
  if (data.port !== undefined) values.port = data.port;
  if (data.username !== undefined) values.username = data.username;
  if (data.credential !== undefined) values.credential = encrypt(data.credential);
  if (data.credentialType !== undefined) values.credentialType = data.credentialType;
  if (data.parameters !== undefined) values.parameters = data.parameters;
  await db.update(connections).set(values).where(eq(connections.id, id));
  return getConnection(id);
}

export async function deleteConnection(id: string) {
  await db.delete(connections).where(eq(connections.id, id));
}
