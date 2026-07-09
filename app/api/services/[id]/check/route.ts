import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { runHealthcheck } from '@/lib/services';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;

  const result = await runHealthcheck(id);

  await logAudit({
    userId,
    action: 'services.healthcheck',
    resourceType: 'service',
    resourceName: id,
    status: result ? 'success' : 'error',
    req,
  });

  if (!result) {
    return NextResponse.json({ error: 'Healthcheck failed — service not found or no URL configured' }, { status: 400 });
  }

  return NextResponse.json({ data: result });
}
