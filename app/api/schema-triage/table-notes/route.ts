// GET /api/schema-triage/table-notes?table={tableName}
// PATCH /api/schema-triage/table-notes?table={tableName}
// Get and update table-level notes

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getDbConnection } from '@/lib/db/connection';
import { tableNotes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  table: z.string().min(1),
});

const updateSchema = z.object({
  notes: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      table: searchParams.get('table'),
    });

    const db = getDbConnection();

    const result = await db
      .select()
      .from(tableNotes)
      .where(eq(tableNotes.tableName, params.table))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({
        tableName: params.table,
        notes: null,
      });
    }

    return NextResponse.json(result[0]);

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

    console.error('Error fetching table notes:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch table notes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      table: searchParams.get('table'),
    });

    const body = await request.json();
    const { notes } = updateSchema.parse(body);

    const db = getDbConnection();

    // Upsert table notes
    const existing = await db
      .select()
      .from(tableNotes)
      .where(eq(tableNotes.tableName, params.table))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(tableNotes)
        .set({
          notes,
          updatedAt: new Date(),
        })
        .where(eq(tableNotes.tableName, params.table));
    } else {
      // Insert new
      await db.insert(tableNotes).values({
        tableName: params.table,
        notes,
      });
    }

    return NextResponse.json({
      message: 'Table notes updated successfully',
      tableName: params.table,
      notes,
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

    console.error('Error updating table notes:', error);
    return NextResponse.json(
      {
        error: 'Failed to update table notes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
