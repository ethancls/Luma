import { db } from "@/lib/db";
import { machineTypes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export interface MachineTypeRow {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export async function getMachineTypes(): Promise<MachineTypeRow[]> {
  return db.select().from(machineTypes).orderBy(desc(machineTypes.createdAt));
}

export async function createMachineType(data: {
  name: string;
  color: string;
}): Promise<MachineTypeRow> {
  const id = uuid();
  await db.insert(machineTypes).values({ id, ...data });
  const rows = await db
    .select()
    .from(machineTypes)
    .where(eq(machineTypes.id, id))
    .limit(1);
  return rows[0];
}
