import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getConnection, updateConnection, deleteConnection } from '@/lib/connections';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  protocol: z.enum(['ssh', 'rdp', 'vnc', 'telnet']).optional(),
  host: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  username: z.string().min(1).optional(),
  credential: z.string().min(1).optional(),
  credentialType: z.enum(['password', 'private_key']).optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const conn = await getConnection(id);
  if (!conn) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: conn });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const conn = await updateConnection(id, parsed.data);
  if (!conn) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: conn });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await deleteConnection(id);
  return new Response(null, { status: 204 });
}
