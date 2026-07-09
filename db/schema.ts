import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from 'drizzle-orm/sqlite-core';

/* ─── Better Auth tables ─── */

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  image: text('image'),
  ownedProjectIds: text('owned_project_ids', { mode: 'json' }).$type<string[]>().default([]),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

/* ─── RBAC tables ─── */

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  description: text('description').notNull(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
});

export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
  projectId: text('project_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

export const rolePermissions = sqliteTable(
  'role_permissions',
  {
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

export const userRoles = sqliteTable('user_roles', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: text('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  projectId: text('project_id'),
  assignedBy: text('assigned_by').references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

/* ─── Audit tables ─── */

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceName: text('resource_name').notNull(),
  project: text('project'),
  status: text('status').notNull(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

export const accessLogs = sqliteTable('access_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  method: text('method').notNull(),
  path: text('path').notNull(),
  statusCode: integer('status_code').notNull(),
  durationMs: integer('duration_ms'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

/* ─── Luma v2: service inventory tables ─── */

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  color: text('color'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

export const machines = sqliteTable('machines', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  host: text('host').notNull(),
  type: text('type').default('vps').notNull(),
  cpuCores: integer('cpu_cores'),
  ramGb: integer('ram_gb'),
  diskGb: integer('disk_gb'),
  notes: text('notes'),
  status: text('status', { enum: ['online', 'offline', 'unknown'] }).default('unknown').notNull(),
  lastSeen: integer('last_seen', { mode: 'timestamp' }),
  latency: integer('latency'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

export const machineTypes = sqliteTable('machine_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('blue'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url'),
  port: integer('port'),
  description: text('description'),
  status: text('status', { enum: ['online', 'degraded', 'offline', 'unknown'] }).default('unknown').notNull(),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  dockerComposeSnippet: text('docker_compose_snippet'),
  notes: text('notes'),
  tlsExpiry: integer('tls_expiry', { mode: 'timestamp' }),
  tlsIssuer: text('tls_issuer'),
  lastChecked: integer('last_checked', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

export const serviceMachine = sqliteTable(
  'service_machine',
  {
    serviceId: text('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
    machineId: text('machine_id').notNull().references(() => machines.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.serviceId, t.machineId] })],
);

export const checks = sqliteTable('checks', {
  id: text('id').primaryKey(),
  serviceId: text('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  statusCode: integer('status_code'),
  responseMs: integer('response_ms'),
  error: text('error'),
  tlsDaysRemaining: integer('tls_days_remaining'),
  checkedAt: integer('checked_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

export const serviceLogs = sqliteTable('service_logs', {
  id: text('id').primaryKey(),
  serviceId: text('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  level: text('level', { enum: ['info', 'warn', 'error'] }).default('info').notNull(),
  message: text('message').notNull(),
  source: text('source', { enum: ['healthcheck', 'manual', 'discovery'] }).default('manual').notNull(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

export const machineLogs = sqliteTable('machine_logs', {
  id: text('id').primaryKey(),
  machineId: text('machine_id').notNull().references(() => machines.id, { onDelete: 'cascade' }),
  level: text('level', { enum: ['info', 'warn', 'error'] }).default('info').notNull(),
  message: text('message').notNull(),
  source: text('source', { enum: ['ping', 'manual', 'discovery'] }).default('manual').notNull(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
});

export const discoverySources = sqliteTable('discovery_sources', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['traefik', 'docker', 'scan'] }).notNull(),
  config: text('config', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
  lastSync: integer('last_sync', { mode: 'timestamp' }),
  enabled: integer('enabled', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
});
