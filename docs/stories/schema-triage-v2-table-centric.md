# Story: Schema Triage V2 - Table-Centric Workflow

**Project:** Tidy Analytics Admin Console
**Epic:** Database Schema Triage (Phase 2 - Workflow Optimization)
**Story ID:** ADMIN-002
**Created:** 2025-11-22
**Status:** Done ✅

**✅ CURRENT VERSION:** This is the active implementation replacing V1.

**V1 Story (Superseded):** `/home/joel/03_admin-app/docs/stories/schema-triage-interface.md`
**Implementation Transcript:** `/home/joel/core/docs/transcripts/2025-11-22-schema-triage-v2-implementation.md`
**Live URL:** `http://localhost:3000/admin/schema-triage-v2`

---

## Story Description

As an **admin user**, I want to **review all columns in a table at once with rapid disposition assignment** so that **I can efficiently triage the tidyanalytics-prospecting database for company master consolidation**.

---

## Context

**V1 Learnings:** After using the column-by-column interface, Joel identified workflow inefficiencies:
- Database selector unnecessary (app is dedicated to company consolidation)
- Column-by-column review too slow
- Notes needed at table level, not column level
- Sample row viewer works well but needs better integration

**V2 Goals:** Transform from general-purpose schema triage to focused company consolidation workflow with table-centric batch operations.

**Working Application:** `/home/joel/03_admin-app/` (Next.js 16, running on localhost:3000)

---

## Key Changes from V1

### Removed:
- ❌ Database selector (hardcoded to `tidyanalytics-prospecting`)
- ❌ `names` database support
- ❌ Column-by-column form interface
- ❌ Column-level notes
- ❌ Column navigation (prev/next column)

### Added/Changed:
- ✅ Table-centric layout (all columns visible at once)
- ✅ Button group disposition selectors (rapid assignment)
- ✅ Table-level notes
- ✅ Table navigation (prev/next table)
- ✅ Sample row viewer at bottom (integrated with table selection)
- ✅ Dual table selection (dropdown + prev/next buttons)

---

## Acceptance Criteria

### 1. Database Configuration
- [ ] Application hardcoded to `tidyanalytics-prospecting` database
- [ ] Database selector component removed
- [ ] All API endpoints simplified (no database parameter)

### 2. Table Navigation
- [ ] Table dropdown showing all tables from `schema_inventory`
- [ ] "Previous Table" button (disabled on first table)
- [ ] "Next Table" button (disabled on last table)
- [ ] Both navigation methods update same state
- [ ] Keyboard shortcuts:
  - `Ctrl+Shift+←` : Previous table
  - `Ctrl+Shift+→` : Next table

### 3. Table-Centric Review Interface
- [ ] Display table name and progress ("X of Y columns reviewed")
- [ ] Table-level notes textarea with auto-save (500ms debounce)
- [ ] Scrollable table showing ALL columns for selected table
- [ ] Columns displayed: Column Name | Column Type | Disposition Buttons | Master Eligible
- [ ] Button group for each disposition option per row
- [ ] Selected disposition highlighted/active state
- [ ] Master eligible checkbox (immediate save on toggle)
- [ ] Auto-save on disposition button click

### 4. Disposition Button Groups
- [ ] Load disposition options from `disposition_values` table
- [ ] Render button for each disposition per column row
- [ ] Use abbreviated labels if >4 dispositions (e.g., "PK", "Ign", "Mstr")
- [ ] Visual active state for selected disposition
- [ ] Optimistic updates via TanStack Query

### 5. Generate Schema Inventory
- [ ] Button to trigger schema generation (same as V1)
- [ ] Preserves existing triage work with `ON CONFLICT DO NOTHING`
- [ ] Shows success message with column count

### 6. Sample Row Viewer (Bottom Section)
- [ ] Fixed at bottom of screen
- [ ] "Show Sample Row" button
- [ ] "Refresh Sample" button
- [ ] Displays random row from currently selected table
- [ ] Highlights master-eligible columns
- [ ] Keyboard shortcut: `Ctrl+Shift+R` (refresh sample)

### 7. Progress Tracking
- [ ] Shows "X of Y columns reviewed" for selected table
- [ ] Visual progress bar
- [ ] Updates in real-time as dispositions assigned

---

## API Endpoints

### Modified (remove database parameter):
1. `POST /api/schema-triage/generate` - Generate schema inventory (tidyanalytics-prospecting only)
2. `GET /api/schema-triage/tables` - Get table list
3. `GET /api/schema-triage/table?name={table}` - Get ALL columns for table (renamed from column)
4. `PATCH /api/schema-triage/column/[id]` - Update column metadata (disposition, master_eligible)
5. `GET /api/schema-triage/progress?table={table}` - Get progress stats
6. `GET /api/schema-triage/sample?table={table}` - Get random sample row

### New:
7. `GET /api/schema-triage/table-notes?table={table}` - Get table notes
8. `PATCH /api/schema-triage/table-notes?table={table}` - Update table notes

---

## Database Schema Changes

### New Table: `table_notes`
```sql
CREATE TABLE table_notes (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(255) NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Existing Tables (no changes):
- `disposition_values` - Master list of disposition categories
- `schema_inventory` - Column-level metadata (remove notes column if exists)

---

## Component Structure

```
/app/admin/schema-triage/page.tsx          # Main page (completely redesigned)
/components/table-navigator.tsx            # Table dropdown + prev/next buttons
/components/table-review-grid.tsx          # Table-style column list with buttons
/components/disposition-button-group.tsx   # Button group for single row
/components/table-notes-editor.tsx         # Table-level notes with auto-save
/components/sample-row-viewer.tsx          # Sample row display (moved to bottom)
/lib/hooks/use-table-navigation.ts         # Table nav state management
```

### Removed Components:
- ❌ `components/database-selector.tsx`
- ❌ `components/column-form.tsx`
- ❌ `lib/hooks/use-selected-database.ts`

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Schema Triage - tidyanalytics-prospecting                  │
│                                                              │
│  [Generate Schema Inventory]                                │
│                                                              │
│  [← Previous] [Table Dropdown ▾            ] [Next →]       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  TABLE: companies (Progress: 12/45 columns ▓▓▓░░░░ 27%)    │
│                                                              │
│  Table Notes: [................................................] │
│              [................................................] │
│                                                              │
│  ┌──────────────┬─────────┬────────────────────┬──────────┐ │
│  │ Column Name  │ Type    │ Disposition        │ Master   │ │
│  ├──────────────┼─────────┼────────────────────┼──────────┤ │
│  │ id           │ integer │ [PK] [Ign] [Mstr]  │ ☐        │ │
│  │ company_name │ varchar │ [PK] [Ign] [Mstr]  │ ☑        │ │
│  │ email        │ varchar │ [PK] [Ign] [Mstr]  │ ☑        │ │
│  │ created_at   │ timestamp│[PK] [Ign] [Mstr]  │ ☐        │ │
│  │ ...          │ ...     │ ...                │ ...      │ │
│  └──────────────┴─────────┴────────────────────┴──────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  SAMPLE ROW FROM: companies                                 │
│  [Show Sample Row] [Refresh Sample] (Ctrl+Shift+R)         │
│                                                              │
│  {                                                           │
│    "id": 123,                                               │
│    "company_name": "Acme Corp",  ← Master Eligible         │
│    "email": "info@acme.com",     ← Master Eligible         │
│    "created_at": "2025-01-15"                               │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation Notes

### Disposition Button Groups
- Fetch all disposition values once on page load
- Render button group per column row
- Use abbreviated labels if >4 options:
  ```typescript
  const abbreviate = (label: string) => {
    const abbrevMap: Record<string, string> = {
      'Primary Key': 'PK',
      'Ignore': 'Ign',
      'Master Eligible': 'Mstr',
      'Foreign Key': 'FK',
      'Metadata': 'Meta'
    };
    return abbrevMap[label] || label.substring(0, 4);
  };
  ```
- Active state: `bg-blue-600 text-white`
- Inactive state: `bg-gray-200 text-gray-700 hover:bg-gray-300`

### Auto-Save Strategy
- **Table notes:** 500ms debounce (same as V1 column notes)
- **Disposition buttons:** Immediate save on click
- **Master eligible checkbox:** Immediate save on toggle
- Visual feedback: Toast notification or inline "Saved" indicator

### Table Navigation
- Fetch table list on mount
- Store current table index in state
- Previous/Next buttons increment/decrement index
- Dropdown directly sets index by table name lookup
- Keyboard shortcuts use same state mutation

### Sample Row Viewer
- Fixed position at bottom (or sticky)
- Fetches from currently selected table
- Highlights master-eligible columns in green
- Refresh button gets new random row

---

## Out of Scope

- Multi-database support (removed intentionally)
- Bulk disposition assignment (future enhancement)
- Column filtering/search (future enhancement)
- Export functionality
- User authentication

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Database schema updated with `table_notes` table
- [ ] All API endpoints refactored and tested
- [ ] UI matches new layout design
- [ ] Table navigation functional (dropdown + buttons + keyboard)
- [ ] Disposition button groups working with auto-save
- [ ] Table-level notes with auto-save
- [ ] Sample row viewer integrated at bottom
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Tested with tidyanalytics-prospecting database
- [ ] V1 story marked as superseded

---

## Migration Notes

**From V1 to V2:**
- Existing `schema_inventory` data preserved
- Existing disposition assignments preserved
- Column notes dropped (if any exist, user manually migrates important ones to table notes)
- Database selector state in LocalStorage ignored (app hardcoded)

**Manual Steps:**
1. Create `table_notes` table in tidyanalytics-prospecting database
2. Optional: Drop `notes` column from `schema_inventory` (or leave for historical data)

---

## Testing Checklist

### Functional Testing:
- [ ] Generate schema inventory → Verify columns inserted
- [ ] Select table via dropdown → All columns load
- [ ] Click disposition button → Visual active state + auto-save
- [ ] Toggle master eligible → Immediate save
- [ ] Edit table notes → Auto-save after 500ms
- [ ] Click "Next Table" → Loads next table's columns
- [ ] Click "Previous Table" → Loads previous table
- [ ] Press Ctrl+Shift+→ → Next table
- [ ] Press Ctrl+Shift+← → Previous table
- [ ] Click "Show Sample Row" → Sample appears at bottom
- [ ] Click "Refresh Sample" → New row loads
- [ ] Press Ctrl+Shift+R → Sample refreshes

### Edge Cases:
- [ ] First table → Previous button disabled
- [ ] Last table → Next button disabled
- [ ] Table with 0 columns → Handle gracefully
- [ ] Empty table (no rows) → Sample shows "No data"
- [ ] >4 disposition options → Abbreviated labels displayed

---

## Implementation Tasks

### Backend
- [ ] Create migration script for `table_notes` table
- [ ] Update all API routes (remove database param)
- [ ] Create table notes GET/PATCH endpoints
- [ ] Update `GET /api/schema-triage/table` to return all columns for table
- [ ] Test all endpoints with Postman/curl

### Frontend
- [ ] Remove database selector component
- [ ] Create `table-navigator.tsx` component
- [ ] Create `table-review-grid.tsx` component
- [ ] Create `disposition-button-group.tsx` component
- [ ] Create `table-notes-editor.tsx` component
- [ ] Update `sample-row-viewer.tsx` for bottom placement
- [ ] Update main page layout
- [ ] Implement keyboard shortcuts
- [ ] Add auto-save with optimistic updates

### Testing & Cleanup
- [ ] Manual testing of all workflows
- [ ] Remove unused V1 components
- [ ] Update V1 story with "Superseded by V2" note
- [ ] Verify 0 TypeScript errors

---

## Estimated Complexity

**Medium-High** - Major UI refactor but reusing existing patterns (auto-save, TanStack Query)

**Estimated Implementation Time:** 3-4 hours

---

## References

- V1 Story: `/home/joel/03_admin-app/docs/stories/schema-triage-interface.md`
- Working App: `/home/joel/03_admin-app/`
- Database Schema: `/home/joel/03_admin-app/lib/db/schema.ts`
- Session Transcript: `/home/joel/core/docs/transcripts/2025-11-22-admin-console-schema-triage.md`

---

## Change Log

- 2025-11-22: Story created by Sally (UX Designer) based on V1 usage feedback
- 2025-11-22: Implementation started

---
