// Creates default admin account directly in DB
// Run after db:seed: npx tsx --env-file=.env db/seed-admin.ts

import { db, pool } from '@/lib/db';
import { users, accounts } from './schema';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';

const ADMIN_EMAIL = 'admin@luma.sh';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Admin';

async function createAdmin() {
  console.log(`Creating admin account: ${ADMIN_EMAIL}`);

  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
  if (existing.length > 0) {
    console.log('Admin account already exists, skipping');
    pool.close();
    return;
  }

  // Hash password
  const hash = await hashPassword(ADMIN_PASSWORD);

  const userId = crypto.randomUUID();

  // Create user
  await db.insert(users).values({
    id: userId,
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    emailVerified: true,
  });

  // Create account with credentials
  await db.insert(accounts).values({
    id: crypto.randomUUID(),
    userId,
    accountId: userId,
    providerId: 'email',
    password: hash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Admin account created successfully');
  console.log('  Email:', ADMIN_EMAIL);
  console.log('  Password:', ADMIN_PASSWORD);
  pool.close();
}

createAdmin().catch((e) => {
  console.error('Failed to create admin:', e instanceof Error ? e.message : e);
  process.exit(1);
});
