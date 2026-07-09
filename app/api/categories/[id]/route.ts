import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getCategory, updateCategory, deleteCategory } from '@/lib/categories';

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

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

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const category = await updateCategory(id, parsed.data);

    await logAudit({
      userId: session.user.id,
      action: 'update',
      resourceType: 'category',
      resourceName: category?.name ?? id,
      status: 'success',
      req,
    });

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error('Failed to update category', error);

    await logAudit({
      userId: session.user.id,
      action: 'update',
      resourceType: 'category',
      resourceName: id,
      status: 'error',
      metadata: { error: String(error) },
      req,
    });

    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
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
    const category = await getCategory(id);
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await deleteCategory(id);

    await logAudit({
      userId: session.user.id,
      action: 'delete',
      resourceType: 'category',
      resourceName: category.name,
      status: 'success',
      req,
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to delete category', error);

    await logAudit({
      userId: session.user.id,
      action: 'delete',
      resourceType: 'category',
      resourceName: id,
      status: 'error',
      metadata: { error: String(error) },
      req,
    });

    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
