// Run database migrations
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

async function runMigration() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '25060'),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_PROSPECTING,
    ssl: process.env.DATABASE_SSL_MODE === 'require'
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    const migrationPath = path.join(process.cwd(), 'migrations', '002_add_table_notes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Running migration: 002_add_table_notes.sql');
    console.log('Database:', process.env.DATABASE_PROSPECTING);

    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
