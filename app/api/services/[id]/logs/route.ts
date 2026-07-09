import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getServiceLogs } from '@/lib/services';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level') ?? undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

  const result = await getServiceLogs(id, { level, page, limit });
  return NextResponse.json({ data: result });
}
