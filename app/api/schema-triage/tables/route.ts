// GET /api/schema-triage/tables
// Get list of distinct tables from schema_inventory

import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db/connection';
import { schemaInventory } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const db = getDbConnection();

    const result = await db
      .select({ tableName: schemaInventory.tableName })
      .from(schemaInventory)
      .groupBy(schemaInventory.tableName)
      .orderBy(schemaInventory.tableName);

    const tables = result.map((row) => row.tableName);

    return NextResponse.json({ tables });

  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tables',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
