import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getService, updateService, deleteService } from '@/lib/services';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().optional(),
  port: z.number().int().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dockerComposeSnippet: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['online', 'degraded', 'offline', 'unknown']).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const service = await getService(id);
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

  return NextResponse.json({ data: service });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const service = await updateService(id, parsed.data);

  await logAudit({
    userId,
    action: 'services.update',
    resourceType: 'service',
    resourceName: service?.name ?? id,
    status: 'success',
    req,
  });

  return NextResponse.json({ data: service });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;

  const existing = await getService(id);
  if (!existing) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

  await deleteService(id);

  await logAudit({
    userId,
    action: 'services.delete',
    resourceType: 'service',
    resourceName: existing.name,
    status: 'success',
    req,
  });

  return NextResponse.json({ data: null });
}
