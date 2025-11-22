// GET /api/schema-triage/table?name={tableName}
// Get all columns for a specific table

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getDbConnection } from '@/lib/db/connection';
import { schemaInventory, dispositionValues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  name: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      name: searchParams.get('name'),
    });

    const db = getDbConnection();

    // Fetch all columns for the table with their disposition info
    const columns = await db
      .select({
        id: schemaInventory.id,
        tableName: schemaInventory.tableName,
        columnName: schemaInventory.columnName,
        columnType: schemaInventory.columnType,
        dispositionId: schemaInventory.dispositionId,
        masterEligible: schemaInventory.masterEligible,
        createdAt: schemaInventory.createdAt,
        updatedAt: schemaInventory.updatedAt,
        dispositionLabel: dispositionValues.label,
      })
      .from(schemaInventory)
      .leftJoin(
        dispositionValues,
        eq(schemaInventory.dispositionId, dispositionValues.id)
      )
      .where(eq(schemaInventory.tableName, params.name))
      .orderBy(schemaInventory.columnName);

    return NextResponse.json({ columns });

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

    console.error('Error fetching table columns:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch table columns',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
