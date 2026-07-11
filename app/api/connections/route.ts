import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getConnections, createConnection } from '@/lib/connections';
import { z } from 'zod';

const createSchema = z.object({
  machineId: z.string().min(1),
  name: z.string().min(1),
  protocol: z.enum(['ssh', 'rdp', 'vnc', 'telnet']),
  host: z.string().optional(),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1),
  credential: z.string().min(1),
  credentialType: z.enum(['password', 'private_key']),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const machineId = searchParams.get('machineId');
  if (!machineId) return NextResponse.json({ error: 'machineId required' }, { status: 400 });

  const data = await getConnections(machineId);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const conn = await createConnection(parsed.data);
  return NextResponse.json({ data: conn }, { status: 201 });
}
