import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMachineLogs } from '@/lib/machines';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level') ?? undefined;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);

  try {
    const result = await getMachineLogs(id, { level, page, limit });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch machine logs', error);
    return NextResponse.json({ error: 'Failed to fetch machine logs' }, { status: 500 });
  }
}
