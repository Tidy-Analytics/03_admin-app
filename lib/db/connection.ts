// Database connection for tidyanalytics-prospecting (company consolidation workflow)
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql as drizzleSql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from './schema';

let pool: Pool | null = null;

export function getDbConnection() {
  if (!pool) {
    const dbName = process.env.DATABASE_PROSPECTING;

    if (!dbName) {
      throw new Error('DATABASE_PROSPECTING not configured in environment');
    }

    pool = new Pool({
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '25060'),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: dbName,
      ssl: process.env.DATABASE_SSL_MODE === 'require'
        ? { rejectUnauthorized: false }
        : false,
      max: 10, // Connection pool size
    });
  }

  return drizzle(pool, { schema });
}

// Validate table existence (SQL injection protection)
export async function validateTableExists(
  db: ReturnType<typeof getDbConnection>,
  tableName: string
): Promise<boolean> {
  const result = await db.execute(
    drizzleSql.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = '${tableName.replace(/'/g, "''")}'
      )
    `)
  );

  return (result.rows[0] as any)?.exists ?? false;
}
