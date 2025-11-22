-- Migration: Add table_notes table for V2 table-centric workflow
-- Date: 2025-11-22
-- Database: tidyanalytics-prospecting

CREATE TABLE IF NOT EXISTS table_notes (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(255) NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups by table_name
CREATE INDEX IF NOT EXISTS idx_table_notes_table_name ON table_notes(table_name);

-- Add comment for documentation
COMMENT ON TABLE table_notes IS 'Table-level notes for schema triage workflow (V2)';
COMMENT ON COLUMN table_notes.table_name IS 'Name of the database table being documented';
COMMENT ON COLUMN table_notes.notes IS 'Free-form notes about the table (purpose, data quality, consolidation strategy, etc.)';
