import { getDbConnection } from '@/lib/db/connection';
import { dispositionValues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDbConnection('names');
  const { id: idString } = await params;
  const id = parseInt(idString);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validated = updateSchema.parse(body);

    const [updated] = await db
      .update(dispositionValues)
      .set(validated)
      .where(eq(dispositionValues.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({
        error: 'Disposition not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      disposition: updated
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 });
    }

    console.error('Disposition update error:', error);
    return NextResponse.json({
      error: 'Failed to update disposition'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDbConnection('names');
  const { id: idString } = await params;
  const id = parseInt(idString);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    // Soft delete: set is_active = false
    const [deleted] = await db
      .update(dispositionValues)
      .set({ isActive: false })
      .where(eq(dispositionValues.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({
        error: 'Disposition not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Disposition deactivated'
    });

  } catch (error) {
    console.error('Disposition delete error:', error);
    return NextResponse.json({
      error: 'Failed to delete disposition'
    }, { status: 500 });
  }
}
