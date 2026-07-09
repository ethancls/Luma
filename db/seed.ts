import { db, pool } from '@/lib/db';
import { permissions, roles, rolePermissions } from './schema';

const PERMISSIONS = [
  { id: 'perm_instances_list', key: 'instances.list', resource: 'instances', action: 'list', description: 'List instances' },
  { id: 'perm_instances_read', key: 'instances.read', resource: 'instances', action: 'read', description: 'View instance details' },
  { id: 'perm_instances_create', key: 'instances.create', resource: 'instances', action: 'create', description: 'Create instances' },
  { id: 'perm_instances_update', key: 'instances.update', resource: 'instances', action: 'update', description: 'Update instance config' },
  { id: 'perm_instances_delete', key: 'instances.delete', resource: 'instances', action: 'delete', description: 'Delete instances' },
  { id: 'perm_instances_start', key: 'instances.start', resource: 'instances', action: 'start', description: 'Start instances' },
  { id: 'perm_instances_stop', key: 'instances.stop', resource: 'instances', action: 'stop', description: 'Stop instances' },
  { id: 'perm_instances_restart', key: 'instances.restart', resource: 'instances', action: 'restart', description: 'Restart instances' },
  { id: 'perm_instances_snapshot', key: 'instances.snapshot', resource: 'instances', action: 'snapshot', description: 'Create snapshots' },
  { id: 'perm_instances_restore', key: 'instances.restore', resource: 'instances', action: 'restore', description: 'Restore snapshots' },

  { id: 'perm_snapshots_list', key: 'snapshots.list', resource: 'snapshots', action: 'list', description: 'List snapshots' },
  { id: 'perm_snapshots_create', key: 'snapshots.create', resource: 'snapshots', action: 'create', description: 'Create snapshots' },
  { id: 'perm_snapshots_restore', key: 'snapshots.restore', resource: 'snapshots', action: 'restore', description: 'Restore snapshots' },
  { id: 'perm_snapshots_delete', key: 'snapshots.delete', resource: 'snapshots', action: 'delete', description: 'Delete snapshots' },

  { id: 'perm_images_list', key: 'images.list', resource: 'images', action: 'list', description: 'List images' },
  { id: 'perm_images_read', key: 'images.read', resource: 'images', action: 'read', description: 'View image details' },
  { id: 'perm_images_create', key: 'images.create', resource: 'images', action: 'create', description: 'Create images' },
  { id: 'perm_images_delete', key: 'images.delete', resource: 'images', action: 'delete', description: 'Delete images' },
  { id: 'perm_images_pull', key: 'images.pull', resource: 'images', action: 'pull', description: 'Pull remote images' },

  { id: 'perm_projects_list', key: 'projects.list', resource: 'projects', action: 'list', description: 'List projects' },
  { id: 'perm_projects_read', key: 'projects.read', resource: 'projects', action: 'read', description: 'View project details' },
  { id: 'perm_projects_create', key: 'projects.create', resource: 'projects', action: 'create', description: 'Create projects' },
  { id: 'perm_projects_update', key: 'projects.update', resource: 'projects', action: 'update', description: 'Update projects' },
  { id: 'perm_projects_delete', key: 'projects.delete', resource: 'projects', action: 'delete', description: 'Delete projects' },

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
    p.key.startsWith('instances.') ||
    p.key.startsWith('snapshots.') ||
    p.key === 'images.list' ||
    p.key === 'images.read' ||
    p.key === 'projects.list' ||
    p.key === 'projects.read' ||
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
    { id: crypto.randomUUID(), name: 'operator', description: 'Instance and snapshot management', isSystem: true },
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
