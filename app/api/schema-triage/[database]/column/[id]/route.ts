import { getDbConnection, type DatabaseName } from '@/lib/db/connection';
import { schemaInventory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchema = z.object({
  dispositionId: z.number().int().positive().nullable().optional(),
  masterEligible: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ database: string; id: string }> }
) {
  const { database: databaseParam, id: idString } = await params;
  const validDatabases: DatabaseName[] = ['names', 'tidyanalytics-prospecting'];

  if (!validDatabases.includes(databaseParam as DatabaseName)) {
    return NextResponse.json({ error: 'Invalid database' }, { status: 400 });
  }

  const id = parseInt(idString);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid column ID' }, { status: 400 });
  }

  const database = databaseParam as DatabaseName;
  const db = getDbConnection(database);

  try {
    const body = await request.json();
    const validated = updateSchema.parse(body);

    // Build update object with only provided fields
    const updateData: any = {};
    if (validated.dispositionId !== undefined) {
      updateData.dispositionId = validated.dispositionId;
    }
    if (validated.masterEligible !== undefined) {
      updateData.masterEligible = validated.masterEligible;
    }
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        error: 'No valid fields to update'
      }, { status: 400 });
    }

    const [updated] = await db
      .update(schemaInventory)
      .set(updateData)
      .where(eq(schemaInventory.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({
        error: 'Column not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      column: updated
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 });
    }

    console.error('Column update error:', error);
    return NextResponse.json({
      error: 'Failed to update column'
    }, { status: 500 });
  }
}
