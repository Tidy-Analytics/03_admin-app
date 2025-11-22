import { getDbConnection } from '@/lib/db/connection';
import { dispositionValues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createSchema = z.object({
  label: z.string().min(1).max(100),
  sortOrder: z.number().int().default(0),
});

// GET - List all active dispositions
export async function GET(request: NextRequest) {
  // Dispositions are database-agnostic, use 'names' connection
  const db = getDbConnection('names');

  try {
    const result = await db
      .select()
      .from(dispositionValues)
      .where(eq(dispositionValues.isActive, true))
      .orderBy(dispositionValues.sortOrder);

    return NextResponse.json({ dispositions: result });
  } catch (error) {
    console.error('Dispositions fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch dispositions'
    }, { status: 500 });
  }
}

// POST - Create new disposition
export async function POST(request: NextRequest) {
  const db = getDbConnection('names');

  try {
    const body = await request.json();
    const validated = createSchema.parse(body);

    const [created] = await db
      .insert(dispositionValues)
      .values(validated)
      .returning();

    return NextResponse.json({
      success: true,
      disposition: created
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 });
    }

    console.error('Disposition create error:', error);
    return NextResponse.json({
      error: 'Failed to create disposition'
    }, { status: 500 });
  }
}
