import { db, pool } from '@/lib/db';
import { permissions, roles, rolePermissions } from './schema';

const PERMISSIONS = [
  { id: 'perm_machines_list', key: 'machines.list', resource: 'machines', action: 'list', description: 'List machines' },
  { id: 'perm_machines_read', key: 'machines.read', resource: 'machines', action: 'read', description: 'View machine details' },
  { id: 'perm_machines_create', key: 'machines.create', resource: 'machines', action: 'create', description: 'Create machines' },
  { id: 'perm_machines_update', key: 'machines.update', resource: 'machines', action: 'update', description: 'Update machines' },
  { id: 'perm_machines_delete', key: 'machines.delete', resource: 'machines', action: 'delete', description: 'Delete machines' },

  { id: 'perm_connections_list', key: 'connections.list', resource: 'connections', action: 'list', description: 'List connections' },
  { id: 'perm_connections_read', key: 'connections.read', resource: 'connections', action: 'read', description: 'View connection details' },
  { id: 'perm_connections_create', key: 'connections.create', resource: 'connections', action: 'create', description: 'Create connections' },
  { id: 'perm_connections_update', key: 'connections.update', resource: 'connections', action: 'update', description: 'Update connections' },
  { id: 'perm_connections_delete', key: 'connections.delete', resource: 'connections', action: 'delete', description: 'Delete connections' },

  { id: 'perm_sessions_connect', key: 'sessions.connect', resource: 'sessions', action: 'connect', description: 'Open remote sessions' },
  { id: 'perm_sessions_share', key: 'sessions.share', resource: 'sessions', action: 'share', description: 'Share active sessions' },
  { id: 'perm_sessions_kill', key: 'sessions.kill', resource: 'sessions', action: 'kill', description: 'Kill active sessions' },
  { id: 'perm_sessions_replay', key: 'sessions.replay', resource: 'sessions', action: 'replay', description: 'View session recordings' },

  { id: 'perm_settings_read', key: 'settings.read', resource: 'settings', action: 'read', description: 'View settings' },
  { id: 'perm_settings_write', key: 'settings.write', resource: 'settings', action: 'write', description: 'Modify settings' },

  { id: 'perm_audit_read', key: 'audit.read', resource: 'audit', action: 'read', description: 'View audit logs' },

  { id: 'perm_users_list', key: 'users.list', resource: 'users', action: 'list', description: 'List users' },
  { id: 'perm_users_read', key: 'users.read', resource: 'users', action: 'read', description: 'View user details' },
  { id: 'perm_users_invite', key: 'users.invite', resource: 'users', action: 'invite', description: 'Invite new users' },
  { id: 'perm_users_manage_roles', key: 'users.manage_roles', resource: 'users', action: 'manage_roles', description: 'Manage user roles' },
  { id: 'perm_users_transfer_ownership', key: 'users.transfer_ownership', resource: 'users', action: 'transfer_ownership', description: 'Transfer project ownership' },
];

const OWNER_PERMISSIONS = PERMISSIONS.map((p) => p.id);
const ADMIN_PERMISSIONS = OWNER_PERMISSIONS.filter(
  (id) => id !== 'perm_users_manage_roles' && id !== 'perm_users_transfer_ownership',
);
const OPERATOR_PERMISSIONS = PERMISSIONS.filter(
  (p) =>
    p.key.startsWith('machines.') ||
    p.key.startsWith('connections.') ||
    p.key === 'sessions.connect' ||
    p.key === 'sessions.replay' ||
    p.key === 'settings.read',
).map((p) => p.id);
const VIEWER_PERMISSIONS = PERMISSIONS.filter(
  (p) => p.key.endsWith('.list') || p.key.endsWith('.read'),
).map((p) => p.id);

async function seed() {
  console.log('Seeding permissions...');
  await db.insert(permissions).values(PERMISSIONS).onConflictDoNothing();

  console.log('Seeding roles...');

  const systemRoles = [
    { id: crypto.randomUUID(), name: 'owner', description: 'Full access, can transfer ownership', isSystem: true },
    { id: crypto.randomUUID(), name: 'admin', description: 'Full access except user management', isSystem: true },
    { id: crypto.randomUUID(), name: 'operator', description: 'Machine and session management', isSystem: true },
    { id: crypto.randomUUID(), name: 'viewer', description: 'Read-only access', isSystem: true },
  ];

  for (const role of systemRoles) {
    await db.insert(roles).values(role).onConflictDoNothing();
  }

  const roleIdMap: Record<string, string> = {};
  for (const role of systemRoles) {
    roleIdMap[role.name] = role.id;
  }

  const rolePerms: Record<string, string[]> = {
    owner: OWNER_PERMISSIONS,
    admin: ADMIN_PERMISSIONS,
    operator: OPERATOR_PERMISSIONS,
    viewer: VIEWER_PERMISSIONS,
  };

  console.log('Seeding role permissions...');
  for (const [roleName, permKeys] of Object.entries(rolePerms)) {
    const roleId = roleIdMap[roleName];
    for (const permKey of permKeys) {
      await db
        .insert(rolePermissions)
        .values({ roleId, permissionId: permKey })
        .onConflictDoNothing();
    }
  }

  console.log('Seed complete.');
  pool.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
