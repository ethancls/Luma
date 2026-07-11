import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getMachines, createMachine } from '@/lib/machines';

const createMachineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  host: z.string().min(1, 'Host is required'),
  type: z.string().optional(),
  cpuCores: z.number().int().positive().optional(),
  ramGb: z.number().int().positive().optional(),
  diskGb: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as 'online' | 'offline' | 'unknown' | null;
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);

  try {
    const result = await getMachines({
      status: status ?? undefined,
      search: search ?? undefined,
      page,
      limit,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch machines', error);
    return NextResponse.json({ error: 'Failed to fetch machines' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createMachineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const machine = await createMachine(parsed.data);

    await logAudit({
      userId: session.user.id,
      action: 'create',
      resourceType: 'machine',
      resourceName: parsed.data.name,
      status: 'success',
      req,
    });

    return NextResponse.json({ data: machine }, { status: 201 });
  } catch (error) {
    console.error('Failed to create machine', error);

    await logAudit({
      userId: session.user.id,
      action: 'create',
      resourceType: 'machine',
      resourceName: parsed.data.name,
      status: 'error',
      metadata: { error: String(error) },
      req,
    });

    return NextResponse.json({ error: 'Failed to create machine' }, { status: 500 });
  }
}
