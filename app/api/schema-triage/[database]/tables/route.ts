import { getDbConnection, type DatabaseName } from '@/lib/db/connection';
import { schemaInventory } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ database: string }> }
) {
  const { database: databaseParam } = await params;
  const validDatabases: DatabaseName[] = ['names', 'tidyanalytics-prospecting'];

  if (!validDatabases.includes(databaseParam as DatabaseName)) {
    return NextResponse.json({ error: 'Invalid database name' }, { status: 400 });
  }

  const database = databaseParam as DatabaseName;
  const db = getDbConnection(database);

  try {
    const result = await db
      .selectDistinct({ tableName: schemaInventory.tableName })
      .from(schemaInventory)
      .orderBy(schemaInventory.tableName);

    return NextResponse.json({
      tables: result.map(r => r.tableName)
    });

  } catch (error) {
    console.error('Tables fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch tables'
    }, { status: 500 });
  }
}
