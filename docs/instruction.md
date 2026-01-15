# EvalEase System Changes - Planning & Discovery Guide

**Document Version**: 2.0 (Planning-First Approach)
**Last Updated**: 2026-01-15
**Status**: Requirements Clarification & Architecture Discovery

---

## IMPORTANT: READ THIS FIRST

This document is a **planning guide, not a code specification**. Before implementing ANY changes:

1. **Understand the existing codebase completely**
2. **Identify what can be reused vs what needs changing**
3. **Create a migration plan** specific to your tech stack
4. **Plan incrementally** - one feature at a time
5. Save all documents in /docs folder itself if nessasry create nested folder for better organizing

Do NOT copy code from here. Use this to understand requirements and make architectural decisions.

---

## Step 1: Discovery & Assessment

Before starting development, answer these questions:

### Tech Stack Clarification

- [ ] What ORM is being used? (Prisma, TypeORM, Sequelize, raw SQL, etc.)
- [ ] What database? (PostgreSQL, MySQL, SQLite, etc.)
- [ ] What version of Next.js?
- [ ] Is NextAuth.js the auth system? If not, what?
- [ ] What component library? (Shadcn/ui, Material-UI, custom, etc.)
- [ ] Are there any existing middleware or utilities we should know about?

### Code Structure Review

- [ ] Where are database models/schemas defined?
- [ ] Where are server actions located?
- [ ] How are database queries currently structured?
- [ ] What state management is used (React context, zustand, etc.)?
- [ ] Are there existing utility functions for common operations?

### Current System Limitations

- [ ] Run the existing system end-to-end and document current flows
- [ ] Identify where breaking changes would occur with each requirement
- [ ] Check for any custom logic that depends on current schema

---

## Step 2: Requirement Analysis (One Feature at a Time)

### CHANGE 1: Editable Marks (Non-Breaking)

#### Requirement Summary

- Marks should remain editable throughout session
- Two states: Draft/Submitted (both editable), Locked (read-only)
- Jury can voluntarily lock marks
- Admin can force-lock all marks when ending session

#### Questions to Answer Before Coding

1. **Current schema**: Where is the `submitted` field in marks table?

   - Is it boolean or enum?
   - How is it currently used in queries?
2. **Current behavior**: What happens when jury submits marks now?

   - Are they immediately locked or editable?
   - Check: `submitMarks()` action - what does it do?
3. **Impact analysis**: What code currently depends on "submitted = true"?

   - Search codebase for: `marks.submitted`, `submitted` checks
   - Will adding `locked` field break any validation logic?
4. **UI/UX decision**:

   - Show both "Save Draft" and "Submit" buttons or just "Submit"?
   - Where to show lock button? In marks form or separate action?

#### Implementation Plan (Abstract)

```
1. Add new field to marks table for lock status
2. Update marks submission logic to NOT prevent edits
3. Create new action for locking marks
4. Update marks-dialog component to show lock state
5. Update session ending logic to auto-lock marks
6. Test: Old marks still work, new lock feature works
```

#### Potential Issues to Watch

- Will adding new field break existing queries?
- Do any reports/exports depend on submitted=true meaning "finalized"?
- Are there validation rules that check submitted status?

---

### CHANGE 2: Direct Team Selection During Session Creation (Potentially Breaking)

#### Requirement Summary

- Admin should select teams while creating session (not just assign jury)
- Multiple teams can be assigned to same jury
- Teams can be reassigned even after session starts

#### Questions to Answer Before Coding

1. **Current workflow**: How does team-jury assignment work now?

   - Does it happen via `shuffleTeamsInSession()`?
   - Can it be done manually currently?
   - Check: How many places call `teams.juryId` update?
2. **Current constraints**: What happens if team has no jury?

   - Is `teams.juryId` required (NOT NULL)?
   - Does jury validation fail if team is unassigned?
3. **Data relationships**: Can multiple jury mark same team in one session?

   - Check current schema: Is (teamId, juryId, session) unique in marks?
   - If yes, supporting multiple jury per team needs mark schema review
4. **Impact analysis**:

   - Search for: `teams.juryId`, `getTeamsForJury()`, `shuffleTeams()`
   - Where is team-jury assignment UI currently?
   - Any reports that assume 1-to-1 team-jury mapping?

#### Implementation Plan (Abstract)

```
1. Add new step to session creation UI for team assignment
2. Decide: Keep old workflow or deprecate it?
3. Update team assignment logic to allow team reassignment
4. Modify team fetching logic if needed
5. Test: Can assign multiple jury to same team?
6. Test: Can reassign team without breaking existing marks
```

#### Potential Issues to Watch

- Does removing team from jury delete their marks?
- What if jury has already marked a team, then it's reassigned?
- Does this break leaderboard if same team marked by different jury?

---

### CHANGE 3: Jury in Multiple Sessions Simultaneously (BREAKING)

#### Requirement Summary

- Jury should be in N sessions at once, not just 1
- Each session should show only teams assigned to that jury in that session
- Jury logs in and sees all active sessions

#### Questions to Answer Before Coding

1. **Current constraint**: Why is `jury.session` singular (1 jury:1 session)?

   - Is this enforced in schema (FK with UNIQUE)?
   - Check: How is jury session determined in NextAuth?
2. **Current authentication**: How does auth system get jury's current session?

   - Look at: NextAuth configuration, session callback
   - Where is `session.user.session` set?
3. **Current queries**: What breaks if jury is in multiple sessions?

   - Search: `getTeamsForJury()` - does it need sessionId?
   - Check: `submitMarks()` - how does it know which session?
4. **Data model decision**: How to represent jury-session relationship?

   - Option A: Keep jury.session, add jurySessions junction table (complex)
   - Option B: Remove jury.session, use only junction table (cleaner but breaking)
   - Option C: Keep jury.session for "primary" session + junction (hybrid)

#### Implementation Plan (Abstract)

```
1. Understand current jury-session relationship in detail
2. Decide on relationship model (A, B, or C above)
3. Plan schema migration if changing structure
4. Update auth session to handle multiple sessions
5. Update home page UI to show session selector
6. Update all jury queries to be session-aware
7. Test: Jury can access multiple sessions independently
8. Test: Marks in one session don't affect another
```

#### Potential Issues to Watch

- Migration of existing data (jury currently in 1 session)
- Auth session object might need restructuring
- All jury-facing queries need sessionId parameter
- Backward compatibility: Keep jury.session working for existing sessions?

---

### CHANGE 4: UI Updates (Can Happen In Parallel)

#### Requirement Summary

- Implement new UI for all above changes
- Make sure existing UI doesn't break

#### Questions to Answer Before Coding

1. **Current UI pattern**: How are forms/dialogs structured?

   - Component library conventions?
   - State management approach?
2. **Session switcher UI**: Where should it appear?

   - Top navigation?
   - Sidebar?
   - Page header?
3. **Existing users**: Will old UI confuse them?

   - Plan: Show migration help or old view option?

#### Implementation Plan (Abstract)

```
1. Sketch new UI changes on paper or Figma
2. Identify which existing components need updates
3. Create new components for new features
4. Ensure old components still work
5. Add feature flags to toggle between old/new if risky
6. Test: All UI paths work for both features
```

---

### CHANGE 5: Dynamic Criteria Per Session (Major Feature)

#### Requirement Summary

- Replace hardcoded 4 criteria with flexible selection
- Admin picks criteria when creating session
- Each session can have different criteria
- Jury evaluates using session's selected criteria

#### Questions to Answer Before Coding

1. **Current criteria**: Where is the 4-criteria rule enforced?

   - Search: `innovationScore`, `presentationScore`, `technicalScore`, `impactScore`
   - Where are these used? (marks table, forms, reports, etc.)
2. **Data impact**: How many places assume 4 fixed criteria?

   - Count occurrences of hardcoded score fields
   - Check: Any aggregation/calculation logic?
   - Any exports/reports hardcoded for 4 criteria?
3. **Schema decision**: How to store dynamic criteria?

   - Option A: JSON field in marks (simple but hard to query)
   - Option B: Separate table linking marks to criteria (normalized but complex)
   - Option C: Hybrid approach?
4. **Backward compatibility**: What about existing marks with 4 criteria?

   - Can you display old 4-criteria marks in new system?
   - Or migrate them to new schema?

#### Implementation Plan (Abstract)

```
1. Identify all hardcoded criterion references in codebase
2. Create criteria master list (dropdown/config)
3. Add session-criteria relationship
4. Update marks entry form to render dynamic criteria fields
5. Update marks storage to handle variable criteria
6. Update all queries/reports to work with dynamic criteria
7. Plan migration for existing 4-criteria marks
8. Test: Create session with different criteria combinations
9. Test: Old marks still work/display correctly
```

#### Potential Issues to Watch

- Reports/leaderboard comparing across sessions with different criteria
- Exporting marks with different criteria structures
- Jury marking same team in different sessions with different criteria
- Aggregations (sums, averages) with variable number of fields

---

### CHANGE 6: Better Marks Viewing UI (Per-Session)

#### Requirement Summary

- Replace single marks table with per-session views
- Better filtering and organization
- Real-time updates/leaderboard

#### Questions to Answer Before Coding

1. **Current marks view**: Where is it (`/dashboard/marks`)?

   - What data does it show?
   - How many marks can it display?
2. **Current filtering**: What filters exist?

   - Can you already filter by session/jury/team?
   - Any performance issues with large datasets?
3. **Real-time requirement**: What does "real-time" mean?

   - Poll every 5 seconds?
   - WebSocket updates?
   - Server-sent events?
   - Or just refresh on page visit?

#### Implementation Plan (Abstract)

```
1. Audit current marks view UI
2. Plan per-session table structure
3. Add session selector to marks page
4. Create filtering components
5. Implement real-time update strategy (polling vs WebSocket vs SSE)
6. Create leaderboard view
7. Test: Performance with 100+ marks
8. Test: Filters work correctly across sessions
```

---

### CHANGE 7: Dynamic Marks Fetching System

#### Requirement Summary

- Flexible marks query system
- Easy filtering
- Dynamic leaderboard generation

#### Questions to Answer Before Coding

1. **Current fetching**: How are marks currently fetched?

   - Direct queries in components?
   - Server actions?
   - API routes?
   - Any query builder utilities already?
2. **Performance**: Current page load time with marks?

   - Pagination needed?
   - Indexing on marks table?

#### Implementation Plan (Abstract)

```
1. Review current marks fetching pattern
2. Identify filtering needs (session, jury, team, status, etc.)
3. Create reusable query pattern (class, utility, or hook)
4. Add filtering capability
5. Add sorting/pagination
6. Implement real-time refresh pattern
7. Test: Query performance with filters
```

---

## Step 3: Risk Assessment & Sequencing

### For Each Change, Ask:

1. **Breaking Risk**: Will this break existing functionality?
2. **Data Risk**: Does it require schema migration?
3. **User Impact**: Will users be confused?
4. **Testing Effort**: How hard to test this change?

### Recommended Sequence (Low Risk First)

1. **Change 4 (UI)** - Lowest risk, can be done separately
2. **Change 1 (Editable Marks)** - Add field, update logic, careful with edge cases
3. **Change 2 (Team Selection)** - Adds workflow, doesn't break existing
4. **Change 6 (Better Marks UI)** - UI refactor, depends on marks working
5. **Change 5 (Dynamic Criteria)** - HIGH RISK, affects all existing marks
6. **Change 3 (Multiple Sessions)** - HIGH RISK, schema/auth overhaul
7. **Change 7 (Dynamic Fetching)** - Depends on above, use in views

---

## Step 4: Migration Planning Framework

For EACH change, create a plan answering:

### Schema Changes

- [ ] What tables/fields are added?
- [ ] What's removed or deprecated?
- [ ] How do you migrate existing data?
- [ ] How do you handle rollback?

### Code Changes

- [ ] What files get modified?
- [ ] What new files are needed?
- [ ] What can be reused from existing code?
- [ ] Any utility functions to create?

### Testing Plan

- [ ] What existing functionality must keep working?
- [ ] What new functionality to test?
- [ ] Edge cases specific to this change?

### Deployment Plan

- [ ] Deploy code before or after schema migration?
- [ ] Any downtime needed?
- [ ] Rollback procedure?

---

## Step 5: Implementation Workflow

For each change:

1. **Create a feature branch**
2. **Study existing code** that relates to this change
3. **Create a detailed technical plan** (not code, just plan)
4. **Make minimal schema changes** (add, don't break)
5. **Update utility/query functions** incrementally
6. **Update UI components** last
7. **Test end-to-end** before merging
8. **Deploy to staging** first
9. **Document changes** for team
10. **Get review** from team before production
