import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { runDiscovery } from '@/lib/discovery';

const configSchema = z.object({
  host: z.string().url().optional(),
  socketPath: z.string().optional(),
}).refine((d) => d.host || d.socketPath, {
  message: 'Either host or socketPath is required',
});

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

  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const result = await runDiscovery('docker', parsed.data);

  await logAudit({
    userId,
    action: 'discovery.docker.run',
    resourceType: 'discovery',
    resourceName: parsed.data.host ?? parsed.data.socketPath ?? 'unknown',
    status: 'success',
    metadata: { found: result.found, new: result.new, updated: result.updated },
    req,
  });

  return NextResponse.json({ data: result });
}
