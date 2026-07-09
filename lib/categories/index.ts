import { db } from '@/lib/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export async function getCategory(id: string) {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createCategory(data: {
  name: string;
  slug: string;
  icon?: string;
  color?: string;
}) {
  const id = uuid();
  await db.insert(categories).values({ id, ...data });
  return getCategory(id);
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; slug: string; icon: string; color: string }>,
) {
  await db.update(categories).set(data).where(eq(categories.id, id));
  return getCategory(id);
}

export async function deleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id));
}
