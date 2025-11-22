// GET /api/schema-triage/sample?table={tableName}
// Get a random sample row from the specified table

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getDbConnection, validateTableExists } from '@/lib/db/connection';
import { schemaInventory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

    // Validate table exists (SQL injection protection)
    const exists = await validateTableExists(db, params.table);
    if (!exists) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Get a random row from the table
    const escapedTableName = params.table.replace(/"/g, '""');
    const result = await db.execute(
      sql.raw(`SELECT * FROM "${escapedTableName}" ORDER BY random() LIMIT 1`)
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        table: params.table,
        sampleRow: null,
        message: 'Table is empty',
      });
    }

    // Get master-eligible columns for highlighting
    const masterEligibleCols = await db
      .select({ columnName: schemaInventory.columnName })
      .from(schemaInventory)
      .where(
        eq(schemaInventory.tableName, params.table)
      )
      .where(eq(schemaInventory.masterEligible, true));

    const masterEligibleColumns = masterEligibleCols.map((c) => c.columnName);

    return NextResponse.json({
      table: params.table,
      sampleRow: result.rows[0],
      masterEligibleColumns,
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

    console.error('Error fetching sample row:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch sample row',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
