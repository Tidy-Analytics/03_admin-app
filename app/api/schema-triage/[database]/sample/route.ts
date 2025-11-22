import { getDbConnection, validateTableExists, type DatabaseName } from '@/lib/db/connection';
import { schemaInventory } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ database: string }> }
) {
  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get('table');

  if (!tableName) {
    return NextResponse.json({
      error: 'Missing required parameter: table'
    }, { status: 400 });
  }

  const { database: databaseParam } = await params;
  const validDatabases: DatabaseName[] = ['names', 'tidyanalytics-prospecting'];
  if (!validDatabases.includes(databaseParam as DatabaseName)) {
    return NextResponse.json({ error: 'Invalid database' }, { status: 400 });
  }

  const database = databaseParam as DatabaseName;
  const db = getDbConnection(database);

  try {
    // Validate table exists (SQL injection protection)
    const tableExists = await validateTableExists(db, tableName);
    if (!tableExists) {
      return NextResponse.json({
        error: 'Table not found'
      }, { status: 404 });
    }

    // Get master_eligible columns for highlighting
    const metadata = await db
      .select()
      .from(schemaInventory)
      .where(
        and(
          eq(schemaInventory.tableName, tableName),
          eq(schemaInventory.masterEligible, true)
        )
      );

    const masterEligibleColumns = metadata.map(m => m.columnName);

    // Get random row from actual table
    // SQL injection is prevented by validateTableExists check above
    const result = await db.execute(
      sql.raw(`SELECT * FROM "${tableName.replace(/"/g, '""')}" ORDER BY random() LIMIT 1`)
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        tableName,
        row: null,
        masterEligibleColumns,
        message: 'Table is empty'
      });
    }

    return NextResponse.json({
      tableName,
      row: result.rows[0],
      masterEligibleColumns
    });

  } catch (error) {
    console.error('Sample row fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch sample row',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
