# EvalEase System Architecture Documentation

## Overview
EvalEase is a Next.js-based evaluation management system that handles session management for jury-based team evaluation and marks/scoring entry. The system manages the complete lifecycle of evaluation sessions, jury assignments, team scoring, and supports **multi-session jury assignments** through a junction table architecture.

**Latest Version**: 2.0 (Phase 3 - Multi-Session Support)  
**Last Updated**: January 16, 2026

---

## 1. DATABASE SCHEMA

### Core Tables

#### **sessions** (Evaluation Sessions)
```sql
- id (PK): auto-increment
- name: string (max 255) - Session name/title
- startedAt: timestamp (nullable) - Session start time
- endedAt: timestamp (nullable) - Session end time
- createdAt: timestamp (auto)
- updatedAt: timestamp (auto)
```
**Purpose**: Represents individual evaluation sessions. Sessions control when jury members can enter marks.

#### **jury** (Jury Members/Evaluators)
```sql
- id (PK): auto-increment
- name: string (max 255)
- email: string (unique, max 255)
- phoneNumber: string (max 20)
- role: string (default: 'jury')
- createdAt: timestamp
- updatedAt: timestamp
```
**Purpose**: Represents jury members who evaluate teams. **PHASE 3 UPDATE**: Jury members can now be assigned to **multiple sessions simultaneously** via the `jury_sessions` junction table. The old `session` field has been deprecated.

#### **jury_sessions** (Jury-Session Assignments) **[NEW - PHASE 3]**
```sql
- id (PK): auto-increment
- juryId: FK → jury.id (NOT NULL, cascade on delete)
- sessionId: FK → sessions.id (NOT NULL, cascade on delete)
- createdAt: timestamp (auto)
- updatedAt: timestamp (auto)
- UNIQUE constraint: (juryId, sessionId)
```
**Purpose**: Junction table enabling many-to-many relationship between jury members and sessions. One jury member can be assigned to multiple active sessions, and one session can have multiple jury members. This replaces the old one-to-one `jury.session` relationship.

#### **participants** (Team Members/Students)
```sql
- id (PK): auto-increment
- name: string
- email: string (unique)
- institude: string (institution/school)
- phoneNumber: string
- createdAt: timestamp
- updatedAt: timestamp
```
**Purpose**: Represents individual participants/students.

#### **teams** (Evaluation Teams)
```sql
- id (PK): auto-increment
- teamName: string (max 255)
- leaderId: FK → participants.id (NOT NULL, cascade on delete)
- juryId: FK → jury.id (nullable, set null on delete)
- room: string (nullable) - Room location
- createdAt: timestamp
- updatedAt: timestamp
```
**Purpose**: Represents teams that will be evaluated. Each team is led by ONE participant and is assigned to ONE jury member.

#### **teamMembers** (Team Composition)
```sql
- id (PK): auto-increment
- teamId: FK → teams.id (cascade on delete)
- memberId: FK → participants.id (cascade on delete)
- createdAt: timestamp
- updatedAt: timestamp
```
**Purpose**: Links participants to teams (many-to-many relationship).

#### **marks** (Evaluation Scores)
```sql
- id (PK): auto-increment
- teamId: FK → teams.id (NOT NULL, cascade on delete)
- juryId: FK → jury.id (NOT NULL, cascade on delete)
- session: FK → sessions.id (NOT NULL, cascade on delete)
- innovationScore: int (0-10)
- presentationScore: int (0-10)
- technicalScore: int (0-15)
- impactScore: int (0-15)
- submitted: boolean (default: false)
- locked: boolean (default: false) **[PHASE 1 - Editable Marks Feature]**
- createdAt: timestamp
- updatedAt: timestamp
```
**Purpose**: Stores evaluation scores. Unique constraint: (teamId, juryId, session) - Each jury member scores each team only once per session.

**PHASE 1 UPDATE**: Added `locked` field to prevent editing of finalized marks. Marks can be manually locked by jury members or automatically locked when session ends. Locked marks cannot be edited and display read-only status in UI.

#### **credentials** (User Authentication)
```sql
- id (PK): auto-increment
- email: string (unique)
- role: string ('admin', 'jury')
- password: string (hashed, max 512)
```
**Purpose**: Stores authentication credentials.

---

## 2. SESSION MANAGEMENT WORKFLOW

### Session Lifecycle (Updated for Phase 3)

```
┌─────────────┐
│   CREATE    │  Admin creates new session with name
│  SESSION    │  (startedAt & endedAt are NULL)
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  ASSIGN JURY MEMBERS    │  **[PHASE 3]** Admin assigns multiple jury members
│  (Multi-Session)        │  Creates entries in jury_sessions junction table
│                         │  One jury can be assigned to multiple sessions
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  ASSIGN/SHUFFLE TEAMS   │  **[PHASE 2]** Admin assigns teams to jury members
│  (Team Assignment)      │  during session creation or via reassignment page
│                         │  Updates teams.juryId for each team
└──────┬──────────────────┘
       │
       ▼
┌─────────────────┐
│   START SESSION │  Admin clicks "Start"
│                 │  Sets sessions.startedAt = NOW()
└──────┬──────────┘
       │
       ▼ (Jury members now see session in "Ongoing" tab)
┌──────────────────────┐
│  JURY VIEWS SESSION  │  **[PHASE 3]** Jury logs in, sees all assigned sessions
│  & TEAMS             │  in tabs (Ongoing/Upcoming/Past)
│                      │  Clicks on started session to view teams
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  JURY EVALUATES      │  **[PHASE 1]** Jury enters marks for assigned teams
│  TEAMS & ENTERS      │  Creates marks records with 4 scores
│  MARKS               │  Can edit marks until locked
│                      │  Can manually lock marks when finalized
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   END SESSION        │  Admin clicks "End"
│                      │  Sets sessions.endedAt = NOW()
│                      │  **[PHASE 1]** Auto-locks all marks in session
│                      │  **[PHASE 3]** Junction table entries remain
│                      │  (jury stays assigned but session becomes "Past")
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   SESSION CLOSED     │  Marks are finalized and locked
│                      │  Jury can view but not edit marks
│                      │  Session appears in "Past" tab for jury
└──────────────────────┘
```

### Key Relationships (Updated for Phase 3)

1. **Session ↔ Jury (N:M)** **[CHANGED - PHASE 3]**
   - Many-to-many relationship via `jury_sessions` junction table
   - One session can have many jury members
   - One jury member can be assigned to many sessions
   - Query via: `SELECT * FROM jury_sessions WHERE sessionId = ? / juryId = ?`

2. **Session → Marks (1:N)**
   - One session contains many mark records
   - Filter via: `marks.session = sessions.id`
   - **[PHASE 1]** Marks can be locked individually or all locked when session ends

3. **Jury → Teams (1:N)**
   - One jury member evaluates multiple teams
   - Assignment via: `teams.juryId = jury.id`
   - **[PHASE 3]** Same jury can have different teams in different sessions

4. **Team → Marks (1:N)**
   - One team receives scores from multiple jury members
   - Tracked via: `marks.teamId = teams.id`
   - **[PHASE 3]** Same team can be marked by same jury in different sessions

---

## 3. MARKS ENTERING SYSTEM (JURY SIDE) - Updated for Phase 3

### Jury Member Journey (Multi-Session Support)

#### **Step 1: Authentication**
```typescript
// Jury member logs in via credentials
Email + Password → Verify in creds table → Get jury.id
Session stored in NextAuth: session.user.id = jury.id
**[PHASE 3]**: No longer stores single session - jury can access multiple sessions
```

#### **Step 2: Home Page (Jury Dashboard)** **[REDESIGNED - PHASE 3]**
**File**: `src/app/home/page.tsx`
**Component**: `src/components/JurySessionsView2.tsx`

```typescript
// Flow:
1. Get current jury from auth session → jury.id
2. **[NEW]** Fetch all sessions for jury → getSessionsForJury({ juryId })
3. Calculate session status based on startedAt/endedAt:
   - Upcoming: startedAt in future or null
   - Ongoing: startedAt in past, endedAt null
   - Past: endedAt in past
4. Get team counts for each session
5. Display sessions in three tabs with cards
6. Only "Ongoing" sessions are clickable
```

**UI Features**:
- **Three Tabs**: Ongoing (green), Upcoming (blue), Past (gray)
- **Session Cards**: Display name, dates, team count, status badge
- **Access Control**: Lock icon on non-started sessions, prevents navigation
- **Team Count Stats**: Shows number of teams assigned to jury in each session

#### **Step 3: Select Session & View Teams** **[NEW - PHASE 3]**
**Route**: `/home/session/[sessionId]`
**Component**: `src/components/SessionTeamsView.tsx`

```typescript
// Security Checks:
1. Verify jury is logged in
2. Verify jury is assigned to session (via jury_sessions)
3. Verify session has started (startedAt in past)
4. Verify session has not ended (endedAt null or in future)
5. If any check fails → redirect to /home

// Display:
- Session name and jury name in header
- Stats cards: Total Teams / Marked / Locked / Pending
- Search bar (filter by team name, leader, or member names)
- Team grid with cards showing:
  - Team name and ID
  - Leader and members
  - Status badges: Marked/Pending + Locked (if applicable)
  - Button: "Add Marks" / "View/Edit Marks" / "View Locked Marks"
```

#### **Step 4: Enter/Edit Marks for Team** **[UPDATED - PHASE 1 & 3]**
**Component**: `src/components/marks-dialog.tsx`

```typescript
Form Fields:
┌─────────────────────────────────┐
│ **[PHASE 1]** Lock Status Badge │ (if marks are locked)
│                                 │
│ Innovation Score    │  0-10     │
│ Presentation Score  │  0-10     │
│ Technical Score     │  0-15     │
│ Impact Score        │  0-15     │
│                                 │
│ Buttons:                        │
│ - Submit/Update Marks           │
│ - **[PHASE 1]** Lock Marks      │ (only if editing existing)
│ - Cancel/Close                  │
└─────────────────────────────────┘

**[PHASE 1]** Lock Feature:
- Locked marks show badge in header
- All input fields disabled when locked
- Only "Close" button visible (no edit/submit)
- "Lock Marks" button appears when editing unlocked marks
- Prevents accidental changes to finalized scores

**[PHASE 3]** Multi-Session Context:
- existingMark fetched via getExistingMark(teamId, juryId, sessionId)
- Marks are session-specific (same jury can mark same team in different sessions)
- Form pre-fills with existing marks if found
- Lock status is per session (locked in Session A ≠ locked in Session B)
1. Validate all scores are in range
2. Call submitMarks() action with:
   - teamId
   - juryId
   - session
   - all 4 scores
   - submitted = true
```

#### **Step 5: Submit/Update Marks (Server Action)** **[UPDATED - PHASE 1]**
**File**: `src/actions/marks.ts`

```typescript
export async function submitMarks(markData: MarkData) {
  // Validation:
  1. **[PHASE 1]** Check mark is not locked (locked === false)
  2. Check session hasn't ended (session.endedAt === null)
  3. Validate all foreign key relations exist
  4. Prevent duplicate marks (team-jury-session must be unique)
  
  // Database Operations:
  1. INSERT or UPDATE marks table
  2. **[PHASE 1]** Set locked = false by default
  3. Revalidate pages:
     - /home (jury dashboard)
     - /home/session/[sessionId] (session team view)
     - /dashboard/marks (admin marks view)
     - /dashboard/sessions (admin session view)
}

// **[PHASE 1]** New: Lock Marks Action
export async function lockMarks({ markId }: { markId: number }) {
  // Validation:
  1. Check mark exists
  2. Check mark is not already locked
  
  // Database Operations:
  1. UPDATE marks SET locked = true WHERE id = markId
  2. Revalidate relevant pages
  
  // Result:
  - Mark becomes read-only
  - Jury can view but not edit
  - Displayed with lock badge in UI
}
```

### Marks Validation (Updated)

**In `createMark()` function**:
1. Validates `validateMarkRelations()`:
   - Team exists (teams.id = teamId)
   - Jury exists (jury.id = juryId)
   - Session exists (sessions.id = session)

2. Prevents duplicates:
   - Checks if mark already exists for (teamId, juryId, session)
   - Throws error if duplicate found

3. Enforces score ranges:
   - innovationScore: 0-10 (Zod schema validation)
   - presentationScore: 0-10
   - technicalScore: 0-15
   - impactScore: 0-15

4. **[PHASE 1]** Lock validation:
   - Cannot edit marks where locked = true
   - Error thrown if edit attempted on locked mark

### Session Timing Protection (Updated for Phase 3)

```typescript
// **[PHASE 3]** Jury can access multiple sessions but:
// - Can only ENTER marks in STARTED sessions (session.startedAt != NULL, < NOW)
// - Cannot enter marks in ENDED sessions (session.endedAt != NULL, < NOW)
// - Upcoming sessions visible but not accessible (startedAt > NOW or NULL)

// **[PHASE 1]** When session ends:
// - All marks auto-locked (UPDATE marks SET locked = true WHERE session = sessionId)
// - **[PHASE 3]** Jury remains assigned via jury_sessions (for historical record)
// - Session moves to "Past" tab in jury dashboard
// - Marks become read-only
```

---

## 4. ADMIN SESSION MANAGEMENT (Updated for Phases 2 & 3)

### Key Admin Operations

#### **Create Session** **[ENHANCED - PHASE 2]**
```typescript
// Input: Session name, selected jury, team assignments
// Component: Multi-step AddSessionForm with 3 steps:
//   1. Session Details (name)
//   2. Jury Selection (multi-select checkboxes)
//   3. Team Assignment (manual or auto-shuffle)
// Action: 
//   - createSession({ session: { name: "string" } })
//   - **[PHASE 3]** For each selected jury: INSERT into jury_sessions
//   - **[PHASE 2]** Assign teams via updateTeamJury()
// Result: 
//   - Session created with startedAt & endedAt = NULL
//   - Multiple jury assigned via junction table
//   - Teams assigned to jury members
```

#### **Assign Jury to Session** **[CHANGED - PHASE 3]**
```typescript
// **[PHASE 3 - Multi-Session Support]**
// Input: sessionId, selectedJury[] (can select multiple)
// Action: For each juryId in selectedJury:
//   INSERT INTO jury_sessions (juryId, sessionId) VALUES (?, ?)
// Result: 
//   - Junction table entries created
//   - One jury can be in multiple sessions
//   - Same session can have multiple jury
//   - Replaces old jury.session = sessionId approach
```

#### **Edit Jury Session Assignments** **[NEW - PHASE 3]**
```typescript
// Component: EditJurySessionsDialog
// Input: juryId, currentSessions[], newSessions[]
// Action: updateJurySessionsAction()
//   1. Compare current vs new session arrays
//   2. Remove sessions: DELETE FROM jury_sessions WHERE juryId = ? AND sessionId IN (removed)
//   3. Add sessions: INSERT INTO jury_sessions (juryId, sessionId) VALUES for new sessions
// Result:
//   - Smart add/remove without affecting other assignments
//   - Jury can be added to or removed from sessions
//   - Historical marks preserved
```

#### **Reassign Teams** **[NEW - PHASE 2]**
```typescript
// Route: /dashboard/teams/reassign/[sessionId]
// Component: ReassignTeamsForm
// Action: Can reassign teams even after session started
// Features:
//   - Manual assignment: Drag/drop or select jury for each team
//   - Auto-shuffle: Redistribute all teams evenly
//   - Warning: Shows if reassignment affects existing marks
// Result:
//   - teams.juryId updated for selected teams
//   - Existing marks not deleted (preserved with old juryId)
```

#### **Start Session**
```typescript
// Action: updateSession({ sessionId, updates: { startedAt: new Date() } })
// Result: 
// - session.startedAt is set
// - **[PHASE 3]** Jury members see session in "Ongoing" tab
// - Session becomes accessible for marking
```

#### **Shuffle Teams** **[ENHANCED - PHASE 2]**
```typescript
// Action: shuffleTeamsInSession(sessionId)
// Algorithm:
// 1. **[PHASE 3]** Get all jury members assigned via jury_sessions
// 2. Get all teams
// 3. Distribute teams evenly among jury members
// 4. Update each team: teams.juryId = assignedJuryId
// Constraint: Each team assigned to exactly ONE jury member
// **[PHASE 2]** Confirmation dialog warns about existing marks
```

#### **End Session** **[UPDATED - PHASE 1 & 3]**
```typescript
// Action: endSessionAction(sessionId)
// Result:
// - session.endedAt = NOW()
// - **[PHASE 1]** Auto-lock all marks: UPDATE marks SET locked = true WHERE session = sessionId
// - **[PHASE 3]** Junction entries remain (historical record)
// - **[PHASE 3]** Session moves to "Past" tab for jury
// - No more marks can be entered/edited
```

#### **Delete Session** **[UPDATED - PHASE 3]**
```typescript
// Action: deleteSession(sessionId)
// Result:
// - **[PHASE 3]** Delete junction entries: DELETE FROM jury_sessions WHERE sessionId = ?
// - Delete all marks: CASCADE from marks.session FK
// - Delete session record
// - Cascade delete ensures referential integrity
```

---

## 5. DATA FLOW DIAGRAMS

### Session Creation & Team Assignment (Updated for Phase 2 & 3)

```
ADMIN CREATES SESSION (Multi-Step Form)
       │
       ▼
┌──────────────────────────────────────┐
│ 1. **[PHASE 2]** Session Details     │
│    → Admin enters session name       │
│    → createSession()                 │
│    → new sessions record created     │
│    → startedAt: NULL, endedAt: NULL  │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 2. **[PHASE 3]** Jury Selection      │
│    → Multi-select checkboxes         │
│    → Can select multiple jury        │
│    → Shows all available jury        │
│    → (no longer limited to unassigned)
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 3. **[PHASE 2]** Team Assignment     │
│    → Manual: Select jury per team    │
│    → Auto: Shuffle teams evenly      │
│    → Search & filter by institute    │
│    → Pagination (50 teams/page)      │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 4. Submit & Create                   │
│    → **[PHASE 3]** INSERT into       │
│      jury_sessions for each jury     │
│    → **[PHASE 2]** UPDATE teams      │
│      SET juryId for assignments      │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 5. Session Created Successfully      │
│    → Jury assigned via junction table│
│    → Teams assigned to jury members  │
│    → Ready to start                  │
└──────────────────────────────────────┘
```
### Jury Marks Entry Flow (Updated for Phase 1 & 3)

```
JURY MEMBER LOGS IN
       │
       ▼
┌──────────────────────────────────────┐
│ NextAuth Session                     │
│ - session.user.id = jury.id          │
│ **[PHASE 3]** No longer stores single│
│ session - jury accesses multiple     │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ **[PHASE 3]** Homepage (/home)       │
│ - Get jury from session              │
│ - getSessionsForJury({ juryId })     │
│ - Calculate status for each session  │
│ - Group into Ongoing/Upcoming/Past   │
│ - Display in tab-based UI            │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ **[PHASE 3]** Display Session Cards  │
│ - Three tabs with status indicators  │
│ - Team counts per session            │
│ - Lock icons on non-started sessions │
│ - Click opens started sessions only  │
└──────────┬───────────────────────────┘
           │
           ▼ (Click on Ongoing session)
┌──────────────────────────────────────┐
│ **[PHASE 3]** Session Detail Page    │
│ Route: /home/session/[sessionId]     │
│ - Security checks (auth, assignment) │
│ - Get teams for jury in session      │
│ - Stats: Total/Marked/Locked/Pending │
│ - Search bar with filters            │
│ - Team grid with cards               │
└──────────┬───────────────────────────┘
           │
           ▼ (Click on team)
┌──────────────────────────────────────┐
│ **[PHASE 1 & 3]** MarksDialog        │
│ - Fetch existing mark (if any)       │
│ - Pre-fill form with existing scores │
│ - Show lock status badge if locked   │
│ - Disable fields if locked           │
│ - Form with 4 score fields           │
└──────────┬───────────────────────────┘
           │
           ▼ (Submit marks)
┌──────────────────────────────────────┐
│ submitMarks() Server Action          │
│ 1. **[PHASE 1]** Check not locked    │
│ 2. Validate session active           │
│ 3. Validate relations exist          │
│ 4. Check no duplicates               │
│ 5. INSERT/UPDATE marks table         │
│ 6. Revalidate paths                  │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ **[PHASE 1]** Optional: Lock Marks   │
│ - Jury clicks "Lock Marks" button    │
│ - lockMarks({ markId })              │
│ - UPDATE marks SET locked = true     │
│ - Mark becomes read-only             │
└──────────────────────────────────────┘
```
│ 4. ADMIN STARTS SESSION      │
│    → session.startedAt=NOW() │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ 5. shuffleTeamsInSession()   │
│    → Distribute teams evenly │
│    → Update teams.juryId     │
│    → for each team           │
└──────────────────────────────┘
```

### Jury Marks Entry Flow

```
JURY MEMBER LOGS IN
       │
       ▼
┌──────────────────────────────┐
│ NextAuth Session             │
│ - session.user.id = jury.id  │
│ - session.user.session = s.id│
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Homepage (/home)             │
│ - Get jury from session      │
│ - Check session is active    │
│ - getTeamsForJury(jury.id)   │
│ - Filter: teams.juryId=jury│
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Display Team List            │
│ - Show all assigned teams    │
│ - Show marks status          │
│ - "Enter Marks" button       │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ MarksDialog Component        │
│ - Form with 4 score fields   │
---

## 6. KEY UTILITY FUNCTIONS (Updated for Phase 3)

### Session Utils (`src/db/utils/sessionUtils.ts`)

| Function | Purpose | Input | Output | Changes |
|----------|---------|-------|--------|---------|
| `getSessions()` | Get all sessions | - | `sessionDBType[]` | - |
| `getSessionById()` | Get single session | sessionId | `sessionDBType \| null` | - |
| `createSession()` | Create new session | `{ name: string }` | `sessionDBType[]` | - |
| `updateSession()` | Update session | sessionId, updates | `sessionDBType \| null` | - |
| `deleteSession()` | Delete session + cleanup | sessionId | `boolean` | **[PHASE 3]** Deletes jury_sessions entries |
| `getSessionStats()` | Get marks statistics | sessionId | Stats object | - |
| `shuffleTeamsInSession()` | Distribute teams | sessionId | `boolean` | **[PHASE 3]** Uses jury_sessions |
| `getTeamsBySession()` | Get teams in session | sessionId | `TeamDBType[]` | **[PHASE 3]** Uses jury_sessions |

### Jury Utils (`src/db/utils/juryUtils.ts`)

| Function | Purpose | Input | Output | Changes |
|----------|---------|-------|--------|---------|
| `getJury()` | Get jury members | Filters (id, email) | `juryDBType[]` | **[PHASE 3]** No longer filters by session |
| `createJury()` | Create new jury | jury data + password | `juryDBType[]` | - |
| `updateJury()` | Update jury | jury data with id | `juryDBType[]` | - |
| `deleteJury()` | Delete jury | juryId | `boolean` | **[PHASE 3]** Cascades to jury_sessions |
| `assignJuryToSession()` | **[DEPRECATED]** | juryId, sessionId | `boolean` | **[PHASE 3]** Use updateJurySession() |
| `removeJuryFromSession()` | Remove from session(s) | juryId, sessionId? | `boolean` | **[PHASE 3]** Deletes from jury_sessions |
| `getJuryBySession()` | Get jury in session | sessionId | `juryDBType[]` | **[PHASE 3]** Joins jury_sessions |
| `updateJurySession()` | **[NEW]** Assign jury | juryId, sessionId | `boolean` | **[PHASE 3]** Inserts into jury_sessions |
| `getSessionsForJury()` | **[NEW]** Get sessions | `{ juryId }` | `sessionDBType[]` | **[PHASE 3]** Joins jury_sessions |
| `getJuryWithSessions()` | **[NEW]** Get with sessions | juryId | Jury + sessions[] | **[PHASE 3]** For jury table display |

### Marks Utils (`src/db/utils/marksUtils.ts`)

| Function | Purpose | Input | Output | Changes |
|----------|---------|-------|--------|---------|
| `getMarks()` | Get marks (filtered) | Filters | `MarksDBType[]` | - |
| `createMark()` | Create new mark | mark data | `MarksDBType[]` | **[PHASE 1]** Sets locked = false |
| `updateMark()` | Update mark | mark data with id | `MarksDBType[]` | **[PHASE 1]** Validates not locked |
| `deleteMark()` | Delete mark | markId | `boolean` | - |
| `lockMark()` | **[NEW]** Lock mark | markId | `boolean` | **[PHASE 1]** Sets locked = true |
| `lockAllMarksInSession()` | **[NEW]** Auto-lock | sessionId | `boolean` | **[PHASE 1]** Called on session end |
| `getMarksWithData()` | Get marks + relations | Filters | Complex object | - |
| `validateMarkRelations()` | Validate foreign keys | teamId, juryId, session | `boolean` | - |
| `isJuryMarkingComplete()` | Check if jury done | juryId, session | `boolean` | - |
| `getTeamsToMarkByJury()` | Get pending teams | juryId, session | `number[]` | - |

---

## 7. IMPORTANT CONSTRAINTS (Updated for Phase 1 & 3)

### Database Level
1. **Unique Constraints**:
   - `(marks.teamId, marks.juryId, marks.session)` - One mark per team-jury-session
   - **[PHASE 3]** `(jury_sessions.juryId, jury_sessions.sessionId)` - One junction entry per pair
   - Emails unique in jury, participants, admin, creds

2. **Foreign Key Constraints**:
   - Cascade delete: teams, marks, teamMembers, **[PHASE 3]** jury_sessions (if parent deleted)
   - Set null: teams.juryId (if jury deleted)
   - **[PHASE 3]** jury_sessions CASCADE on both jury.id and sessions.id delete

3. **Not Null Constraints**:
   - All mark scores must be provided
   - Team must have leader
   - Jury must have name, email, phone
   - marks.teamId, marks.juryId, marks.session required
   - **[PHASE 3]** jury_sessions.juryId, jury_sessions.sessionId required

### Business Logic (Updated)
1. **[CHANGED - PHASE 3]** Jury can be in **multiple sessions** simultaneously via junction table
2. Each team assigned to one jury member (teams.juryId) - global, not session-specific
3. **[PHASE 1]** Locked marks cannot be edited (locked = true)
4. Jury can only enter marks in started sessions (startedAt < NOW)
5. Jury cannot enter marks in ended sessions (endedAt < NOW)
6. Cannot create duplicate marks for same team-jury-session combo
7. **[PHASE 1]** Session end auto-locks all marks in that session
8. **[PHASE 3]** Marks are session-specific (same team can be marked by same jury in different sessions)

---

## 8. RESOLVED ISSUES & CURRENT STATE

### Issues Resolved in Phase 3
1. ✅ **Multi-session support** - Jury can now be assigned to multiple sessions via junction table
2. ✅ **Session isolation** - Marks properly isolated per session
3. ✅ **Team assignment flexibility** - Same jury can have different teams in different sessions
4. ✅ **Historical record** - Junction table entries preserved after session ends

### Issues Resolved in Phase 2
1. ✅ **Team assignment during creation** - Multi-step form with team assignment step
2. ✅ **Team reassignment** - Can reassign teams even after session started
3. ✅ **Search & pagination** - Enhanced team selection UI with filters

### Issues Resolved in Phase 1
1. ✅ **Editable marks** - Marks can be edited until locked
2. ✅ **Manual locking** - Jury can lock marks when finalized
3. ✅ **Auto-locking** - All marks locked when session ends
4. ✅ **UI indicators** - Lock status visible in badges and disabled fields

### Current Architecture Strengths
- **Scalable**: Junction table supports unlimited sessions per jury
- **Secure**: Multiple security checks before accessing session/teams
- **Flexible**: Teams can be reassigned, marks can be locked/unlocked
- **Isolated**: Marks properly separated by session context
- **Auditable**: Historical assignments preserved in junction table

### Known Limitations
1. **Teams are global** - teams.juryId not session-specific (one jury per team across all sessions)
2. **No soft deletes** - All deletions are permanent
3. **Hardcoded criteria** - 4 marking criteria hardcoded (Phase 4 will address)
4. **No batch operations** - Marks entered one team at a time

---

## 9. API/ACTION LAYER (Updated)

### Server Actions (`src/actions/`)

**sessionActions.ts**:
- `addSessionAction()` - Create + assign jury
- `startSessionAction()` - Set startedAt
- `endSessionAction()` - Set endedAt + cleanup
- `deleteSessionAction()` - Delete session
- `shuffleStudentsAction()` - Shuffle teams

**marks.ts**:
- `submitMarks()` - Create mark + cleanup + revalidate

**sessionActions.ts**:
- `addSessionAction()` - **[PHASE 2 & 3]** Create session, assign jury via junction table, assign teams
- `startSessionAction()` - Set startedAt
- `endSessionAction()` - **[PHASE 1]** Set endedAt + auto-lock all marks
- `deleteSessionAction()` - **[PHASE 3]** Delete session + cascade jury_sessions
- `shuffleStudentsAction()` - **[PHASE 2]** Shuffle teams with confirmation

**marks.ts**:
- `submitMarks()` - **[PHASE 1]** Create/update mark with lock validation
- `lockMarks()` - **[PHASE 1]** Lock individual mark
- `getExistingMark()` - **[PHASE 3]** Get mark by teamId, juryId, sessionId

**juryForm.ts**:
- `addJuryAction()` - **[PHASE 3]** Create jury + assign to multiple sessions
- `updateJurySessionsAction()` - **[PHASE 3]** Edit jury session assignments

**jury-teams.ts**:
- `reassignTeamsAction()` - **[PHASE 2]** Reassign teams to different jury

### Page Revalidation (Updated)
After actions, these pages revalidate:
- `/home` - **[PHASE 3]** Jury dashboard with session tabs
- `/home/session/[sessionId]` - **[PHASE 3]** Session team view
- `/dashboard/marks` - Admin marks view
- `/dashboard/sessions` - Session stats
- `/dashboard/jury` - **[PHASE 3]** Jury table with session badges
- `/dashboard/teams/reassign/[sessionId]` - **[PHASE 2]** Team reassignment page

---

## 10. COMPONENT ARCHITECTURE (New Components)

### Phase 3 Components

#### **JurySessionsView2.tsx** (Jury Home Page)
- **Purpose**: Main dashboard for jury members showing all assigned sessions
- **Features**:
  - Three tabs: Ongoing (green), Upcoming (blue), Past (gray)
  - Session cards with name, dates, team count, status
  - Lock icons on non-started sessions
  - Click navigation to session detail (only for started sessions)
- **Data Flow**: getSessionsForJury() → Group by status → Display in tabs

#### **SessionTeamsView.tsx** (Session Detail Page)
- **Purpose**: Show teams assigned to jury in specific session
- **Features**:
  - Security checks (auth, assignment, session status)
  - Stats cards: Total/Marked/Locked/Pending
  - Search bar with filtering
  - Team grid with status badges
  - Lock status indicators
- **Data Flow**: getTeamsWithData() → Filter by juryId → Display with marks status

#### **EditJurySessionsDialog.tsx** (Admin)
- **Purpose**: Edit session assignments for existing jury
- **Features**:
  - Multi-select checkboxes for sessions
  - Shows current assignments
  - Smart add/remove logic
  - Success/error toasts
- **Action**: updateJurySessionsAction()

### Phase 2 Components

#### **AddSessionForm/** (Multi-Step Session Creation)
- **SessionDetailsStep.tsx**: Enter session name
- **JurySelectionStep.tsx**: **[PHASE 3 UPDATED]** Multi-select jury (no longer limited to unassigned)
- **TeamAssignmentStep.tsx**: Assign teams to jury (manual or shuffle)
- **HeaderStats.tsx**: Show progress through steps
- **Features**:
  - Search and filter teams
  - Pagination (50 per page)
  - Debounced search (300ms)
  - Confirmation dialogs

#### **ReassignTeamsForm.tsx** (Team Reassignment)
- **Purpose**: Reassign teams after session started
- **Features**:
  - Manual assignment per team
  - Bulk shuffle option
  - Warning if marks exist
  - Preserve existing marks
- **Route**: `/dashboard/teams/reassign/[sessionId]`

### Phase 1 Components

#### **marks-dialog.tsx** (Enhanced with Lock Feature)
- **Features Added**:
  - Lock status badge in header
  - Disabled fields when locked
  - "Lock Marks" button
  - Pre-fill existing marks
  - Session-specific mark fetching
- **Props**: existingMark (includes locked status)

---

## 11. ROUTING STRUCTURE

### Jury Routes (Updated)
```
/login → Jury login page
/home → **[PHASE 3]** Session tabs dashboard (JurySessionsView2)
/home/session/[sessionId] → **[PHASE 3]** Session team view (SessionTeamsView)
```

### Admin Routes
```
/dashboard → Admin overview
/dashboard/sessions → Session management
/dashboard/jury → **[PHASE 3]** Jury table with session badges
/dashboard/teams → Team management
/dashboard/teams/reassign/[sessionId] → **[PHASE 2]** Team reassignment
/dashboard/marks → Marks overview
/dashboard/participants → Participant management
```

---

## 12. FEATURE IMPLEMENTATION TIMELINE

### ✅ Phase 1: Editable Marks with Lock Feature (Completed)
- Added `locked` field to marks table
- Implemented `lockMarks()` action
- Auto-lock on session end
- UI indicators for locked status
- Form validation for locked marks

### ✅ Phase 2: Enhanced Session Creation (Completed)
- Multi-step session creation form (3 steps)
- Team assignment during creation
- Search, filters, pagination
- Team reassignment anytime
- Confirmation dialogs

### ✅ Phase 3: Multi-Session Jury Support (Completed)
- Created `jury_sessions` junction table
- Migrated from one-to-one to many-to-many
- Refactored 10+ utility functions
- New jury home page with tabs
- Session detail page with search
- Edit sessions dialog
- Restored lock feature in new UI

### ⏳ Phase 4: Dynamic Criteria System (Planned)
- Replace hardcoded 4 criteria
- New `criteria` table
- Redesign `marks` table (generic scores)
- Admin UI for criteria management
- Dynamic marking interface

### ⏳ Phase 5: UI/UX Polish (Planned)
- Loading states
- Animations
- Mobile responsiveness
- Accessibility improvements

---

## 13. SECURITY CONSIDERATIONS

### Authentication
- NextAuth.js with credentials provider
- Passwords hashed with bcrypt
- Session stored in encrypted cookie
- Role-based access (admin vs jury)

### Authorization Checks (Phase 3)
1. **Jury Home Page**: Verify logged in
2. **Session Detail Page**: 
   - Verify logged in
   - Verify jury assigned to session (via jury_sessions)
   - Verify session started
   - Verify session not ended
3. **Marks Submission**:
   - Verify jury ID matches session user
   - Verify mark not locked
   - Verify session active

### Data Isolation (Phase 3)
- Marks filtered by session context
- Teams filtered by jury assignment
- Junction table ensures proper access control
- No data leaks between sessions

---

## 14. MIGRATION NOTES

### Phase 3 Migration (jury.session → jury_sessions)
```sql
-- Migration: 0003_vengeful_pretty_boy.sql
-- Created junction table
CREATE TABLE jury_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  juryId INT NOT NULL,
  sessionId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (juryId) REFERENCES jury(id) ON DELETE CASCADE,
  FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_jury_session (juryId, sessionId)
);

-- Old data migration (if needed):
-- INSERT INTO jury_sessions (juryId, sessionId)
-- SELECT id, session FROM jury WHERE session IS NOT NULL;

-- Note: jury.session field deprecated but kept for backward compatibility
```

---

## 15. TESTING COVERAGE

### Phase 3 Testing (20 Test Cases)
See [docs/phase3-testing-guide.md](./phase3-testing-guide.md) for comprehensive testing checklist covering:
- Multi-session creation and assignment
- Session statistics accuracy
- Team and marks isolation
- Cascade deletions
- Security checks
- UI functionality
- Performance testing

### Phase 1 Testing (8 Test Cases)
See [docs/phase1-testing-guide.md](./phase1-testing-guide.md) for lock feature testing.

---

## 16. NEXT STEPS & FUTURE ENHANCEMENTS

### Immediate (Phase 4 - Critical)
1. **Dynamic Criteria System**: Replace hardcoded marking criteria
   - New database schema for criteria
   - Admin UI for criteria management
   - Dynamic marks table structure
   - Data migration for existing marks

### Short Term (Phase 5)
1. UI/UX improvements
2. Performance optimizations
3. Mobile responsiveness
4. Accessibility enhancements

### Long Term (Future Phases)
1. Export functionality (PDF reports)
2. Analytics dashboard
3. Email notifications
4. Bulk operations
5. Advanced filtering and sorting
6. Session templates
7. Audit logs

---

**Document Version**: 2.0 (Phase 3 Complete)  
**Last Updated**: January 16, 2026  
**System**: EvalEase v0.3.0  
**Authors**: Development Team  
**Status**: Production Ready (Phases 1-3), Phase 4 Planning
