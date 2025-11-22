# Quick Start Guide

## Your App is Running! 🎉

The Tidy Analytics Admin Console is now live at:

**http://localhost:3000**

## What You Can Do Right Now

### 1. Test the Disposition Configurator

Visit: **http://localhost:3000/admin/disposition-config**

**Pre-loaded disposition values:**
- Under Review
- Keep - Primary Source
- Keep - Reference
- Deprecated
- Ignore

**Try these actions:**
1. ✏️ **Edit a disposition** - Click "Edit" next to any value, change the label, click "Save"
2. ➕ **Add a new disposition** - Type a label like "Review Later" in the input, click "Add New Value"
3. 🗑️ **Delete a disposition** - Click "Delete" (soft delete - sets `is_active=false`)

**Features working:**
- ✅ Auto-save with optimistic updates
- ✅ Real-time database writes to both `names` and `tidyanalytics-prospecting`
- ✅ TanStack Query caching (changes persist across page refreshes)
- ✅ Form validation with Zod

### 2. View the Home Dashboard

Visit: **http://localhost:3000**

See the welcome screen with navigation cards to both features.

## What's Been Built (Phase 1A Complete)

✅ Full Next.js 16 application structure
✅ Database schemas installed in both PostgreSQL databases
✅ Multi-database connection factory (can switch between `names` and `tidyanalytics-prospecting`)
✅ Disposition Configuration interface (fully functional)
✅ TypeScript + Tailwind CSS styling
✅ TanStack Query for data fetching
✅ Drizzle ORM for type-safe database access

## What's Coming Next (Phase 1B)

🔨 **Schema Triage Interface** - This will be built using BMM workflows with:
- Database selector dropdown
- Generate schema inventory button
- Table filter
- Column-by-column review with keyboard navigation
- Auto-save for notes and flags
- Sample row viewer
- Progress tracking

## Verifying Database Changes

Want to see the data being written to your databases?

```bash
# Check disposition values in 'names' database
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: 'names',
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT * FROM disposition_values ORDER BY sort_order')
  .then(res => { console.table(res.rows); pool.end(); })
  .catch(console.error);
"
```

## Stopping the Server

The development server is running in the background (Shell ID: fcdca5).

To stop it:
```bash
# Find the process
ps aux | grep "next dev"

# Kill it
pkill -f "next dev"
```

Or Sally can stop it for you when you're done testing!

## Making Changes

The app is in **hot-reload mode**:
- Edit any `.tsx` file
- Save your changes
- Browser auto-refreshes with your updates

No need to restart the server!

## Testing Database Connectivity

The app is already connected and working with your Digital Ocean databases:
- Host: `tidy-analytics-internal-do-user-242012-0.b.db.ondigitalocean.com`
- Port: `25060`
- Databases: `names`, `tidyanalytics-prospecting`

You can verify this by adding/editing dispositions - they're being written to the real databases!

## Next Steps

1. **Test the Disposition Configurator** - Play with adding, editing, and deleting values
2. **Give feedback on the UX** - Does it feel right? Any improvements?
3. **Decide on Phase 1B** - When ready, we'll use BMM workflows to build the Schema Triage interface

## Questions or Issues?

Ask Sally! I'm here to help. If you encounter any errors or want to tweak the design, just let me know!

---

**Enjoy testing your new admin console!** 🎨
