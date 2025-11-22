# Tidy Analytics Admin Console

Internal data operations and integration management platform for database schema triage and company master consolidation.

## Phase 1: Database Schema Triage

This application helps systematically review and categorize database columns across multiple PostgreSQL databases to prepare for building a unified company master table.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Access to Digital Ocean PostgreSQL databases:
  - `names`
  - `tidyanalytics-prospecting`

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd /home/joel/03_admin-app
   ```

2. **Install dependencies** (already done if you followed setup):
   ```bash
   npm install
   ```

3. **Database schema installation** (already completed):
   ```bash
   node scripts/install-schemas.js
   ```
   This creates the `disposition_values` and `schema_inventory` tables in both databases.

### Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   ```
   http://localhost:3000
   ```

3. **Navigate through the app:**
   - **Home** (http://localhost:3000) - Overview and navigation
   - **Disposition Configuration** (http://localhost:3000/admin/disposition-config) - Manage triage categories
   - **Schema Triage** (http://localhost:3000/admin/schema-triage) - Review database columns (coming in Phase 1B)

## Features Implemented (Phase 1A)

✅ **Project Structure**
- Next.js 16 with App Router
- TypeScript + Tailwind CSS
- Drizzle ORM for type-safe database access
- TanStack Query for data fetching and caching

✅ **Database Setup**
- Multi-database connection factory
- Schema installed in both `names` and `tidyanalytics-prospecting` databases
- 5 default disposition values seeded

✅ **Disposition Configuration Screen**
- View all disposition values
- Add new disposition categories
- Edit existing labels
- Soft delete (deactivate) dispositions
- Auto-save with optimistic updates

## What's Next (Phase 1B)

The following features will be built using BMM workflows for quality gates:

🔨 **Schema Triage Interface**
- Database selector (with LocalStorage preference)
- Generate schema inventory from `information_schema`
- Table filter dropdown
- Column-by-column review interface
- Keyboard navigation (Ctrl+Arrow keys)
- Auto-save for disposition, master_eligible, and notes
- Progress tracking per table
- Random sample row viewer

## Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Digital Ocean Managed)
- **ORM:** Drizzle ORM
- **State Management:** TanStack Query
- **Forms:** React Hook Form + Zod

## Environment Variables

Located in `.env.local` (not committed to git):

```env
DATABASE_HOST=your-database-host.ondigitalocean.com
DATABASE_PORT=25060
DATABASE_USER=doadmin
DATABASE_PASSWORD=your-database-password-here
DATABASE_SSL_MODE=require
DATABASE_NAMES=names
DATABASE_PROSPECTING=tidyanalytics-prospecting
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-change-in-production
```

## Project Structure

```
/home/joel/03_admin-app/
├── app/
│   ├── admin/
│   │   └── disposition-config/
│   │       └── page.tsx           # Disposition manager UI
│   ├── api/
│   │   └── disposition-values/
│   │       ├── route.ts           # GET/POST dispositions
│   │       └── [id]/route.ts      # PATCH/DELETE by ID
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Home page
├── components/
│   └── providers.tsx              # React Query provider
├── lib/
│   └── db/
│       ├── connection.ts          # Database connection factory
│       └── schema.ts              # Drizzle ORM schema
├── scripts/
│   └── install-schemas.js         # Database setup script
├── create-schema-inventory.sql    # SQL installation script
├── .env.local                     # Environment variables (not in git)
└── package.json
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Database Schema

### disposition_values
Lookup table for triage categories:
- `id` - Primary key
- `label` - Display name (e.g., "Keep - Primary Source")
- `sort_order` - Display order
- `is_active` - Soft delete flag
- `created_at`, `updated_at` - Timestamps

### schema_inventory
Metadata for database columns:
- `id` - Primary key
- `table_name`, `column_name` - Column identifier
- `column_type` - Data type
- `notes` - Triage notes
- `disposition_id` - FK to disposition_values
- `master_eligible` - Flag for company master inclusion
- `created_at`, `updated_at` - Timestamps

## Development Approach

**Phase 1A (Complete):** Quick prototype with Disposition Configurator
**Phase 1B (Next):** Formal BMM workflows for Schema Triage interface

This hybrid approach validates the architecture quickly while maintaining quality gates for complex features.

## Support

For questions or issues, contact Joel or refer to the design specification:
`/home/joel/core/docs/admin-app-design-spec.md`
