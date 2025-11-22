// POST /api/schema-triage/generate
// Generate schema inventory from information_schema (tidyanalytics-prospecting only)

import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/connection';
import { schemaInventory } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    const db = getDbConnection();

    // Query information_schema for all columns
    const result = await db.execute(
      sql.raw(`
        SELECT
          table_name,
          column_name,
          data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `)
    );

    const columns = result.rows as Array<{
      table_name: string;
      column_name: string;
      data_type: string;
    }>;

    if (columns.length === 0) {
      return NextResponse.json({
        message: 'No columns found in public schema',
        count: 0,
      });
    }

    // Insert into schema_inventory (ON CONFLICT DO NOTHING preserves existing triage work)
    let insertedCount = 0;
    for (const col of columns) {
      try {
        await db.insert(schemaInventory).values({
          tableName: col.table_name,
          columnName: col.column_name,
          columnType: col.data_type,
        }).onConflictDoNothing();
        insertedCount++;
      } catch (error) {
        // Conflict or error - skip this row
        console.warn(`Skipped ${col.table_name}.${col.column_name}:`, error);
      }
    }

    return NextResponse.json({
      message: `Schema inventory generated successfully`,
      totalColumns: columns.length,
      newColumns: insertedCount,
      existingColumns: columns.length - insertedCount,
    });

  } catch (error) {
    console.error('Error generating schema inventory:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate schema inventory',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
