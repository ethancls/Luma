import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getCategories, createCategory } from '@/lib/categories';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const categories = await getCategories();

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error('Failed to fetch categories', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
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

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const category = await createCategory(parsed.data);

    await logAudit({
      userId: session.user.id,
      action: 'create',
      resourceType: 'category',
      resourceName: parsed.data.name,
      status: 'success',
      req,
    });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    console.error('Failed to create category', error);

    await logAudit({
      userId: session.user.id,
      action: 'create',
      resourceType: 'category',
      resourceName: parsed.data.name,
      status: 'error',
      metadata: { error: String(error) },
      req,
    });

    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
