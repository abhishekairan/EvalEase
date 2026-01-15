# Feature Analysis & Impact Assessment

**Document Version**: 1.0  
**Created**: January 15, 2026  
**Status**: Analysis Complete

---

## CHANGE 1: EDITABLE MARKS WITH LOCK FEATURE

### Current Behavior Analysis

**Current Flow**:
1. Jury enters marks in dialog
2. Clicks "Submit" → `submitMarks()` action
3. Mark created with `submitted: true`
4. Team removed from jury: `updateTeamjury({teamid, juryId: null})`
5. Team disappears from jury's list

**Key Finding**: Marks are currently "one-shot" - once submitted, team is removed from jury and cannot be re-marked.

### Code Impact Analysis

#### Files Using `submitted` Field:
1. **src/db/schema.ts** - Boolean field in marks table
2. **src/zod/marksSchema.ts** - Validation schema
3. **src/db/utils/marksUtils.ts** - Query filters
4. **src/db/utils/sessionUtils.ts** - Statistics calculation (counts submitted marks)
5. **src/actions/marks.ts** - Sets `submitted: true` on creation
6. **src/components/marks-dialog.tsx** - Passes submitted flag

#### Files Using `updateTeamjury()`:
1. **src/db/utils/teamUtils.ts** - Function definition
2. **src/actions/marks.ts** - Called after mark submission

### Required Changes

#### 1. Schema Change (Low Risk)
```typescript
// Add to src/db/schema.ts in marks table:
locked: boolean('locked').default(false).notNull(),
```

**Migration**: Add nullable field, then set default

#### 2. Update submitMarks Action (Medium Risk)
```typescript
// src/actions/marks.ts
// CHANGE: Remove the updateTeamjury call
// CHANGE: Allow updates to existing marks
// ADD: New lockMarks() action
```

#### 3. Update UI (Low Risk)
```typescript
// src/components/marks-dialog.tsx
// ADD: Show lock status
// ADD: Disable editing if locked
// CHANGE: Change button text based on state
```

#### 4. Add Lock Functionality (New)
```typescript
// New action: lockMarks()
// Allow jury to voluntarily lock marks
// Admin force-locks all marks when ending session
```

### Implementation Plan

**Step 1**: Add `locked` field to schema
- Modify `src/db/schema.ts`
- Generate migration: `drizzle-kit generate`
- Apply migration: `drizzle-kit migrate`

**Step 2**: Update marks utilities
- Modify `createMark()` to handle updates
- Add `lockMark()` function
- Add `isMarkLocked()` check

**Step 3**: Update server actions
- Remove `updateTeamjury()` call from `submitMarks()`
- Create new `lockMarks()` action
- Update `endSessionAction()` to lock all marks

**Step 4**: Update UI components
- Add lock button to marks dialog
- Show locked state indicator
- Fetch existing marks to pre-fill form

**Step 5**: Testing
- Test: Submit → Edit → Submit again
- Test: Lock marks manually
- Test: End session locks all marks
- Test: Locked marks cannot be edited

### Risk Assessment: 🟢 LOW
- Non-breaking change
- Additive only (new field)
- Existing marks work as-is
- Can be rolled back easily

---

## CHANGE 2: DIRECT TEAM SELECTION DURING SESSION CREATION

### Current Behavior Analysis

**Current Workflow**:
1. Admin creates session (just name)
2. Admin assigns jury to session
3. Admin starts session
4. Admin manually calls `shuffleTeamsInSession()` to assign teams to jury
5. Teams distributed evenly among jury members

**Key Finding**: Team assignment is a separate step, done after session creation.

### Code Impact Analysis

#### Files Involved:
1. **src/actions/sessionActions.ts** - Session creation flow
2. **src/db/utils/sessionUtils.ts** - `shuffleTeamsInSession()`
3. **src/db/utils/teamUtils.ts** - `updateTeamjury()`
4. **Session creation UI** (need to locate)

### Questions to Answer

1. **Q: Where is the session creation UI?**
   - Need to find: `/dashboard/session` page
   - Look for: AddSessionForm component

2. **Q: Can we still support shuffle OR manual selection?**
   - Decision: Keep both options (backward compatible)
   - Add UI toggle: "Shuffle" vs "Manual Selection"

3. **Q: Can multiple jury mark same team?**
   - Current constraint: `teams.juryId` is singular
   - Answer: **NO**, one team can only be assigned to one jury at a time
   - If needed: Would require junction table (teams_jury_sessions)

4. **Q: What happens to existing marks if team is reassigned?**
   - Current behavior: Marks remain (juryId in marks table is separate)
   - Decision: Keep marks intact, just update assignment

### Required Changes

#### 1. Add Team Selection Step to Session Creation
```typescript
// New component: TeamJuryAssignment.tsx
// Shows:
// - List of all teams
// - Dropdown for each team to select jury
// OR
// - Button to auto-shuffle
```

#### 2. Update Session Creation Action
```typescript
// src/actions/sessionActions.ts
// ADD: Optional teamAssignments parameter
// CALL: updateTeamjury() for each assignment
```

#### 3. Allow Team Reassignment
```typescript
// Already exists: updateTeamjury() can change juryId
// ENSURE: No validation prevents reassignment
```

### Implementation Plan

**Step 1**: Locate session creation UI
- Search for AddSessionForm or session creation dialog
- Understand current form structure

**Step 2**: Design new UI flow
- Sketch multi-step session creation:
  1. Basic info (name)
  2. Select jury
  3. Assign teams (NEW)
  4. Review & create

**Step 3**: Implement team assignment component
- Create reusable TeamJuryAssignment component
- Support both shuffle and manual modes

**Step 4**: Update session actions
- Modify `addSessionAction()` to accept team assignments
- Call team update functions

**Step 5**: Update existing shuffle functionality
- Keep shuffle as an option
- Make it available during AND after session creation

**Step 6**: Testing
- Test: Create session with manual team selection
- Test: Create session with shuffle
- Test: Reassign teams after session started
- Test: Marks remain intact after reassignment

### Risk Assessment: 🟡 MEDIUM
- Workflow change (not breaking)
- Backward compatible (keeps shuffle)
- UI complexity increases
- Need careful UX design

---

## CHANGE 3: JURY IN MULTIPLE SESSIONS SIMULTANEOUSLY

### Current Behavior Analysis

**Current Constraint**:
```typescript
// src/db/schema.ts
jury.session: int('session').references(() => sessions.id, {onDelete: 'set null'})
// This is a SINGULAR foreign key - one session per jury
```

**Current Auth Flow**:
```typescript
// src/lib/auth.ts - session callback
token.session = user.session // Single session ID
session.user.session = freshUserData.session // Single session
```

**Current Home Page**:
```typescript
// Assumes jury.session is THE active session
// Fetches teams for that one session only
```

### Code Impact Analysis (EXTENSIVE)

#### Schema Changes Required:
1. **Option A: Keep jury.session + Add Junction Table** (Hybrid)
   ```typescript
   // Keep for backward compatibility
   jury.session → "primary" or "current" session
   
   // Add new table
   jury_sessions {
     id: PK
     juryId: FK → jury.id
     sessionId: FK → sessions.id
     isPrimary: boolean
   }
   ```

2. **Option B: Remove jury.session Entirely** (Clean but Breaking)
   ```typescript
   // Delete jury.session field
   
   // Add junction table
   jury_sessions {
     id: PK
     juryId: FK → jury.id
     sessionId: FK → sessions.id
   }
   ```

**Recommendation**: Option A (less breaking, gradual migration)

#### Files Requiring Changes:

**Authentication Layer**:
1. `src/lib/auth.ts`
   - CHANGE: Session callback to fetch ALL jury sessions
   - CHANGE: Store array of sessions in token
   - QUESTION: Which session is "active"? Need session switcher

**Home Page**:
2. `src/app/home/page.tsx`
   - ADD: Session selector dropdown
   - CHANGE: Filter teams by selected session
   - CHANGE: Fetch marks for selected session only

**Marks Submission**:
3. `src/actions/marks.ts`
   - ENSURE: sessionId is always passed explicitly
   - Already has session parameter ✓

**Queries**:
4. All queries using `getTeamsForJury(juryId)`
   - ADD: sessionId parameter
   - FILTER: WHERE teams.juryId = ? AND sessions.id = ?

**Admin Assignment**:
5. `src/actions/sessionActions.ts`
   - CHANGE: `assignJuryToSession()` to use junction table
   - CHANGE: `endSession()` to remove from junction, not set null

### Migration Strategy

**Phase 3.1: Add Junction Table**
```sql
CREATE TABLE jury_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jury_id INT NOT NULL,
  session_id INT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (jury_id) REFERENCES jury(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE (jury_id, session_id)
);

-- Migrate existing data
INSERT INTO jury_sessions (jury_id, session_id, is_primary)
SELECT id, session, TRUE FROM jury WHERE session IS NOT NULL;
```

**Phase 3.2: Update Auth**
```typescript
// Fetch all sessions for jury
const jurySessions = await db.select()
  .from(jurySessionsTable)
  .where(eq(jurySessionsTable.juryId, juryId));

// Store in token
token.sessions = jurySessions.map(js => js.sessionId);
token.primarySession = jurySessions.find(js => js.isPrimary)?.sessionId;
```

**Phase 3.3: Update UI**
```typescript
// Add session context/state
const [activeSession, setActiveSession] = useState(primarySession);

// Session selector
<Select value={activeSession} onChange={setActiveSession}>
  {sessions.map(s => <option key={s.id}>{s.name}</option>)}
</Select>
```

**Phase 3.4: Update All Queries**
- Add sessionId parameter to all jury-related functions
- Update all components to pass activeSession

**Phase 3.5: Optionally Remove jury.session**
- After everything works, deprecate jury.session field
- Or keep for backward compatibility

### Implementation Plan

**Step 1**: Create junction table schema
**Step 2**: Generate and apply migration
**Step 3**: Populate junction table from existing data
**Step 4**: Create utility functions for junction table
**Step 5**: Update auth session callback
**Step 6**: Add session switcher to home page
**Step 7**: Update all queries to be session-aware
**Step 8**: Test multi-session workflow extensively
**Step 9**: Consider removing jury.session (optional)

### Risk Assessment: 🔴 HIGH
- Breaking change to auth system
- Affects ALL jury-facing features
- Complex migration
- Requires comprehensive testing
- Rollback is difficult

**Recommendation**: Implement in Phase 3, after Phases 1-2 are stable

---

## CHANGE 4: UI UPDATES

### Current UI Structure

**Component Library**: Shadcn/ui (Radix UI + Tailwind)
**Pattern**: Client components with `"use client"` directive
**Forms**: React Hook Form + Zod validation
**Dialogs**: Radix Dialog component
**Tables**: TanStack Table

### UI Changes Needed

1. **Marks Dialog**:
   - ADD: Lock button
   - ADD: Locked state indicator
   - CHANGE: "Submit" to "Save" / "Update"
   - ADD: Pre-fill with existing marks

2. **Home Page (Jury)**:
   - ADD: Session selector (if Change 3 implemented)
   - UPDATE: Team list to show mark status (draft/submitted/locked)

3. **Session Creation**:
   - ADD: Multi-step wizard
   - ADD: Team assignment step

4. **Marks View (Admin)**:
   - ADD: Per-session filtering
   - ADD: Better table layout
   - ADD: Real-time updates

### Implementation Plan

**Step 1**: Update marks-dialog.tsx
- Add locked state handling
- Pre-fill form with existing marks
- Add lock button

**Step 2**: Create session switcher component
- Reusable across pages
- Store selection in local state

**Step 3**: Update session creation flow
- Multi-step form component
- Better UX for team assignment

**Step 4**: Improve marks table
- Add filters
- Better sorting
- Export functionality

### Risk Assessment: 🟢 LOW
- UI changes are isolated
- No schema impact
- Can be done incrementally

---

## CHANGE 5: DYNAMIC CRITERIA PER SESSION

### Current Hardcoded Structure

**Schema**:
```typescript
marks: {
  innovationScore: int().notNull(),
  presentationScore: int().notNull(),
  technicalScore: int().notNull(),
  impactScore: int().notNull(),
}
```

**Validation**:
```typescript
// src/zod/marksSchema.ts
innovationScore: z.number().int().min(-1).max(10),
presentationScore: z.number().int().min(-1).max(10),
technicalScore: z.number().int().min(-1).max(15),
impactScore: z.number().int().min(-1).max(15),
```

**UI**:
```typescript
// src/components/marks-dialog.tsx
// 4 hardcoded Input components
```

**Statistics**:
```typescript
// src/db/utils/sessionUtils.ts
averageScore: avg(sql`${marks.innovationScore} + ${marks.presentationScore} + ${marks.technicalScore} + ${marks.impactScore}`)
```

### Code Impact Analysis (CRITICAL)

#### Files With Hardcoded Criteria (20+ occurrences):
1. `src/db/schema.ts` - 4 fields
2. `src/zod/marksSchema.ts` - 4 validations
3. `src/components/marks-dialog.tsx` - 4 inputs
4. `src/db/utils/marksUtils.ts` - References in docs/examples
5. `src/db/utils/sessionUtils.ts` - Score calculation
6. Any export/report utilities
7. Any leaderboard calculations

### Design Options

#### Option A: JSON Field (Simple but Limited)
```typescript
marks: {
  scores: json('scores').notNull(), // { "innovation": 8, "presentation": 7, ... }
  totalScore: int().notNull(),
}
```

**Pros**: Easy to implement, flexible
**Cons**: Hard to query, poor for aggregations

#### Option B: Normalized Tables (Complex but Proper)
```typescript
criteria: {
  id: PK,
  name: string, // "Innovation"
  maxScore: int, // 10
  description: string,
}

session_criteria: {
  id: PK,
  sessionId: FK,
  criteriaId: FK,
  order: int, // Display order
}

mark_scores: {
  id: PK,
  markId: FK,
  criteriaId: FK,
  score: int,
}
```

**Pros**: Normalized, queryable, flexible
**Cons**: Complex queries, multiple joins

#### Option C: Hybrid (Recommended)
```typescript
// Master list of available criteria
criteria: {
  id: PK,
  code: string, // "innovation", "presentation"
  name: string,
  maxScore: int,
}

// Selected criteria for each session
session_criteria: {
  id: PK,
  sessionId: FK,
  criteriaId: FK,
  order: int,
}

// Dynamic scores (JSON for flexibility, computed total for performance)
marks: {
  id: PK,
  teamId: FK,
  juryId: FK,
  sessionId: FK,
  scores: json, // { "innovation": 8, "presentation": 7 }
  totalScore: int, // Computed sum
  submitted: boolean,
  locked: boolean,
}
```

### Migration Strategy (CRITICAL)

**Step 1**: Create new tables
```sql
CREATE TABLE criteria (...);
CREATE TABLE session_criteria (...);
```

**Step 2**: Seed default criteria
```sql
INSERT INTO criteria (code, name, maxScore) VALUES
('innovation', 'Innovation', 10),
('presentation', 'Presentation', 10),
('technical', 'Technical', 15),
('impact', 'Impact', 15);
```

**Step 3**: For all existing sessions, link all 4 criteria
```sql
INSERT INTO session_criteria (session_id, criteria_id, order)
SELECT s.id, c.id, 
  CASE c.code 
    WHEN 'innovation' THEN 1
    WHEN 'presentation' THEN 2
    WHEN 'technical' THEN 3
    WHEN 'impact' THEN 4
  END
FROM sessions s
CROSS JOIN criteria c;
```

**Step 4**: Migrate marks data
```sql
ALTER TABLE marks ADD COLUMN scores JSON;
ALTER TABLE marks ADD COLUMN total_score INT;

UPDATE marks SET 
  scores = JSON_OBJECT(
    'innovation', innovation_score,
    'presentation', presentation_score,
    'technical', technical_score,
    'impact', impact_score
  ),
  total_score = innovation_score + presentation_score + technical_score + impact_score;

-- After verification, drop old columns
ALTER TABLE marks DROP COLUMN innovation_score;
ALTER TABLE marks DROP COLUMN presentation_score;
ALTER TABLE marks DROP COLUMN technical_score;
ALTER TABLE marks DROP COLUMN impact_score;
```

### Implementation Plan

**Step 1**: Design and finalize schema
**Step 2**: Create migration scripts
**Step 3**: Create criteria utilities
**Step 4**: Update marks utilities to handle dynamic scores
**Step 5**: Update UI to render dynamic form fields
**Step 6**: Update validation to use session criteria
**Step 7**: Update all statistics/exports
**Step 8**: Comprehensive testing with different criteria combinations
**Step 9**: Migration testing with rollback plan

### Risk Assessment: 🔴 CRITICAL
- Breaks ALL existing code
- Complex data migration
- High chance of data loss if not careful
- Affects reporting, exports, statistics
- Extensive testing required
- Rollback is very difficult

**Recommendation**: 
- Implement LAST (Phase 4)
- Thorough testing on staging
- Complete backup before migration
- Plan downtime for migration
- Have rollback plan ready

---

## CHANGE 6 & 7: BETTER MARKS VIEWING & DYNAMIC FETCHING

### Current Marks View Analysis

**Need to locate**: `/dashboard/marks` page

### Required Improvements

1. **Per-Session Filtering**:
   - Session dropdown filter
   - Jury dropdown filter
   - Team dropdown filter
   - Status filter (submitted/locked)

2. **Better Display**:
   - Sortable columns
   - Pagination
   - Export to Excel/CSV
   - Print view

3. **Real-Time Updates**:
   - Option 1: Polling (simpler)
   - Option 2: Server-Sent Events
   - Option 3: WebSocket (overkill?)

### Implementation Plan

**Step 1**: Audit current marks view page
**Step 2**: Create filtering components
**Step 3**: Implement dynamic query builder
**Step 4**: Add sorting and pagination
**Step 5**: Add real-time updates (polling)
**Step 6**: Add export functionality

### Risk Assessment: 🟢 LOW
- UI improvements only
- No schema changes
- Can iterate gradually

---

## SUMMARY: IMPLEMENTATION SEQUENCE

### Phase 1: Low-Risk Enhancements (Weeks 1-2)
1. ✅ **Change 1**: Add locked field + editable marks
2. ✅ **Change 6/7**: Better marks UI + dynamic fetching
3. ✅ **Change 4**: UI component updates

### Phase 2: Workflow Improvements (Weeks 3-4)
4. ✅ **Change 2**: Team selection during session creation
5. ✅ Test comprehensive workflow

### Phase 3: Architecture Changes (Weeks 5-8)
6. ⚠️ **Change 3**: Multiple sessions for jury
7. ⚠️ Extensive testing and migration

### Phase 4: Major Restructuring (Weeks 9-14)
8. 🔴 **Change 5**: Dynamic criteria system
9. 🔴 Data migration and validation
10. 🔴 Comprehensive testing

---

**Document Status**: ✅ Complete  
**Next Steps**: Create Phase 1 Implementation Plan  
**Risk Level**: Graduated approach minimizes risk
