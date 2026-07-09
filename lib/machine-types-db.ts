import { db } from "@/lib/db";
import { machineTypes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function getMachineTypes() {
  return db.select().from(machineTypes).orderBy(desc(machineTypes.createdAt));
}

export async function createMachineType(data: { name: string; color: string }) {
  const id = uuid();
  await db.insert(machineTypes).values({ id, ...data });
  const rows = await db.select().from(machineTypes).where(eq(machineTypes.id, id)).limit(1);
  return rows[0];
}
