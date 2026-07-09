import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getServices, createService } from '@/lib/services';
import { db } from '@/lib/db';
import { serviceMachine } from '@/db/schema';
import { v4 as uuid } from 'uuid';

const createSchema = z.object({
  name: z.string().min(1),
  url: z.string().optional(),
  port: z.number().int().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  machineId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dockerComposeSnippet: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

  const result = await getServices({ categoryId, status: status as any, search, page, limit });
  return NextResponse.json({ data: result });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { machineId, ...serviceData } = parsed.data;
  const service = await createService(serviceData);

  if (machineId) {
    await db.insert(serviceMachine).values({ serviceId: service!.id, machineId });
  }

  await logAudit({
    userId,
    action: 'services.create',
    resourceType: 'service',
    resourceName: parsed.data.name,
    status: 'success',
    req,
  });

  return NextResponse.json({ data: service }, { status: 201 });
}
