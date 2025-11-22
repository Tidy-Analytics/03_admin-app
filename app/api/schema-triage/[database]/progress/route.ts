import { getDbConnection, type DatabaseName } from '@/lib/db/connection';
import { schemaInventory } from '@/lib/db/schema';
import { eq, isNotNull, and } from 'drizzle-orm';
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
    // Total columns
    const total = await db
      .select()
      .from(schemaInventory)
      .where(eq(schemaInventory.tableName, tableName));

    // Reviewed columns (have a disposition set)
    const reviewed = await db
      .select()
      .from(schemaInventory)
      .where(
        and(
          eq(schemaInventory.tableName, tableName),
          isNotNull(schemaInventory.dispositionId)
        )
      );

    const totalCount = total.length;
    const reviewedCount = reviewed.length;
    const percentage = totalCount > 0
      ? Math.round((reviewedCount / totalCount) * 1000) / 10
      : 0;

    return NextResponse.json({
      tableName,
      total: totalCount,
      reviewed: reviewedCount,
      percentage
    });

  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch progress'
    }, { status: 500 });
  }
}
