# Phase 3 Testing Guide - Multi-Session Jury Feature

**Date**: January 15, 2026  
**Status**: ✅ Implementation Complete - Ready for Testing

---

## 🎯 PHASE 3 COMPLETE

All implementation tasks for Phase 3 (Multiple Sessions for Jury Members) have been completed:

### ✅ Completed Changes:

1. **Database Schema** - Created `jury_sessions` junction table for many-to-many relationships
2. **Migration Executed** - Junction table created successfully in database
3. **Utility Functions** - Refactored 10+ functions to use junction table
4. **UI Components** - Updated AddJuryDialog, jury table, and session management
5. **Edit Sessions Dialog** - Created EditJurySessionsDialog for managing assignments
6. **Jury Home Page** - Complete redesign with tabs (Ongoing/Upcoming/Past)
7. **Session Detail Page** - New page showing teams per session with search
8. **Lock Feature Integration** - Phase 1 lock functionality restored in new UI

---

## 📋 TESTING CHECKLIST

### Test 1: Create Jury with No Sessions
**Purpose**: Verify backward compatibility - jury can exist without sessions

**Steps**:
1. Login as admin
2. Navigate to Jury management
3. Click "Add Jury"
4. Fill in jury details (name, email, phone)
5. **Do NOT select any sessions**
6. Submit form

**Expected Results**:
- ✅ Jury created successfully
- ✅ No entries in `jury_sessions` table for this jury
- ✅ Jury appears in jury list
- ✅ Session column shows "—" or empty
- ✅ No errors in console

**Database Verification**:
```sql
SELECT * FROM jury WHERE email = 'test@example.com';
SELECT * FROM jury_sessions WHERE juryId = [new_jury_id];
-- Should return 0 rows
```

---

### Test 2: Create Jury with Single Session
**Purpose**: Test single session assignment (most common use case)

**Steps**:
1. Login as admin
2. Create a new session "Test Session A" if needed
3. Click "Add Jury"
4. Fill in jury details
5. Select **only one session** (Test Session A)
6. Submit form

**Expected Results**:
- ✅ Jury created successfully
- ✅ One entry in `jury_sessions` table
- ✅ Session badge shows in jury table
- ✅ Jury can login and see only Test Session A
- ✅ Statistics show correct team count

**Database Verification**:
```sql
SELECT js.*, s.name 
FROM jury_sessions js 
JOIN sessions s ON js.sessionId = s.id 
WHERE js.juryId = [new_jury_id];
-- Should return 1 row with Test Session A
```

---

### Test 3: Create Jury with Multiple Sessions
**Purpose**: Test core multi-session functionality

**Steps**:
1. Login as admin
2. Create three sessions: "Session Alpha", "Session Beta", "Session Gamma"
3. Click "Add Jury"
4. Fill in jury details (e.g., "Multi-Session Jury")
5. Select **all three sessions**
6. Submit form

**Expected Results**:
- ✅ Jury created successfully
- ✅ Three entries in `jury_sessions` table
- ✅ All three session badges show in jury table
- ✅ Jury can login and see all three sessions
- ✅ Each session shows correct team count
- ✅ Sessions properly categorized (Upcoming/Started/Past)

**Database Verification**:
```sql
SELECT js.*, s.name 
FROM jury_sessions js 
JOIN sessions s ON js.sessionId = s.id 
WHERE js.juryId = [new_jury_id];
-- Should return 3 rows
```

---

### Test 4: Edit Jury Sessions (Add Sessions)
**Purpose**: Test adding sessions to existing jury

**Steps**:
1. Login as admin
2. Find jury created in Test 2 (single session)
3. Click "Edit" button (pencil icon) in Sessions column
4. Add two more sessions to the selection
5. Click "Update Sessions"

**Expected Results**:
- ✅ Success toast appears
- ✅ Table updates to show all three session badges
- ✅ New entries added to `jury_sessions` table
- ✅ Old session still assigned
- ✅ Jury can see all sessions on next login

**Database Verification**:
```sql
SELECT COUNT(*) FROM jury_sessions WHERE juryId = [jury_id];
-- Should show 3
```

---

### Test 5: Edit Jury Sessions (Remove Sessions)
**Purpose**: Test removing sessions from jury

**Steps**:
1. Login as admin
2. Find jury with multiple sessions (Test 3)
3. Click "Edit" button
4. Uncheck one session
5. Click "Update Sessions"

**Expected Results**:
- ✅ Success toast appears
- ✅ Session badge removed from table
- ✅ Entry deleted from `jury_sessions` table
- ✅ Jury no longer sees removed session
- ✅ Other sessions remain accessible

**Database Verification**:
```sql
SELECT js.*, s.name 
FROM jury_sessions js 
JOIN sessions s ON js.sessionId = s.id 
WHERE js.juryId = [jury_id];
-- Should show 2 remaining sessions
```

---

### Test 6: Edit Jury Sessions (Replace All)
**Purpose**: Test complete session replacement

**Steps**:
1. Login as admin
2. Find jury with existing sessions
3. Click "Edit" button
4. Uncheck all current sessions
5. Check entirely different sessions
6. Click "Update Sessions"

**Expected Results**:
- ✅ Success toast appears
- ✅ Old sessions removed from table display
- ✅ New session badges appear
- ✅ Old entries deleted from `jury_sessions`
- ✅ New entries created in `jury_sessions`
- ✅ Jury sees only new sessions

---

### Test 7: Session Statistics Accuracy
**Purpose**: Verify team counts per session are correct

**Setup**:
1. Create Session X with 5 teams
2. Create Jury A, assign 3 teams in Session X
3. Create Jury B, assign 2 teams in Session X
4. Assign Jury A to Session X

**Steps**:
1. Login as Jury A
2. View Session X card on home page
3. Note the team count shown

**Expected Results**:
- ✅ Team count shows **3** (only Jury A's teams)
- ✅ Not 5 (total teams) or 2 (Jury B's teams)
- ✅ Count updates when teams reassigned
- ✅ Same count shown in session detail page

**Database Verification**:
```sql
SELECT COUNT(*) FROM teams WHERE juryId = [jury_a_id];
-- Should match displayed count
```

---

### Test 8: Team Assignment Isolation
**Purpose**: Ensure teams assigned to different jury members don't overlap

**Setup**:
1. Create Session "Isolation Test"
2. Create 6 teams
3. Create Jury Member 1, assign teams 1-3
4. Create Jury Member 2, assign teams 4-6
5. Assign both jury members to "Isolation Test"

**Steps**:
1. Login as Jury Member 1
2. Open "Isolation Test" session
3. Note visible teams
4. Logout and login as Jury Member 2
5. Open "Isolation Test" session
6. Note visible teams

**Expected Results**:
- ✅ Jury 1 sees only teams 1-3
- ✅ Jury 2 sees only teams 4-6
- ✅ No team appears for both jury members
- ✅ Each jury can mark their teams independently

---

### Test 9: Marks Isolation Per Session
**Purpose**: Verify marks are session-specific

**Setup**:
1. Create two sessions: "Session 1", "Session 2"
2. Create Team "Isolation Team"
3. Create Jury "Mark Tester"
4. Assign same team to jury in BOTH sessions
5. Assign jury to both sessions

**Steps**:
1. Login as "Mark Tester"
2. Open "Session 1"
3. Mark "Isolation Team" with scores 8, 7, 12, 13
4. Go back to home
5. Open "Session 2"
6. Click on same "Isolation Team"

**Expected Results**:
- ✅ Session 1: Team shows "Marked" status
- ✅ Session 2: Team shows "Pending" status (no marks yet)
- ✅ Session 2 marks dialog is empty (not pre-filled)
- ✅ Can enter different marks in Session 2
- ✅ Both marks saved independently

**Database Verification**:
```sql
SELECT * FROM marks 
WHERE teamId = [team_id] AND juryId = [jury_id];
-- Should return 2 rows with different session values
```

---

### Test 10: Jury Deletion Cascade
**Purpose**: Test cascade deletion of junction table entries

**Steps**:
1. Login as admin
2. Create jury with multiple sessions
3. Verify entries exist in `jury_sessions`
4. Delete the jury
5. Check `jury_sessions` table

**Expected Results**:
- ✅ Jury deleted successfully
- ✅ All entries removed from `jury_sessions`
- ✅ Sessions still exist (not deleted)
- ✅ Other jury assignments unaffected
- ✅ No orphaned records

**Database Verification**:
```sql
SELECT * FROM jury_sessions WHERE juryId = [deleted_jury_id];
-- Should return 0 rows
```

---

### Test 11: Session Deletion Cascade
**Purpose**: Test cascade deletion removes jury assignments

**Steps**:
1. Login as admin
2. Assign multiple jury members to a session
3. Note number of entries in `jury_sessions` for that session
4. Delete the session
5. Check `jury_sessions` table

**Expected Results**:
- ✅ Session deleted successfully
- ✅ All related entries removed from `jury_sessions`
- ✅ Jury members still exist (not deleted)
- ✅ Jury members' other session assignments unaffected
- ✅ Marks for that session also deleted (existing behavior)

**Database Verification**:
```sql
SELECT * FROM jury_sessions WHERE sessionId = [deleted_session_id];
-- Should return 0 rows
```

---

### Test 12: Jury Home Page - Session Tabs
**Purpose**: Test session categorization in tabs

**Setup**:
1. Create Session "Upcoming" (startedAt in future)
2. Create Session "Ongoing" (startedAt in past, endedAt null)
3. Create Session "Past" (both startedAt and endedAt in past)
4. Assign all three to one jury member

**Steps**:
1. Login as jury member
2. View home page tabs

**Expected Results**:
- ✅ "Ongoing" tab shows only started session
- ✅ "Upcoming" tab shows only future session
- ✅ "Past" tab shows only ended session
- ✅ Correct icons for each status (Play/Clock/CheckCircle)
- ✅ Correct colors (green/blue/gray)

---

### Test 13: Session Access Control
**Purpose**: Verify jury can only access started sessions

**Setup**:
1. Create upcoming session "Future Session"
2. Assign jury to it
3. Note session ID from URL or database

**Steps**:
1. Login as jury
2. See "Future Session" card (should show lock icon)
3. Click on the card
4. Try to directly navigate to `/home/session/[sessionId]`

**Expected Results**:
- ✅ Card shows lock icon for upcoming session
- ✅ Click does nothing (no navigation)
- ✅ Direct URL navigation redirects to `/home`
- ✅ Error message or toast (optional)
- ✅ Same behavior for ended sessions

---

### Test 14: Session Assignment Verification
**Purpose**: Test security - jury cannot access unassigned sessions

**Setup**:
1. Create Session "Assigned"
2. Create Session "Not Assigned"
3. Assign jury only to "Assigned"
4. Note ID of "Not Assigned"

**Steps**:
1. Login as jury
2. Try to navigate to `/home/session/[not_assigned_id]`

**Expected Results**:
- ✅ Redirects to `/home`
- ✅ No team data exposed
- ✅ Cannot bypass with direct URL
- ✅ Console shows no errors or data leaks

---

### Test 15: Lock Feature in Multi-Session Context
**Purpose**: Verify Phase 1 lock feature works per session

**Setup**:
1. Create two sessions
2. Assign same jury and team to both
3. Mark team in Session 1
4. Lock marks in Session 1

**Steps**:
1. Login as jury
2. Open Session 1, verify locked status
3. Open Session 2, mark same team
4. Try to edit marks in both sessions

**Expected Results**:
- ✅ Session 1: Shows locked badge, fields disabled
- ✅ Session 2: Can edit marks freely (not locked)
- ✅ Lock status is session-specific
- ✅ "Locked" count stat accurate per session
- ✅ Lock button only on Session 2 marks

---

### Test 16: Search Functionality
**Purpose**: Test team search in session detail page

**Steps**:
1. Login as jury with multiple teams
2. Open a session
3. Search by team name
4. Search by leader name
5. Search by member name
6. Clear search

**Expected Results**:
- ✅ Results filter immediately (or with debounce)
- ✅ Team name search works
- ✅ Leader name search works
- ✅ Member name search works (partial match)
- ✅ No results message shows when no matches
- ✅ Clear search restores all teams

---

### Test 17: Regression Test - Old Jury Still Works
**Purpose**: Ensure existing jury (created before Phase 3) still work

**Steps**:
1. Identify jury created before Phase 3 (if any)
2. Login as that jury member
3. Try to access their assigned session/teams

**Expected Results**:
- ✅ Can login successfully
- ✅ Migration handled old data correctly
- ✅ Session assignment visible
- ✅ Can view and mark teams
- ✅ No breaking changes

**Note**: If no pre-Phase 3 data exists, create jury with direct SQL:
```sql
INSERT INTO jury (name, email, phoneNumber) 
VALUES ('Legacy Jury', 'legacy@test.com', '1234567890');
-- Then assign via junction table
```

---

### Test 18: Performance Test - Many Sessions
**Purpose**: Test UI performance with many assigned sessions

**Setup**:
1. Create 20 sessions
2. Create jury member
3. Assign all 20 sessions to jury

**Steps**:
1. Login as jury
2. Navigate home page
3. Scroll through session tabs
4. Click on various sessions

**Expected Results**:
- ✅ Page loads within 2-3 seconds
- ✅ No lag when switching tabs
- ✅ Session cards render properly
- ✅ No UI glitches or overflow
- ✅ Team counts accurate for all sessions

---

### Test 19: Error Handling - Invalid Session
**Purpose**: Test graceful error handling

**Steps**:
1. Login as jury
2. Navigate to `/home/session/99999` (non-existent ID)
3. Navigate to `/home/session/abc` (invalid ID)

**Expected Results**:
- ✅ Redirects to `/home` gracefully
- ✅ No crash or error page
- ✅ No console errors exposing data
- ✅ User not stuck on error page

---

### Test 20: Session End Auto-Lock (Multi-Session)
**Purpose**: Verify auto-lock works per session

**Setup**:
1. Create two sessions
2. Assign jury to both
3. Mark teams in both sessions
4. End only one session

**Steps**:
1. As admin, end Session 1
2. Login as jury
3. Try to edit marks in Session 1
4. Try to edit marks in Session 2

**Expected Results**:
- ✅ Session 1 marks are locked
- ✅ Session 2 marks still editable
- ✅ Lock is session-specific
- ✅ Jury still assigned to both sessions

**Database Verification**:
```sql
SELECT * FROM marks WHERE session = [session1_id];
-- All should have locked = true

SELECT * FROM marks WHERE session = [session2_id];
-- Should have locked = false
```

---

## 🔍 DATABASE INTEGRITY CHECKS

Run these queries to verify data integrity:

### Check 1: No Orphaned Junction Records
```sql
-- Should return 0 rows
SELECT js.* FROM jury_sessions js
LEFT JOIN jury j ON js.juryId = j.id
WHERE j.id IS NULL;

SELECT js.* FROM jury_sessions js
LEFT JOIN sessions s ON js.sessionId = s.id
WHERE s.id IS NULL;
```

### Check 2: Unique Assignments
```sql
-- Should return 0 rows (no duplicates)
SELECT juryId, sessionId, COUNT(*) as count
FROM jury_sessions
GROUP BY juryId, sessionId
HAVING count > 1;
```

### Check 3: Marks Reference Valid Sessions
```sql
-- Should return 0 rows
SELECT m.* FROM marks m
LEFT JOIN sessions s ON m.session = s.id
WHERE s.id IS NULL;
```

### Check 4: Junction Table Timestamps
```sql
-- All records should have valid timestamps
SELECT * FROM jury_sessions 
WHERE createdAt IS NULL OR updatedAt IS NULL;
-- Should return 0 rows
```

---

## ✅ ACCEPTANCE CRITERIA

Phase 3 is complete when:

- [x] Junction table created and migrated
- [x] All utility functions refactored
- [x] UI components updated
- [x] Edit sessions dialog working
- [x] Jury home page redesigned
- [x] Session detail page created
- [x] Lock feature integrated
- [ ] All 20 test cases pass
- [ ] Database integrity verified
- [ ] No regression bugs found
- [ ] Performance acceptable
- [ ] User acceptance obtained

---

## 🐛 KNOWN ISSUES TO WATCH

### Issue 1: TypeScript Import Cache
**Symptom**: "Cannot find module '@/components/SessionTeamsView'"  
**Cause**: TypeScript server caching  
**Fix**: Restart VS Code or TypeScript server  
**Status**: Non-blocking, cosmetic only

### Issue 2: Team Members Undefined
**Symptom**: "Cannot read properties of undefined (reading 'length')"  
**Status**: ✅ FIXED - Defensive checks added to MarksDialog

### Issue 3: Session Parameter Type
**Symptom**: SQL error with `[object Object]` parameter  
**Status**: ✅ FIXED - Changed to pass plain number

---

## 📊 TESTING MATRIX

| Test # | Category | Priority | Status | Notes |
|--------|----------|----------|--------|-------|
| 1 | No sessions | High | ⏳ Pending | Backward compatibility |
| 2 | Single session | High | ⏳ Pending | Common use case |
| 3 | Multiple sessions | High | ⏳ Pending | Core feature |
| 4 | Add sessions | High | ⏳ Pending | Edit functionality |
| 5 | Remove sessions | High | ⏳ Pending | Edit functionality |
| 6 | Replace sessions | Medium | ⏳ Pending | Edge case |
| 7 | Session stats | High | ⏳ Pending | Data accuracy |
| 8 | Team isolation | High | ⏳ Pending | Security |
| 9 | Marks isolation | High | ⏳ Pending | Session independence |
| 10 | Jury deletion | High | ⏳ Pending | Cascade behavior |
| 11 | Session deletion | High | ⏳ Pending | Cascade behavior |
| 12 | Session tabs | Medium | ⏳ Pending | UI categorization |
| 13 | Access control | High | ⏳ Pending | Security |
| 14 | Assignment check | High | ⏳ Pending | Security |
| 15 | Lock per session | High | ⏳ Pending | Feature integration |
| 16 | Search | Medium | ⏳ Pending | UX |
| 17 | Regression | Medium | ⏳ Pending | Stability |
| 18 | Performance | Low | ⏳ Pending | Scalability |
| 19 | Error handling | Medium | ⏳ Pending | Robustness |
| 20 | Auto-lock | High | ⏳ Pending | Session-specific |

---

## 🚀 TESTING STRATEGY

### Phase 1: Core Functionality (Tests 1-9)
**Time**: 2-3 hours  
**Focus**: Create, edit, assign, isolate  
**Priority**: Must pass before moving forward

### Phase 2: Edge Cases (Tests 10-15)
**Time**: 1-2 hours  
**Focus**: Deletion, security, locks  
**Priority**: High - security and data integrity

### Phase 3: UX & Performance (Tests 16-20)
**Time**: 1 hour  
**Focus**: Search, errors, performance  
**Priority**: Medium - polish and robustness

---

## 📝 TEST EXECUTION NOTES

### Recording Results:
- Update status column (⏳ → ✅ or ❌)
- Document any issues found
- Take screenshots of UI
- Save database query results

### Issue Tracking:
- Create list of bugs found
- Prioritize: Critical / High / Medium / Low
- Assign fix timeline
- Retest after fixes

### Sign-off:
- [ ] All tests executed
- [ ] Issues documented
- [ ] Critical bugs fixed
- [ ] Retested after fixes
- [ ] Ready for Phase 4

---

**Testing Owner**: _____________  
**Date Started**: _____________  
**Date Completed**: _____________  
**Status**: ⏳ Not Started  

---

## 🎓 TESTING TIPS

1. **Use Multiple Browser Windows**:
   - Admin in one window
   - Different jury members in others
   - Test concurrent actions

2. **Use Database Tool**:
   - Keep database client open
   - Verify after each action
   - Check cascade effects

3. **Document Everything**:
   - Screenshot each test result
   - Note actual vs expected
   - Record any anomalies

4. **Test Incrementally**:
   - Don't skip tests
   - Fix blocking issues immediately
   - Don't accumulate test debt

5. **Think Like a User**:
   - Try unexpected actions
   - Test error scenarios
   - Verify user experience

---

**Ready to Test**: YES ✅  
**Estimated Testing Time**: 4-6 hours for complete coverage  
**Recommended Setup**: Fresh database or dedicated test environment
