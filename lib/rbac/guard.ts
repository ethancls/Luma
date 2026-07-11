import { db } from '@/lib/db';
import { users, userRoles, roles, rolePermissions, permissions } from '@/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';

export async function checkPermission(
  userId: string,
  permissionKey: string,
  projectName?: string,
): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) return false;

  // Owner of the project has full access
  if (projectName && user.ownedProjectIds?.includes(projectName)) {
    return true;
  }

  // Resolve user's applicable roles for this project context
  const rolesForUser = await db
    .select({
      roleId: userRoles.roleId,
    })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        projectName
          ? or(eq(userRoles.projectId, projectName), isNull(userRoles.projectId))
          : undefined,
      ),
    );

  const roleIds = rolesForUser.map((r) => r.roleId);
  if (roleIds.length === 0) return false;

  // Check if any role grants the permission
  const result = await db
    .select()
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
    .where(and(eq(permissions.key, permissionKey)))
    .limit(1);

  return result.length > 0 && result.some((r) => roleIds.includes(r.role_permissions.roleId));
}

export async function getUserPermissions(
  userId: string,
  projectName?: string,
): Promise<string[]> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return [];

  const isOwner = projectName && user.ownedProjectIds?.includes(projectName);
  if (isOwner) {
    const allPerms = await db.select().from(permissions);
    return allPerms.map((p) => p.key);
  }

  const rolesForUser = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        projectName
          ? or(eq(userRoles.projectId, projectName), isNull(userRoles.projectId))
          : undefined,
      ),
    );

  const roleIds = rolesForUser.map((r) => r.roleId);
  if (roleIds.length === 0) return [];

  const perms = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      // Get permissions from all applicable roles
      undefined,
    );

  return [...new Set(perms.map((p) => p.key))];
}
