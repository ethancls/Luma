import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getMachineTypes, createMachineType } from "@/lib/machine-types-db";

const createSchema = z.object({
  name: z.string().min(1),
  color: z.enum(["blue", "amber", "emerald", "purple", "red", "slate", "cyan", "pink", "indigo", "teal", "orange", "lime"]),
});

export async function GET() {
  try {
    const types = await getMachineTypes();
    return NextResponse.json({ data: types });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const type = await createMachineType(parsed.data);
  return NextResponse.json({ data: type }, { status: 201 });
}
