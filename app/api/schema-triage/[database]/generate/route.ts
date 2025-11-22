import { getDbConnection, type DatabaseName } from '@/lib/db/connection';
import { schemaInventory } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ database: string }> }
) {
  const { database: databaseParam } = await params;
  const validDatabases: DatabaseName[] = ['names', 'tidyanalytics-prospecting'];

  if (!validDatabases.includes(databaseParam as DatabaseName)) {
    return NextResponse.json({ error: 'Invalid database' }, { status: 400 });
  }

  const database = databaseParam as DatabaseName;
  const db = getDbConnection(database);

  try {
    // Query information_schema for all columns
    const columns = await db.execute(
      sql.raw(`
        SELECT
          table_name,
          column_name,
          CASE
            WHEN data_type = 'character varying' THEN
              'varchar(' || COALESCE(character_maximum_length::text, '') || ')'
            WHEN data_type IN ('integer', 'bigint', 'smallint') THEN data_type
            WHEN data_type = 'timestamp without time zone' THEN 'timestamp'
            ELSE data_type
          END as column_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name NOT IN ('schema_inventory', 'disposition_values')
        ORDER BY table_name, ordinal_position
      `)
    );

    // Upsert into schema_inventory
    // ON CONFLICT preserves existing triage work if re-run
    let insertedCount = 0;
    for (const col of columns.rows) {
      const row: any = col;
      try {
        await db.insert(schemaInventory)
          .values({
            tableName: row.table_name,
            columnName: row.column_name,
            columnType: row.column_type,
          })
          .onConflictDoNothing();
        insertedCount++;
      } catch (err) {
        // Individual insert failed - likely already exists, continue
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      count: columns.rows.length,
      inserted: insertedCount,
      message: `Schema inventory generated for '${database}' database`
    });

  } catch (error) {
    console.error('Schema generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate schema inventory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
