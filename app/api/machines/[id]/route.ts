import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getMachine, updateMachine, deleteMachine } from '@/lib/machines';

const updateMachineSchema = z.object({
  name: z.string().min(1).optional(),
  host: z.string().min(1).optional(),
  type: z.string().optional(),
  cpuCores: z.number().int().positive().optional(),
  ramGb: z.number().int().positive().optional(),
  diskGb: z.number().int().positive().optional(),
  notes: z.string().optional(),
  status: z.enum(['online', 'offline', 'unknown']).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const machine = await getMachine(id);
    if (!machine) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ data: machine });
  } catch (error) {
    console.error('Failed to fetch machine', error);
    return NextResponse.json({ error: 'Failed to fetch machine' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateMachineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const machine = await updateMachine(id, parsed.data);

    await logAudit({
      userId: session.user.id,
      action: 'update',
      resourceType: 'machine',
      resourceName: machine?.name ?? id,
      status: 'success',
      req,
    });

    return NextResponse.json({ data: machine });
  } catch (error) {
    console.error('Failed to update machine', error);

    await logAudit({
      userId: session.user.id,
      action: 'update',
      resourceType: 'machine',
      resourceName: id,
      status: 'error',
      metadata: { error: String(error) },
      req,
    });

    return NextResponse.json({ error: 'Failed to update machine' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const machine = await getMachine(id);
    if (!machine) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await deleteMachine(id);

    await logAudit({
      userId: session.user.id,
      action: 'delete',
      resourceType: 'machine',
      resourceName: machine.name,
      status: 'success',
      req,
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to delete machine', error);

    await logAudit({
      userId: session.user.id,
      action: 'delete',
      resourceType: 'machine',
      resourceName: id,
      status: 'error',
      metadata: { error: String(error) },
      req,
    });

    return NextResponse.json({ error: 'Failed to delete machine' }, { status: 500 });
  }
}
