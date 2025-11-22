// Database schema definitions using Drizzle ORM
import { pgTable, serial, varchar, text, integer, boolean, timestamp, unique } from 'drizzle-orm/pg-core';

export const dispositionValues = pgTable('disposition_values', {
  id: serial('id').primaryKey(),
  label: varchar('label', { length: 100 }).notNull().unique(),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const schemaInventory = pgTable('schema_inventory', {
  id: serial('id').primaryKey(),
  tableName: varchar('table_name', { length: 255 }).notNull(),
  columnName: varchar('column_name', { length: 255 }).notNull(),
  columnType: varchar('column_type', { length: 100 }).notNull(),
  notes: text('notes'),
  dispositionId: integer('disposition_id').references(() => dispositionValues.id, { onDelete: 'set null' }),
  masterEligible: boolean('master_eligible').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  unq: unique().on(table.tableName, table.columnName),
}));

export const tableNotes = pgTable('table_notes', {
  id: serial('id').primaryKey(),
  tableName: varchar('table_name', { length: 255 }).notNull().unique(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type exports for TypeScript
export type DispositionValue = typeof dispositionValues.$inferSelect;
export type NewDispositionValue = typeof dispositionValues.$inferInsert;
export type SchemaInventoryRow = typeof schemaInventory.$inferSelect;
export type NewSchemaInventoryRow = typeof schemaInventory.$inferInsert;
export type TableNote = typeof tableNotes.$inferSelect;
export type NewTableNote = typeof tableNotes.$inferInsert;
