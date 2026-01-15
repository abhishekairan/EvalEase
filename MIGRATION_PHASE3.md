# Phase 3: Multiple Sessions for Jury - Migration Guide

## Overview
This migration enables jury members to participate in multiple sessions simultaneously by implementing a many-to-many relationship between jury and sessions using a junction table.

## Schema Changes

### Before (One-to-Many):
- `jury` table had a `session` column (foreign key to sessions)
- One jury member could only be assigned to one session

### After (Many-to-Many):
- `jury` table no longer has `session` column
- New `jury_sessions` junction table with:
  - `id` (primary key)
  - `jury_id` (foreign key to jury)
  - `session_id` (foreign key to sessions)
  - `created_at`, `updated_at` timestamps

## Migration Steps

### IMPORTANT: Data Preservation
The migration script automatically migrates existing jury-session relationships to the new junction table before dropping the old column.

### Option 1: Run Migration SQL Manually

1. Connect to your MySQL database
2. Run the SQL from: `drizzle/0003_vengeful_pretty_boy.sql`

```bash
mysql -u your_username -p your_database < drizzle/0003_vengeful_pretty_boy.sql
```

### Option 2: Use Database Client

1. Open your database client (MySQL Workbench, phpMyAdmin, etc.)
2. Copy the SQL from `drizzle/0003_vengeful_pretty_boy.sql`
3. Execute it in your database

### Option 3: Use Migration Script (if DB credentials are configured)

```bash
npx tsx scripts/runMigration.ts
```

## Code Changes Summary

### Updated Functions:
- `getJury()` - Removed `session` parameter
- `getJuryBySession()` - Now uses junction table with JOIN
- `getJuryIdsBySession()` - Queries junction table
- `assignJuryToSession()` - Inserts into junction table
- `removeJuryFromSession()` - Deletes from junction table
- `updateJurySession()` - Inserts into junction table
- `deleteJurysSession()` - Deletes from junction table
- `deleteSession()` - Cleans up junction table records
- `getSessionStats()` - Queries junction table for jury count
- `getTeamsBySession()` - Uses junction table to get session jury

### API Compatibility:
All existing function signatures remain the same - only internal implementation changed. No component updates required for Phase 3.1-3.2.

## Testing Checklist

After migration:
- [ ] Existing jury-session relationships preserved
- [ ] Can assign same jury to multiple sessions
- [ ] Session listing shows correct jury counts
- [ ] Team reassignment works correctly
- [ ] Marks remain properly linked to correct session
- [ ] Deleting session removes junction table entries
- [ ] Deleting jury removes all their session assignments

## Rollback Plan

If you need to rollback:

1. Backup the `jury_sessions` table data
2. Add `session` column back to `jury` table
3. Migrate first session from `jury_sessions` back to `jury.session`
4. Drop `jury_sessions` table

```sql
-- Rollback SQL (BACKUP FIRST!)
ALTER TABLE jury ADD COLUMN session INT REFERENCES sessions(id) ON DELETE SET NULL;

UPDATE jury j
SET session = (
  SELECT session_id 
  FROM jury_sessions 
  WHERE jury_id = j.id 
  LIMIT 1
);

DROP TABLE jury_sessions;
```

## Next Steps

After successful migration:
- Phase 3.3: Update UI to allow multi-session assignment
- Phase 3.4: Test multi-session scenarios
- Phase 3.5: Update session management UI to show jury across multiple sessions
