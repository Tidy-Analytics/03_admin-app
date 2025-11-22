import { getDbConnection, type DatabaseName } from '@/lib/db/connection';
import { schemaInventory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ database: string }> }
) {
  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get('table');
  const indexStr = searchParams.get('index');

  if (!tableName || !indexStr) {
    return NextResponse.json({
      error: 'Missing required parameters: table, index'
    }, { status: 400 });
  }

  const index = parseInt(indexStr);
  if (isNaN(index) || index < 1) {
    return NextResponse.json({
      error: 'Index must be a positive integer'
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
    // Get all columns for this table
    const columns = await db
      .select()
      .from(schemaInventory)
      .where(eq(schemaInventory.tableName, tableName))
      .orderBy(schemaInventory.id); // Order by creation (discovery) order

    if (columns.length === 0) {
      return NextResponse.json({
        error: 'Table not found in inventory'
      }, { status: 404 });
    }

    const column = columns[index - 1]; // Convert to 0-indexed

    if (!column) {
      return NextResponse.json({
        error: `Column index ${index} out of range (1-${columns.length})`
      }, { status: 404 });
    }

    return NextResponse.json({
      column,
      totalColumns: columns.length,
      currentIndex: index
    });

  } catch (error) {
    console.error('Column fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch column'
    }, { status: 500 });
  }
}
