# Implementation Roadmap - EvalEase Feature Enhancements

**Document Version**: 1.0  
**Created**: January 15, 2026  
**Status**: Ready for Implementation

---

## OVERVIEW

This roadmap sequences all 7 feature changes by risk level and dependencies. Each phase builds on previous phases and can be deployed independently.

---

## PHASE 1: NON-BREAKING ENHANCEMENTS (Weeks 1-2)

**Goal**: Add foundational features that don't break existing functionality  
**Risk Level**: 🟢 LOW  
**Can Deploy**: ✅ Yes, after each change

### Change 1.1: Add Locked Field to Marks
**Files to Modify**:
- `src/db/schema.ts` - Add locked field
- Generate migration with drizzle-kit

**Steps**:
1. Add `locked: boolean('locked').default(false).notNull()` to marks table
2. Run `drizzle-kit generate` to create migration
3. Run `drizzle-kit migrate` to apply
4. Verify schema update in database

**Testing**:
- Verify new field exists
- Verify default value is false
- Verify existing marks unaffected

**Estimated Time**: 30 minutes

---

### Change 1.2: Implement Editable Marks Logic
**Files to Modify**:
- `src/actions/marks.ts` - Update submitMarks, add updateMarks, add lockMarks
- `src/db/utils/marksUtils.ts` - Add updateMark function if not exists

**Steps**:
1. Modify `submitMarks()` to check if mark exists
   - If exists: Update instead of create
   - If new: Create as before
2. Remove `updateTeamjury()` call (team stays assigned)
3. Create `lockMarks()` action for manual locking
4. Create `unlockMarks()` action for admin
5. Add validation: Cannot edit locked marks

**Testing**:
- Test: Create new mark
- Test: Update existing mark
- Test: Lock mark manually
- Test: Cannot edit locked mark
- Test: Team remains in jury's list after marking

**Estimated Time**: 2 hours

---

### Change 1.3: Update Marks Dialog UI
**Files to Modify**:
- `src/components/marks-dialog.tsx` - Add lock UI, pre-fill existing marks

**Steps**:
1. Fetch existing mark when dialog opens
2. Pre-fill form if mark exists
3. Change button text: "Submit" → "Save" or "Update"
4. Add lock button (only if mark is submitted and not locked)
5. Show locked indicator if mark is locked
6. Disable form fields if locked

**Testing**:
- Test: New mark shows empty form
- Test: Existing mark pre-fills
- Test: Can save multiple times
- Test: Lock button works
- Test: Locked mark disables editing

**Estimated Time**: 2 hours

---

### Change 1.4: Update Session End to Lock Marks
**Files to Modify**:
- `src/actions/sessionActions.ts` - Modify endSessionAction

**Steps**:
1. When ending session, lock all marks for that session
2. Update query: `UPDATE marks SET locked = true WHERE session = ?`

**Testing**:
- Test: End session locks all marks
- Test: Jury cannot edit marks after session ends

**Estimated Time**: 30 minutes

---

**Phase 1 Total Time**: 5 hours  
**Deliverable**: Editable marks with lock feature fully functional

---

## PHASE 2: WORKFLOW IMPROVEMENTS (Weeks 3-4)

**Goal**: Improve session creation and team assignment workflow  
**Risk Level**: 🟡 MEDIUM  
**Can Deploy**: ✅ Yes, backward compatible

### Change 2.1: Create Team Assignment Component
**Files to Create**:
- `src/components/TeamJuryAssignment.tsx` - Reusable assignment component

**Steps**:
1. Create component accepting teams and jury lists
2. Two modes: Manual selection, Auto shuffle
3. Manual mode: Dropdown for each team to select jury
4. Auto shuffle mode: Button to distribute evenly
5. Show current assignments
6. Allow reassignment

**Testing**:
- Test: Manual assignment works
- Test: Shuffle distributes evenly
- Test: Can change assignments

**Estimated Time**: 3 hours

---

### Change 2.2: Add Team Selection to Session Creation
**Files to Modify**:
- Locate session creation form (need to find)
- `src/actions/sessionActions.ts` - Update to handle team assignments

**Steps**:
1. Find current session creation UI
2. Add multi-step wizard or tabs:
   - Step 1: Session details
   - Step 2: Select jury
   - Step 3: Assign teams (NEW)
3. Integrate TeamJuryAssignment component
4. Update action to accept team assignments
5. Keep shuffle as option

**Testing**:
- Test: Create session with manual team selection
- Test: Create session with shuffle
- Test: Skip team assignment (assign later)

**Estimated Time**: 4 hours

---

### Change 2.3: Allow Team Reassignment Anytime
**Files to Modify**:
- Session management page (admin view)
- Create reassignment dialog/page

**Steps**:
1. Add "Reassign Teams" button to session detail page
2. Reuse TeamJuryAssignment component
3. Allow reassignment even after session started
4. Preserve existing marks

**Testing**:
- Test: Reassign team keeps marks intact
- Test: Jury sees updated team list
- Test: Old marks still visible to admin

**Estimated Time**: 2 hours

---

**Phase 2 Total Time**: 9 hours  
**Deliverable**: Flexible team assignment workflow

---

## PHASE 3: ARCHITECTURE CHANGES (Weeks 5-8)

**Goal**: Allow jury to participate in multiple sessions simultaneously  
**Risk Level**: 🔴 HIGH  
**Can Deploy**: ⚠️ Yes, but requires careful testing

### Change 3.1: Create Junction Table
**Files to Modify**:
- `src/db/schema.ts` - Add jury_sessions table

**Steps**:
1. Create `jurySessions` table:
   ```typescript
   export const jurySessions = mysqlTable('jury_sessions', {
     id: int('id').autoincrement().primaryKey(),
     juryId: int('jury_id').notNull().references(() => jury.id, {onDelete: 'cascade'}),
     sessionId: int('session_id').notNull().references(() => sessions.id, {onDelete: 'cascade'}),
     isPrimary: boolean('is_primary').default(false).notNull(),
     ...timestamps,
   });
   ```
2. Generate migration
3. Apply migration
4. Migrate existing data:
   ```sql
   INSERT INTO jury_sessions (jury_id, session_id, is_primary)
   SELECT id, session, true FROM jury WHERE session IS NOT NULL;
   ```

**Testing**:
- Test: Junction table created
- Test: Existing data migrated
- Test: Foreign keys work

**Estimated Time**: 2 hours

---

### Change 3.2: Create Jury-Session Utilities
**Files to Create**:
- `src/db/utils/jurySessionUtils.ts` - CRUD for jury-sessions

**Steps**:
1. `getJurySessions({ juryId, sessionId })`
2. `addJuryToSession({ juryId, sessionId, isPrimary })`
3. `removeJuryFromSession({ juryId, sessionId })`
4. `getJuryBySession(sessionId)` - Updated
5. `getSessionsByJury(juryId)` - New

**Testing**:
- Unit test each function

**Estimated Time**: 2 hours

---

### Change 3.3: Update Authentication
**Files to Modify**:
- `src/lib/auth.ts` - Session callback

**Steps**:
1. Fetch all sessions for jury on login
2. Store in token: `sessions: number[], primarySession: number`
3. In session callback, include all sessions
4. Keep backward compatibility

**Testing**:
- Test: Login fetches all sessions
- Test: Token contains session array
- Test: Session object includes sessions

**Estimated Time**: 2 hours

---

### Change 3.4: Add Session Switcher UI
**Files to Create**:
- `src/components/SessionSwitcher.tsx` - Session selector component

**Files to Modify**:
- `src/app/home/page.tsx` - Add session switcher

**Steps**:
1. Create dropdown showing all jury's sessions
2. Store selected session in state
3. Filter teams by selected session
4. Update marks dialog to use selected session

**Testing**:
- Test: Switcher shows all sessions
- Test: Switching updates team list
- Test: Marks submitted to correct session

**Estimated Time**: 3 hours

---

### Change 3.5: Update All Jury Queries
**Files to Modify**:
- `src/db/utils/juryUtils.ts` - Update assignment functions
- `src/actions/sessionActions.ts` - Use junction table
- All components fetching jury data

**Steps**:
1. Update `assignJuryToSession()` to use junction table
2. Update `removeJuryFromSession()` to use junction table
3. Update session end to remove from junction
4. Audit all queries for session-awareness

**Testing**:
- Test: Assign jury to multiple sessions
- Test: Remove jury from one session
- Test: End session removes from junction only
- Test: All queries work correctly

**Estimated Time**: 4 hours

---

### Change 3.6: Deprecate jury.session (Optional)
**Files to Modify**:
- `src/db/schema.ts` - Mark as deprecated or remove

**Steps**:
1. Decide: Keep or remove
2. If keeping: Add comment deprecating it
3. If removing: Generate migration to drop column

**Testing**:
- Test: System works without jury.session

**Estimated Time**: 1 hour

---

**Phase 3 Total Time**: 14 hours  
**Deliverable**: Jury can participate in multiple sessions

---

## PHASE 4: DYNAMIC CRITERIA SYSTEM (Weeks 9-14)

**Goal**: Replace hardcoded 4 criteria with flexible criteria selection  
**Risk Level**: 🔴 CRITICAL  
**Can Deploy**: ⚠️ Requires downtime for migration

### Change 5.1: Design Final Schema
**Files to Modify**:
- `src/db/schema.ts` - Add criteria, session_criteria, modify marks

**Steps**:
1. Create criteria table (master list)
2. Create session_criteria table (per-session selection)
3. Add scores JSON field to marks
4. Add totalScore computed field
5. Plan migration for existing data

**Testing**:
- Review schema with team
- Validate design

**Estimated Time**: 3 hours

---

### Change 5.2: Create and Seed Criteria
**Files to Create**:
- `src/db/utils/criteriaUtils.ts` - Criteria management
- Migration file with seed data

**Steps**:
1. Create migration for new tables
2. Seed default criteria (innovation, presentation, technical, impact)
3. Apply migration
4. Create CRUD utilities for criteria

**Testing**:
- Test: Tables created
- Test: Default criteria seeded

**Estimated Time**: 2 hours

---

### Change 5.3: Migrate Existing Marks Data
**Files to Create**:
- Migration script for data transformation

**Steps**:
1. Link all existing sessions to 4 default criteria
2. Transform marks:
   - innovationScore → scores.innovation
   - presentationScore → scores.presentation
   - technicalScore → scores.technical
   - impactScore → scores.impact
3. Calculate totalScore
4. BACKUP before running!
5. Verify migration
6. Drop old score columns

**Testing**:
- Test on copy of production data first
- Verify all marks migrated correctly
- Verify totals match

**Estimated Time**: 4 hours (+ testing)

---

### Change 5.4: Update Marks Utilities
**Files to Modify**:
- `src/db/utils/marksUtils.ts` - Handle dynamic scores

**Steps**:
1. Update `createMark()` to accept scores object
2. Update `updateMark()` to handle scores
3. Create helper: `calculateTotalScore(scores, criteria)`
4. Update all queries to work with JSON field

**Testing**:
- Test: Create mark with different criteria
- Test: Update mark scores
- Test: Total calculated correctly

**Estimated Time**: 3 hours

---

### Change 5.5: Update Validation Schemas
**Files to Modify**:
- `src/zod/marksSchema.ts` - Dynamic validation

**Steps**:
1. Create dynamic schema builder based on session criteria
2. Validate scores against criteria max values
3. Update form schema generation

**Testing**:
- Test: Validation works for different criteria sets

**Estimated Time**: 2 hours

---

### Change 5.6: Update Marks Entry UI
**Files to Modify**:
- `src/components/marks-dialog.tsx` - Dynamic form fields

**Steps**:
1. Fetch session criteria on dialog open
2. Render input fields dynamically
3. Apply appropriate validation ranges
4. Show criteria descriptions

**Testing**:
- Test: Different sessions show different criteria
- Test: Validation enforces correct ranges
- Test: Form submission works

**Estimated Time**: 4 hours

---

### Change 5.7: Update Session Creation
**Files to Modify**:
- Session creation form - Add criteria selection

**Steps**:
1. Add criteria selection step
2. Allow selecting from master list
3. Set order for display
4. Link criteria to session on creation

**Testing**:
- Test: Create session with custom criteria
- Test: Jury sees correct criteria in marks form

**Estimated Time**: 3 hours

---

### Change 5.8: Update Statistics & Reports
**Files to Modify**:
- `src/db/utils/sessionUtils.ts` - Dynamic score calculations
- Any export utilities
- Any leaderboard/ranking logic

**Steps**:
1. Update averageScore calculation to use totalScore
2. Update all aggregations
3. Update export functions to handle dynamic criteria
4. Update any reports

**Testing**:
- Test: Statistics calculate correctly
- Test: Exports include all criteria
- Test: Leaderboard works

**Estimated Time**: 4 hours

---

### Change 5.9: Comprehensive Testing
**Steps**:
1. Test with 2 criteria (minimal)
2. Test with 4 criteria (current default)
3. Test with 8 criteria (large set)
4. Test sessions with different criteria
5. Test all exports and reports
6. Test backward compatibility with migrated data

**Testing**:
- End-to-end testing
- Performance testing
- Data integrity validation

**Estimated Time**: 8 hours

---

**Phase 4 Total Time**: 33 hours  
**Deliverable**: Fully dynamic criteria system

---

## PHASE 5: UI/UX POLISH (Weeks 15-16)

**Goal**: Improve marks viewing and overall UX  
**Risk Level**: 🟢 LOW  
**Can Deploy**: ✅ Yes, incrementally

### Change 6.1: Enhanced Marks View
**Files to Modify**:
- Admin marks view page
- Create filtering components

**Steps**:
1. Add session filter dropdown
2. Add jury filter dropdown
3. Add team filter dropdown
4. Add status filter (submitted/locked)
5. Add search functionality
6. Improve table layout
7. Add sorting
8. Add pagination

**Testing**:
- Test: All filters work
- Test: Sorting works
- Test: Pagination works

**Estimated Time**: 4 hours

---

### Change 6.2: Real-Time Updates
**Files to Modify**:
- Marks view page

**Steps**:
1. Implement polling (every 10 seconds)
2. Show "new marks" indicator
3. Auto-refresh table
4. Or: Use Server-Sent Events for real-time

**Testing**:
- Test: Page updates when new marks submitted
- Test: No performance issues

**Estimated Time**: 2 hours

---

### Change 6.3: Export Improvements
**Files to Modify**:
- Export utilities

**Steps**:
1. Export filtered data only
2. Export with all criteria columns
3. Export leaderboard
4. Export summary statistics

**Testing**:
- Test: Exports contain correct data
- Test: All criteria included

**Estimated Time**: 2 hours

---

### Change 7: Dynamic Fetching System
**Files to Create**:
- `src/lib/marksQueries.ts` - Reusable query builder

**Steps**:
1. Create flexible query builder
2. Support all filter combinations
3. Support sorting
4. Support pagination
5. Use across all marks views

**Testing**:
- Test: Query builder works with all filters

**Estimated Time**: 3 hours

---

**Phase 5 Total Time**: 11 hours  
**Deliverable**: Polished UI with better marks management

---

## TOTAL PROJECT TIMELINE

| Phase | Duration | Hours | Risk | Can Deploy |
|-------|----------|-------|------|------------|
| Phase 1 | Weeks 1-2 | 5h | 🟢 LOW | ✅ Yes |
| Phase 2 | Weeks 3-4 | 9h | 🟡 MEDIUM | ✅ Yes |
| Phase 3 | Weeks 5-8 | 14h | 🔴 HIGH | ⚠️ Careful |
| Phase 4 | Weeks 9-14 | 33h | 🔴 CRITICAL | ⚠️ Downtime |
| Phase 5 | Weeks 15-16 | 11h | 🟢 LOW | ✅ Yes |
| **TOTAL** | **16 weeks** | **72h** | - | - |

---

## DEPLOYMENT STRATEGY

### After Phase 1:
- Deploy to production
- Monitor for issues
- Gather user feedback

### After Phase 2:
- Deploy to production
- Train admins on new workflow
- Monitor adoption

### After Phase 3:
- Deploy to staging first
- Extensive testing
- Deploy to production during low-usage period
- Have rollback plan ready

### After Phase 4:
- BACKUP DATABASE
- Deploy to staging
- Run migration on staging
- Verify all data migrated correctly
- Schedule maintenance window
- Deploy to production
- Monitor closely
- Keep backup for 30 days

### After Phase 5:
- Deploy incrementally
- Gather user feedback
- Iterate based on feedback

---

## ROLLBACK PLANS

### Phase 1 Rollback:
- Remove locked field
- Revert code changes
- Risk: Minimal data loss

### Phase 2 Rollback:
- Revert to old session creation flow
- Team assignments preserved
- Risk: None

### Phase 3 Rollback:
- Drop junction table
- Restore jury.session from junction data
- Revert auth changes
- Risk: Moderate, data preserved

### Phase 4 Rollback:
- Restore database from backup
- Revert all code changes
- Risk: HIGH - requires backup

### Phase 5 Rollback:
- Revert UI changes
- Risk: None

---

## SUCCESS METRICS

### Phase 1:
- ✅ Jury can edit marks multiple times
- ✅ Locked marks cannot be edited
- ✅ Session end locks all marks

### Phase 2:
- ✅ Admins can assign teams during session creation
- ✅ Teams can be reassigned anytime
- ✅ Old shuffle method still works

### Phase 3:
- ✅ Jury can be in 3+ sessions simultaneously
- ✅ Session switcher works correctly
- ✅ Marks go to correct session
- ✅ No data loss from migration

### Phase 4:
- ✅ Sessions can have 2-10 criteria
- ✅ All existing marks preserved
- ✅ Reports work with dynamic criteria
- ✅ No performance degradation

### Phase 5:
- ✅ Filtering works smoothly
- ✅ Real-time updates without lag
- ✅ Exports include all data

---

**Document Status**: ✅ Ready for Implementation  
**Next Action**: Begin Phase 1.1 - Add Locked Field to Marks  
**Owner**: Development Team
