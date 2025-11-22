// GET /api/schema-triage/progress?table={tableName}
// Get progress stats for a table (columns reviewed vs total)

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getDbConnection } from '@/lib/db/connection';
import { schemaInventory } from '@/lib/db/schema';
import { eq, isNotNull, and } from 'drizzle-orm';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

const querySchema = z.object({
  table: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      table: searchParams.get('table'),
    });

    const db = getDbConnection();

    // Count total columns and reviewed columns
    const result = await db
      .select({
        total: sql<number>`count(*)::int`,
        reviewed: sql<number>`count(${schemaInventory.dispositionId})::int`,
      })
      .from(schemaInventory)
      .where(eq(schemaInventory.tableName, params.table));

    const { total, reviewed } = result[0] || { total: 0, reviewed: 0 };
    const percentComplete = total > 0 ? Math.round((reviewed / total) * 100) : 0;

    return NextResponse.json({
      table: params.table,
      total,
      reviewed,
      percentComplete,
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

    console.error('Error fetching progress:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch progress',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
