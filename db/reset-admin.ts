import { db, pool } from '@/lib/db';
import { users, accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const existing = await db.select().from(users).where(eq(users.email, 'admin@luma.sh')).limit(1);
  if (existing[0]) {
    await db.delete(accounts).where(eq(accounts.userId, existing[0].id));
    await db.delete(users).where(eq(users.id, existing[0].id));
    console.log('Old admin deleted');
  }
  pool.close();
}
main();
