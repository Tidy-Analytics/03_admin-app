// Script to install database schemas
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const databases = [
  { name: 'names', dbName: 'names' },
  { name: 'tidyanalytics-prospecting', dbName: 'tidyanalytics-prospecting' },
];

async function installSchema(dbName) {
  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '25060'),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: dbName,
    ssl: process.env.DATABASE_SSL_MODE === 'require'
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    const sqlPath = path.join(__dirname, '..', 'create-schema-inventory.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log(`\nInstalling schema in database: ${dbName}...`);
    await pool.query(sql);
    console.log(`✓ Schema installed successfully in ${dbName}`);

    // Verify installation
    const result = await pool.query(`
      SELECT 'disposition_values' AS table_name, COUNT(*) AS row_count FROM disposition_values
      UNION ALL
      SELECT 'schema_inventory', COUNT(*) FROM schema_inventory
    `);

    console.log('  Tables created:');
    result.rows.forEach(row => {
      console.log(`    - ${row.table_name}: ${row.row_count} rows`);
    });

  } catch (error) {
    console.error(`✗ Error installing schema in ${dbName}:`, error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('Tidy Analytics Admin Console - Schema Installer');
  console.log('================================================\n');

  for (const db of databases) {
    await installSchema(db.dbName);
  }

  console.log('\n✓ All schemas installed successfully!');
  console.log('\nNext steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Open: http://localhost:3000');
}

main().catch(console.error);
