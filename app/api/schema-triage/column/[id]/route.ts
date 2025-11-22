// PATCH /api/schema-triage/column/[id]
// Update column metadata (disposition, master_eligible)

import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/connection';
import { schemaInventory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
  dispositionId: z.number().nullable().optional(),
  masterEligible: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid column ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates = updateSchema.parse(body);

    const db = getDbConnection();

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.dispositionId !== undefined) {
      updateData.dispositionId = updates.dispositionId;
    }

    if (updates.masterEligible !== undefined) {
      updateData.masterEligible = updates.masterEligible;
    }

    // Update the column
    await db
      .update(schemaInventory)
      .set(updateData)
      .where(eq(schemaInventory.id, id));

    return NextResponse.json({
      message: 'Column updated successfully',
      id,
      updates,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Error updating column:', error);
    return NextResponse.json(
      {
        error: 'Failed to update column',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
