# EvalEase System Architecture Documentation

## Overview
EvalEase is a Next.js-based evaluation management system that handles session management for jury-based team evaluation and marks/scoring entry. The system manages the complete lifecycle of evaluation sessions, jury assignments, and team scoring.

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
- session: FK → sessions.id (nullable, cascade on delete)
- phoneNumber: string (max 20)
- role: string (default: 'jury')
- createdAt: timestamp
- updatedAt: timestamp
```
**Purpose**: Represents jury members who evaluate teams. Each jury member is assigned to ONE session at a time.

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
- createdAt: timestamp
- updatedAt: timestamp
```
**Purpose**: Stores evaluation scores. Unique constraint: (teamId, juryId, session) - Each jury member scores each team only once per session.

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

### Session Lifecycle

```
┌─────────────┐
│   CREATE    │  Admin creates new session with name
│  SESSION    │  (startedAt & endedAt are NULL)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  ASSIGN JURY    │  Admin assigns available jury members to session
│  MEMBERS        │  Updates jury.session = session.id
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   START SESSION │  Admin clicks "Start"
│                 │  Sets sessions.startedAt = NOW()
└──────┬──────────┘
       │
       ▼
┌──────────────────────┐
│  SHUFFLE/ASSIGN      │  Admin can shuffle team assignments
│  TEAMS TO JURY       │  Updates teams.juryId to distribute teams
└──────┬───────────────┘
       │
       ▼ (Jury members now see assigned teams)
┌──────────────────────┐
│  JURY EVALUATES      │  Jury enters marks for assigned teams
│  TEAMS & ENTERS      │  Creates marks records with 4 scores
│  MARKS               │  Can mark as submitted when ready
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   END SESSION        │  Admin clicks "End"
│                      │  Sets sessions.endedAt = NOW()
│                      │  Removes jury from session (jury.session = NULL)
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   SESSION CLOSED     │  Marks are finalized
│                      │  Jury can no longer enter/edit marks
└──────────────────────┘
```

### Key Relationships

1. **Session → Jury (1:N)**
   - One session has many jury members
   - Jury members assigned via: `jury.session = sessions.id`

2. **Session → Marks (1:N)**
   - One session contains many mark records
   - Filter via: `marks.session = sessions.id`

3. **Jury → Teams (1:N)**
   - One jury member evaluates multiple teams
   - Assignment via: `teams.juryId = jury.id`

4. **Team → Marks (1:N)**
   - One team receives scores from multiple jury members
   - Tracked via: `marks.teamId = teams.id`

---

## 3. MARKS ENTERING SYSTEM (JURY SIDE)

### Jury Member Journey

#### **Step 1: Authentication**
```typescript
// Jury member logs in via credentials
Email + Password → Verify in creds table → Get jury.id and jury.session
Session is stored in NextAuth session: session.user.session = jury.session
```

#### **Step 2: Home Page (Jury Dashboard)**
**File**: `src/app/home/page.tsx`

```typescript
// Flow:
1. Get current jury from auth session → jury.id and jury.session
2. Get session details from jury.session
3. Check if session.startedAt exists AND session.endedAt is NULL
   (Only show teams if session is active)
4. Fetch teams assigned to this jury → getTeamsForJury(jury.id)
5. Display teams in List2 component for marking
```

#### **Step 3: View Teams to Evaluate**
**Component**: `src/components/list2.tsx`

```typescript
// Displays:
- All teams assigned to jury (via teams.juryId = jury.id)
- For each team:
  - Team name, room, members
  - Button to open marks dialog
  - Status of marks (submitted or pending)
```

#### **Step 4: Enter Marks for Each Team**
**Component**: `src/components/marks-dialog.tsx`

```typescript
Form Fields:
┌─────────────────────┐
│ Innovation Score    │  0-10 (required)
│ Presentation Score  │  0-10 (required)
│ Technical Score     │  0-15 (required)
│ Impact Score        │  0-15 (required)
│ Submit Button       │
└─────────────────────┘

On Submit:
1. Validate all scores are in range
2. Call submitMarks() action with:
   - teamId
   - juryId
   - session
   - all 4 scores
   - submitted = true
```

#### **Step 5: Submit Marks (Server Action)**
**File**: `src/actions/marks.ts`

```typescript
export async function submitMarks(markData: MarkData) {
  // Validation:
  1. Check session hasn't ended (session.endedAt === null)
  2. Validate all foreign key relations exist
  3. Prevent duplicate marks (team-jury-session must be unique)
  
  // Database Operations:
  1. INSERT into marks table
  2. UPDATE teams.juryId = NULL (mark as processed)
  3. Revalidate pages:
     - /home (jury dashboard)
     - /dashboard/marks (admin marks view)
     - /dashboard/sessions (admin session view)
}
```

### Marks Validation

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

### Session Timing Protection

```typescript
// Jury can only enter marks if:
1. Session is STARTED (session.startedAt != NULL)
2. Session is NOT ENDED (session.endedAt == NULL)

// If session ends:
// - New marks cannot be created
// - Jury is removed from session (jury.session = NULL)
// - Jury dashboard shows no teams
```

---

## 4. ADMIN SESSION MANAGEMENT

### Key Admin Operations

#### **Create Session**
```typescript
// Input: Session name
// Action: createSession({ session: { name: "string" } })
// Result: Creates empty session with startedAt & endedAt = NULL
// Jury members can then be assigned
```

#### **Assign Jury to Session**
```typescript
// Input: sessionId, selectedJury[]
// Action: For each juryId in selectedJury:
//   updateJurySession({ juryId, sessionId })
// Result: jury.session = sessionId for each selected jury
// Only unassigned jury (jury.session = NULL) can be selected
```

#### **Start Session**
```typescript
// Action: updateSession({ sessionId, updates: { startedAt: new Date() } })
// Result: 
// - session.startedAt is set
// - Jury members can now see teams
// - Marks can be entered
```

#### **Shuffle Teams**
```typescript
// Action: shuffleTeamsInSession(sessionId)
// Algorithm:
// 1. Get all jury members in session
// 2. Get all teams
// 3. Distribute teams evenly among jury members
// 4. Update each team: teams.juryId = assignedJuryId
// Constraint: Each team assigned to exactly ONE jury member
```

#### **End Session**
```typescript
// Action: endSessionAction(sessionId)
// Result:
// - session.endedAt = NOW()
// - For each jury member in session:
//   - jury.session = NULL (remove from session)
// - No more marks can be entered
```

#### **Delete Session**
```typescript
// Action: deleteSession(sessionId)
// Result:
// - Delete all marks for session: marks.session = sessionId
// - Remove jury from session: jury.session = NULL
// - Delete session record
// Cascade delete protects referential integrity
```

---

## 5. DATA FLOW DIAGRAMS

### Session Creation & Team Assignment

```
ADMIN CREATES SESSION
       │
       ▼
┌──────────────────────────────┐
│ 1. createSession()           │
│    → new sessions record     │
│    → startedAt: NULL         │
│    → endedAt: NULL           │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ 2. ADMIN SELECTS JURY        │
│    → Show available jury     │
│    → (where jury.session=NULL)
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ 3. updateJurySession()       │
│    → jury.session = sessionId│
│    → Multiple jury records   │
│    → updated               │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
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
│ - Validation on input        │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ submitMarks() Server Action  │
│ 1. Validate session active   │
│ 2. Validate relations exist  │
│ 3. Check no duplicates       │
│ 4. INSERT into marks         │
│ 5. UPDATE teams.juryId=NULL  │
│ 6. Revalidate paths          │
└──────────────────────────────┘
```

---

## 6. KEY UTILITY FUNCTIONS

### Session Utils (`src/db/utils/sessionUtils.ts`)

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `getSessions()` | Get all sessions | - | `sessionDBType[]` |
| `getSessionById()` | Get single session | sessionId | `sessionDBType \| null` |
| `createSession()` | Create new session | `{ name: string }` | `sessionDBType[]` |
| `updateSession()` | Update session | sessionId, updates | `sessionDBType \| null` |
| `deleteSession()` | Delete session + cleanup | sessionId | `boolean` |
| `getSessionStats()` | Get marks statistics | sessionId | Stats object |
| `shuffleTeamsInSession()` | Distribute teams | sessionId | `boolean` |

### Jury Utils (`src/db/utils/juryUtils.ts`)

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `getJury()` | Get jury members | Filters (id, email, session) | `juryDBType[]` |
| `createJury()` | Create new jury | jury data + password | `juryDBType[]` |
| `updateJury()` | Update jury | jury data with id | `juryDBType[]` |
| `deleteJury()` | Delete jury | juryId | `boolean` |
| `assignJuryToSession()` | Assign to session | juryId, sessionId | `boolean` |
| `removeJuryFromSession()` | Remove from session | juryId | `boolean` |
| `getJuryBySession()` | Get jury in session | sessionId | `juryDBType[]` |

### Marks Utils (`src/db/utils/marksUtils.ts`)

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `getMarks()` | Get marks (filtered) | Filters (id, teamId, juryId, session) | `MarksDBType[]` |
| `createMark()` | Create new mark | mark data | `MarksDBType[]` |
| `updateMark()` | Update mark | mark data with id | `MarksDBType[]` |
| `deleteMark()` | Delete mark | markId | `boolean` |
| `getMarksWithData()` | Get marks + relations | Filters | Complex object with team/jury/session data |
| `validateMarkRelations()` | Validate foreign keys | teamId, juryId, session | `boolean` |
| `isJuryMarkingComplete()` | Check if jury done | juryId, session | `boolean` |
| `getTeamsToMarkByJury()` | Get pending teams | juryId, session | `number[]` (team IDs) |

---

## 7. IMPORTANT CONSTRAINTS

### Database Level
1. **Unique Constraints**:
   - `(marks.teamId, marks.juryId, marks.session)` - One mark per team-jury-session
   - Emails unique in jury, participants, admin, creds

2. **Foreign Key Constraints**:
   - Cascade delete: teams, marks, teamMembers (if parent deleted)
   - Set null: jury.session, teams.juryId (if parent deleted)

3. **Not Null Constraints**:
   - All mark scores must be provided
   - Team must have leader
   - Jury must have name, email, phone
   - marks.teamId, marks.juryId, marks.session required

### Business Logic
1. Only one jury member per jury record at a time (jury.session is singular)
2. Each team assigned to one jury member per session (teams.juryId)
3. Jury can only enter marks during active session
4. Cannot create duplicate marks for same team-jury-session combo
5. Session must be started before jury sees teams
6. Session must not be ended before new marks can be entered

---

## 8. CURRENT ISSUES & OBSERVATIONS

### Potential Issues Found
1. **jury.session nullable but design assumes one session** - Consider if jury can be in multiple sessions simultaneously (currently can't)

2. **teams.juryId assignment** - Currently done via `shuffleTeamsInSession()`. Ensure teams are never left without assignment if needed

3. **Duplicate prevention** - Relies on database unique constraint. No frontend-side prevention before user inputs

4. **Session timing edge cases** - What if jury submits mark right as admin ends session? Timing race condition possible

5. **Team-jury reassignment** - Currently `updateTeamjury()` sets `juryId = NULL` after mark submitted. Ensures team not marked twice

### Data Quality Notes
- Jury can be unassigned from session but still have marks in that session (marks not deleted)
- Teams can be reassigned to different jury members (juryId can change)
- No soft deletes implemented - all deletes are permanent

---

## 9. API/ACTION LAYER

### Server Actions (`src/actions/`)

**sessionActions.ts**:
- `addSessionAction()` - Create + assign jury
- `startSessionAction()` - Set startedAt
- `endSessionAction()` - Set endedAt + cleanup
- `deleteSessionAction()` - Delete session
- `shuffleStudentsAction()` - Shuffle teams

**marks.ts**:
- `submitMarks()` - Create mark + cleanup + revalidate

**juryForm.ts**:
- `addJuryAction()` - Create jury member

### Page Revalidation
After mark submission, these pages revalidate:
- `/home` - Jury dashboard refreshes
- `/dashboard/marks` - Admin marks view updates
- `/dashboard/sessions` - Session stats update

---

## 10. NEXT STEPS FOR CHANGES

Before making changes, consider:
1. **What is the current workflow issue?** - Session management or marks entry?
2. **What are the constraints?** - Can jury be in multiple sessions? Can one team be marked by multiple jury?
3. **What should change?** - Timing, rules, data model, UI flow?
4. **Data migration** - If schema changes, how do existing records migrate?

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-15  
**System**: EvalEase v0.1.0
