# Phase 3: Multi-Session Jury Testing Instructions

## Overview
This document provides comprehensive testing instructions for Phase 3 (Multi-Session Jury feature). Complete all test cases to ensure the junction table implementation works correctly.

## Prerequisites
- ✅ Migration `0003_vengeful_pretty_boy.sql` has been executed
- ✅ Database has jury_sessions junction table
- ✅ Application is running on development server
- ✅ You have admin access to the dashboard

---

## Test Suite

### Test 1: Create Jury with Zero Sessions
**Objective:** Verify jury can be created without session assignment

**Steps:**
1. Navigate to `/dashboard/jury`
2. Click "Add Jury" button
3. Fill in jury details:
   - Name: "Test Jury 1"
   - Email: "jury1@test.com"
   - Phone: "1234567890"
   - Password: "test123"
4. **Do not select any sessions** (leave all checkboxes unchecked)
5. Click "Add Jury"

**Expected Results:**
- ✅ Jury created successfully
- ✅ Toast notification shows "Jury added successfully"
- ✅ Jury appears in table with "No Sessions" badge
- ✅ No errors in console

---

### Test 2: Create Jury with Single Session (Backward Compatibility)
**Objective:** Verify single-session assignment still works (backward compatible)

**Steps:**
1. Navigate to `/dashboard/jury`
2. Click "Add Jury" button
3. Fill in jury details:
   - Name: "Test Jury 2"
   - Email: "jury2@test.com"
   - Phone: "1234567891"
   - Password: "test123"
4. **Select only ONE session** checkbox
5. Click "Add Jury"

**Expected Results:**
- ✅ Jury created successfully
- ✅ Jury appears in table with single session badge showing selected session name
- ✅ Session stats page shows +1 jury count for that session
- ✅ No errors in console

---

### Test 3: Create Jury with Multiple Sessions (New Feature)
**Objective:** Verify multi-session assignment works correctly

**Steps:**
1. Ensure you have at least 3 sessions created (create them if needed)
2. Navigate to `/dashboard/jury`
3. Click "Add Jury" button
4. Fill in jury details:
   - Name: "Test Jury 3"
   - Email: "jury3@test.com"
   - Phone: "1234567892"
   - Password: "test123"
5. **Select 3 different sessions** (check 3 checkboxes)
6. Click "Add Jury"

**Expected Results:**
- ✅ Jury created successfully
- ✅ Jury appears in table with 3 session badges
- ✅ All 3 session names are displayed correctly
- ✅ Each session's stats page shows +1 jury count
- ✅ No duplicate entries in jury_sessions table

**Database Verification:**
```sql
-- Should return 3 rows for this jury
SELECT * FROM jury_sessions WHERE jury_id = [new_jury_id];
```

---

### Test 4: Edit Jury Sessions - Add Sessions
**Objective:** Verify adding sessions to existing jury works

**Steps:**
1. Navigate to `/dashboard/jury`
2. Find "Test Jury 1" (created with zero sessions)
3. Click the **Edit icon** (pencil) in the Actions column
4. In the dialog, select 2 sessions
5. Click "Save Changes"

**Expected Results:**
- ✅ Dialog closes after save
- ✅ Toast notification shows "Sessions updated successfully"
- ✅ Table refreshes automatically (revalidation)
- ✅ Jury now shows 2 session badges
- ✅ Session stats updated correctly

**Database Verification:**
```sql
-- Should return 2 rows
SELECT * FROM jury_sessions WHERE jury_id = [jury1_id];
```

---

### Test 5: Edit Jury Sessions - Remove Sessions
**Objective:** Verify removing sessions from existing jury works

**Steps:**
1. Navigate to `/dashboard/jury`
2. Find "Test Jury 3" (has 3 sessions)
3. Click the **Edit icon** in the Actions column
4. **Uncheck 2 sessions** (leave only 1 checked)
5. Click "Save Changes"

**Expected Results:**
- ✅ Dialog closes after save
- ✅ Jury now shows only 1 session badge
- ✅ Removed sessions' stats show -2 jury count
- ✅ Junction table entries deleted for removed sessions

**Database Verification:**
```sql
-- Should return only 1 row
SELECT * FROM jury_sessions WHERE jury_id = [jury3_id];
```

---

### Test 6: Edit Jury Sessions - Replace All Sessions
**Objective:** Verify completely changing session assignments works

**Steps:**
1. Navigate to `/dashboard/jury`
2. Find "Test Jury 2" (has 1 session)
3. Click the **Edit icon**
4. **Uncheck the current session**
5. **Check 2 different sessions**
6. Click "Save Changes"

**Expected Results:**
- ✅ Old session removed from jury
- ✅ 2 new sessions assigned
- ✅ Table displays new sessions correctly
- ✅ Session stats updated for all 3 sessions (1 removed, 2 added)

**Database Verification:**
```sql
-- Should return 2 rows with NEW session IDs
SELECT * FROM jury_sessions WHERE jury_id = [jury2_id];
```

---

### Test 7: Session Statistics Accuracy
**Objective:** Verify session stats show correct jury counts

**Steps:**
1. Navigate to `/dashboard/session`
2. For each session card, note the jury count
3. Navigate to `/dashboard/jury`
4. Manually count how many jury members show each session badge

**Expected Results:**
- ✅ Session card jury count matches actual assignments
- ✅ Counts update immediately after editing jury sessions
- ✅ All sessions show accurate totals

**Database Verification:**
```sql
-- Run for each session
SELECT COUNT(*) as jury_count 
FROM jury_sessions 
WHERE session_id = [session_id];
```

---

### Test 8: Team Assignment with Multi-Session Jury
**Objective:** Verify teams can be assigned to jury in multiple sessions

**Steps:**
1. Create a session "Test Session A" with teams
2. Create a session "Test Session B" with teams  
3. Create a jury "Multi Jury" assigned to both sessions
4. In Session A, assign 3 teams to "Multi Jury"
5. In Session B, assign 3 different teams to "Multi Jury"

**Expected Results:**
- ✅ Jury can receive team assignments in both sessions
- ✅ Teams in Session A are independent from Session B
- ✅ Marks page filters teams correctly per session
- ✅ No cross-contamination of teams between sessions

---

### Test 9: Marks Isolation Between Sessions
**Objective:** Verify marks are session-specific for multi-session jury

**Steps:**
1. Use "Multi Jury" from Test 8 (assigned to Sessions A & B)
2. Login as "Multi Jury"
3. Navigate to marks page
4. Select Session A - enter marks for a team
5. Select Session B - verify you see different teams
6. Enter marks for a team in Session B
7. Switch back to Session A

**Expected Results:**
- ✅ Each session shows only its assigned teams
- ✅ Marks entered in Session A don't appear in Session B
- ✅ Session selector works correctly
- ✅ Marks are saved with correct session_id
- ✅ No marking conflicts between sessions

**Database Verification:**
```sql
-- Should show marks for both sessions with same jury
SELECT * FROM marks 
WHERE jury_id = [multi_jury_id]
ORDER BY session_id;
```

---

### Test 10: Delete Jury - Cascade Check
**Objective:** Verify deleting jury removes all junction table entries

**Steps:**
1. Navigate to `/dashboard/jury`
2. Find "Test Jury 1" (has 2 sessions from Test 4)
3. Note the jury ID
4. Click the **Delete icon** (trash) in Actions column
5. Confirm deletion in alert dialog

**Expected Results:**
- ✅ Jury deleted from jury table
- ✅ All junction table entries deleted (CASCADE)
- ✅ Credentials deleted (CASCADE)
- ✅ Session stats updated (jury count decreased)
- ✅ No orphaned records in database

**Database Verification:**
```sql
-- Should return 0 rows
SELECT * FROM jury_sessions WHERE jury_id = [deleted_jury_id];

-- Should return 0 rows
SELECT * FROM creds WHERE jury_id = [deleted_jury_id];
```

---

### Test 11: Delete Session - Cascade Check
**Objective:** Verify deleting session removes all junction table entries

**Steps:**
1. Create a new session "Delete Test Session"
2. Assign 3 jury members to this session
3. Note the session ID
4. Navigate to `/dashboard/session`
5. Delete "Delete Test Session"
6. Confirm deletion

**Expected Results:**
- ✅ Session deleted successfully
- ✅ All junction table entries deleted (CASCADE)
- ✅ Jury members still exist (not deleted)
- ✅ Jury table shows updated session badges (removed deleted session)
- ✅ No orphaned records

**Database Verification:**
```sql
-- Should return 0 rows
SELECT * FROM jury_sessions WHERE session_id = [deleted_session_id];

-- Jury should still exist
SELECT * FROM jury WHERE id IN ([jury_ids_from_deleted_session]);
```

---

### Test 12: Edit Dialog - Cancel Behavior
**Objective:** Verify canceling edit doesn't save changes

**Steps:**
1. Navigate to `/dashboard/jury`
2. Find any jury with sessions
3. Click the **Edit icon**
4. Change session selections (check/uncheck several)
5. Click "Cancel" button

**Expected Results:**
- ✅ Dialog closes
- ✅ No changes saved to database
- ✅ Jury table shows original sessions
- ✅ No API calls made on cancel

---

### Test 13: Validation - Prevent Duplicate Assignments
**Objective:** Verify system prevents duplicate jury-session assignments

**Steps:**
1. Create jury "Duplicate Test" with Session A
2. Click Edit, keep Session A selected, click Save
3. Check database

**Expected Results:**
- ✅ No duplicate entries created in jury_sessions
- ✅ Only one row exists for this jury-session combination
- ✅ No errors in console

**Database Verification:**
```sql
-- Should return exactly 1 row
SELECT COUNT(*) as count 
FROM jury_sessions 
WHERE jury_id = [jury_id] AND session_id = [session_a_id];
```

---

### Test 14: Large Session List - UI Scroll
**Objective:** Verify UI handles many sessions gracefully

**Steps:**
1. Create 10+ sessions if you don't have them
2. Click "Add Jury" or edit existing jury
3. Observe the session list in the dialog

**Expected Results:**
- ✅ Scrollable area with max-height works
- ✅ All sessions are accessible via scroll
- ✅ Checkboxes remain clickable
- ✅ No UI overflow or layout issues
- ✅ Border and padding look correct

---

### Test 15: Empty Sessions List
**Objective:** Verify graceful handling when no sessions exist

**Steps:**
1. Delete all sessions from database (or use fresh DB)
2. Navigate to `/dashboard/jury`
3. Click "Add Jury"

**Expected Results:**
- ✅ Dialog opens without errors
- ✅ Shows "No sessions available" message
- ✅ Can still create jury (with zero sessions)
- ✅ No JavaScript errors

---

## Regression Testing

### Test 16: Existing Session Creation Still Works
**Objective:** Verify session creation flow wasn't broken

**Steps:**
1. Navigate to `/dashboard/session`
2. Create new session with all steps:
   - Session details
   - Team selection
   - Jury assignment
3. Complete session creation

**Expected Results:**
- ✅ Multi-step form works correctly
- ✅ Jury assignment step uses junction table
- ✅ Session created with assigned jury
- ✅ Junction table populated correctly

---

### Test 17: Team Reassignment Still Works
**Objective:** Verify reassignment page uses junction table correctly

**Steps:**
1. Navigate to existing session's reassignment page
2. Reassign teams to different jury members
3. Save changes

**Expected Results:**
- ✅ Reassignment works correctly
- ✅ Only jury assigned to THIS session appear in dropdown
- ✅ Teams update successfully
- ✅ No errors related to session filtering

---

## Performance Testing

### Test 18: Load Time with Many Junction Records
**Objective:** Verify performance with large dataset

**Steps:**
1. Create scenario: 50 jury members, 10 sessions, each jury in 3-5 sessions
2. Navigate to `/dashboard/jury`
3. Measure page load time

**Expected Results:**
- ✅ Page loads in < 2 seconds
- ✅ Table renders smoothly
- ✅ Session badges display correctly
- ✅ No N+1 query issues (check server logs)

---

## Error Handling

### Test 19: Network Error During Edit
**Objective:** Verify error handling for failed API calls

**Steps:**
1. Open browser DevTools > Network tab
2. Edit jury sessions
3. Before clicking Save, set network to "Offline" in DevTools
4. Click "Save Changes"

**Expected Results:**
- ✅ Error toast appears: "Failed to update sessions"
- ✅ Dialog remains open (doesn't close on error)
- ✅ User can retry after reconnecting

---

### Test 20: Concurrent Edits
**Objective:** Test race conditions with simultaneous edits

**Steps:**
1. Open same jury in 2 browser tabs
2. Tab 1: Edit sessions, click Save
3. Tab 2: Edit same jury differently, click Save immediately
4. Check final state

**Expected Results:**
- ✅ Both requests succeed
- ✅ Last save wins (database shows Tab 2's changes)
- ✅ No database locks or deadlocks
- ✅ Data remains consistent

---

## Sign-Off Checklist

After completing all tests, verify:

- [ ] All 20 test cases passed
- [ ] No console errors in any test
- [ ] Database integrity maintained (no orphaned records)
- [ ] Session statistics are accurate
- [ ] Marks remain isolated per session
- [ ] Cascade deletes work correctly
- [ ] UI is responsive and user-friendly
- [ ] Backward compatibility confirmed (single session still works)
- [ ] Performance is acceptable
- [ ] Error handling works as expected

---

## Database Health Check

Run these queries after testing to verify data integrity:

```sql
-- Check for orphaned junction entries (should be empty)
SELECT js.* 
FROM jury_sessions js
LEFT JOIN jury j ON js.jury_id = j.id
LEFT JOIN sessions s ON js.session_id = s.id
WHERE j.id IS NULL OR s.id IS NULL;

-- Verify no duplicate assignments (should be empty)
SELECT jury_id, session_id, COUNT(*) as count
FROM jury_sessions
GROUP BY jury_id, session_id
HAVING count > 1;

-- Check foreign key integrity (should match)
SELECT 
  (SELECT COUNT(*) FROM jury_sessions) as total_assignments,
  (SELECT COUNT(*) FROM jury) as total_jury,
  (SELECT COUNT(*) FROM sessions) as total_sessions;
```

---

## Troubleshooting

### Issue: "No sessions available" but sessions exist
**Solution:** Check that `getSessionsForDropdown()` is working correctly

### Issue: Duplicate junction entries created
**Solution:** Verify `assignJuryToSession()` has duplicate check in SQL

### Issue: Session stats not updating
**Solution:** Check that revalidatePath is called in actions

### Issue: Edit dialog shows wrong sessions
**Solution:** Ensure `getJuryWithSessions()` includes proper JOIN

---

## Next Steps

After all tests pass:
- ✅ Mark Phase 3.5 as complete
- ✅ Deploy to staging environment
- ✅ Conduct user acceptance testing
- ✅ Proceed to Phase 4: Dynamic Criteria System

---

**Testing Completed By:** _______________  
**Date:** _______________  
**Pass/Fail:** _______________  
**Notes:** _______________________________________________
