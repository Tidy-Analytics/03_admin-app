-- ============================================
-- Tidy Analytics Admin Console
-- Database Schema Installation Script
-- Run this script on BOTH databases:
--   1. names
--   2. tidyanalytics-prospecting
-- ============================================

-- ============================================
-- Disposition Lookup Table
-- ============================================
CREATE TABLE IF NOT EXISTS disposition_values (
    id SERIAL PRIMARY KEY,
    label VARCHAR(100) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Seed initial disposition values (only if table is empty)
INSERT INTO disposition_values (label, sort_order)
SELECT * FROM (VALUES
    ('Under Review', 1),
    ('Keep - Primary Source', 2),
    ('Keep - Reference', 3),
    ('Deprecated', 4),
    ('Ignore', 5)
) AS v(label, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM disposition_values LIMIT 1);

-- ============================================
-- Schema Inventory Metadata Table
-- ============================================
CREATE TABLE IF NOT EXISTS schema_inventory (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    column_name VARCHAR(255) NOT NULL,
    column_type VARCHAR(100) NOT NULL,
    notes TEXT,
    disposition_id INTEGER REFERENCES disposition_values(id) ON DELETE SET NULL,
    master_eligible BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(table_name, column_name)
);

-- Index for filtering by table
CREATE INDEX IF NOT EXISTS idx_schema_inventory_table ON schema_inventory(table_name);

-- Index for finding master-eligible columns
CREATE INDEX IF NOT EXISTS idx_schema_inventory_master ON schema_inventory(master_eligible)
    WHERE master_eligible = true;

-- ============================================
-- Triggers for updated_at Timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_schema_inventory_updated_at ON schema_inventory;
CREATE TRIGGER update_schema_inventory_updated_at
    BEFORE UPDATE ON schema_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_disposition_values_updated_at ON disposition_values;
CREATE TRIGGER update_disposition_values_updated_at
    BEFORE UPDATE ON disposition_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify installation:
-- SELECT 'disposition_values' AS table_name, COUNT(*) AS row_count FROM disposition_values
-- UNION ALL
-- SELECT 'schema_inventory', COUNT(*) FROM schema_inventory;
