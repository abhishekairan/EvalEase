# Tech Stack Analysis - EvalEase

**Document Version**: 1.0  
**Created**: January 15, 2026  
**Status**: Discovery Complete

---

## 1. CORE TECHNOLOGY STACK

### Framework & Runtime
- **Next.js**: v15.5.9 (Latest, App Router)
- **React**: v19.1.0
- **Node.js**: TypeScript 5.x
- **Build Tool**: Turbopack (Next.js default)

### Database & ORM
- **Database**: MySQL (via mysql2 driver v3.14.1)
- **ORM**: Drizzle ORM v0.44.2
- **Schema Location**: `src/db/schema.ts`
- **Migrations**: Drizzle Kit v0.31.8 (migrations in `/drizzle` folder)
- **Connection**: Configured via environment variables in `drizzle.config.ts`

### Authentication
- **Library**: NextAuth.js v5.0.0-beta.25 (Auth.js)
- **Strategy**: JWT-based sessions
- **Session Duration**: 24 hours
- **Password Hashing**: bcryptjs v3.0.2
- **Auth Config**: `src/lib/auth.ts`
- **Session Storage**: JWT in cookies

### Component Library
- **UI Framework**: Radix UI (headless components)
- **Styling**: Tailwind CSS v4
- **Component Pattern**: Shadcn/ui style (components in `src/components/ui/`)
- **Icons**: Lucide React v0.513.0, Tabler Icons v3.34.0
- **Animations**: tw-animate-css

### Form Handling
- **Form Library**: React Hook Form v7.57.0
- **Validation**: Zod v3.25.64
- **Integration**: @hookform/resolvers v5.1.1
- **Schema Location**: `src/zod/` directory

### Data Tables
- **Table Library**: @tanstack/react-table v8.21.3
- **Export Functionality**: 
  - Excel: xlsx v0.18.5
  - CSV: file-saver v2.0.5

### State Management
- **Server State**: Server Actions (Next.js native)
- **Client State**: React useState/useContext
- **No external state library** (Redux, Zustand, etc.)

---

## 2. CODE STRUCTURE ANALYSIS

### Project Architecture Pattern
**Type**: Feature-based monolithic structure with clear separation of concerns

```
src/
├── actions/          # Server Actions (Next.js 15 pattern)
├── app/             # App Router pages & layouts
├── components/      # React components (UI + business logic)
├── db/              # Database layer
│   ├── schema.ts    # Drizzle schema definitions
│   └── utils/       # Database utility functions
├── lib/             # Shared utilities & auth
├── types/           # TypeScript type definitions
└── zod/             # Zod schemas for validation
```

### Key Architectural Patterns

#### 1. Database Layer Pattern
**Location**: `src/db/utils/`

**Pattern**: Utility-based data access layer
```
utils/
├── adminUtils.ts
├── juryUtils.ts
├── marksUtils.ts
├── participantsUtils.ts
├── sessionUtils.ts
└── index.ts (exports all)
```

**Characteristics**:
- Pure database functions (no business logic)
- Uses Drizzle ORM query builder
- Returns typed data (via Zod schemas)
- Handles CRUD operations only

**Example Function Pattern**:
```typescript
export async function getMarks({ id, teamId, juryId, session }: FilterParams) {
  // Build query with Drizzle
  // Apply conditional filters
  // Return typed data
}
```

#### 2. Server Actions Pattern
**Location**: `src/actions/`

**Pattern**: Business logic layer + API endpoints
```
actions/
├── marks.ts           # Marks submission logic
├── sessionActions.ts  # Session management
├── juryForm.ts       # Jury CRUD
├── teamForm.ts       # Team CRUD
└── participantForm.ts # Participant CRUD
```

**Characteristics**:
- Marked with `"use server"` directive
- Orchestrates multiple database calls
- Handles validation
- Calls `revalidatePath()` for cache invalidation
- Returns success/error objects

**Example Pattern**:
```typescript
export async function submitMarks(markData: MarkData) {
  // 1. Validate session state
  // 2. Call database utils
  // 3. Revalidate affected paths
  // 4. Return result
}
```

#### 3. Component Pattern
**Location**: `src/components/`

**Pattern**: Mixed presentational + container components
```
components/
├── ui/              # Pure UI components (shadcn/ui pattern)
├── Dialogs/         # Business logic dialogs
├── alerts/          # Confirmation dialogs
└── [feature].tsx    # Feature-specific components
```

**Characteristics**:
- Client components use `"use client"` directive
- Form handling with react-hook-form
- Toast notifications via sonner
- Dialog state management via useState

#### 4. Validation Pattern
**Location**: `src/zod/`

**Pattern**: Schema-first validation
```
zod/
├── marksSchema.ts      # Marks validation + types
├── sessionSchema.ts    # Session validation
├── teamSchema.ts       # Team validation
└── userSchema.ts       # User validation
```

**Characteristics**:
- Zod schemas define both validation AND types
- Exported as TypeScript types via `z.infer<>`
- Used in both client (forms) and server (actions)
- Example: `MarksFormSchema`, `MarksDBType`

---

## 3. CURRENT SYSTEM BEHAVIOR

### Marks Entry Workflow (Current State)

#### Step 1: Authentication
- Jury logs in via credentials provider
- `src/lib/auth.ts` handles auth
- Session callback fetches fresh jury data on every request
- Session includes: `{ id, email, name, role, session }`

#### Step 2: Home Page (`src/app/home/page.tsx`)
- Fetches jury data from session
- Checks if `session.startedAt !== null && session.endedAt === null`
- Calls `getTeamsForJury(jury.id)` to fetch assigned teams
- Displays teams via `List2` component

#### Step 3: Marks Entry (`src/components/marks-dialog.tsx`)
- Opens dialog with team details
- Form fields: 4 hardcoded criteria
  - Innovation Score (0-10)
  - Presentation Score (0-10)
  - Technical Score (0-15)
  - Impact Score (0-15)
- On submit: calls `submitMarks()` server action

#### Step 4: Server Action (`src/actions/marks.ts`)
```typescript
export async function submitMarks(markData: MarkData) {
  // 1. Check session.endedAt === null
  // 2. Call createMark() from marksUtils
  // 3. Call updateTeamjury({ teamid, juryId: null }) ← IMPORTANT
  // 4. Revalidate paths: /home, /dashboard/marks, /dashboard/sessions
}
```

**Key Observation**: After mark submission, `teams.juryId` is set to `NULL`
- This prevents jury from marking the same team twice
- Team disappears from jury's list after marking

#### Step 5: Database Validation (`src/db/utils/marksUtils.ts`)
```typescript
export async function createMark({ mark }) {
  // 1. validateMarkRelations() - check FK constraints
  // 2. Check for duplicate (teamId, juryId, session)
  // 3. Insert into marks table
}
```

**Constraints Enforced**:
- No duplicate marks for same team-jury-session
- All foreign keys must exist
- All 4 scores are required (NOT NULL in schema)

---

## 4. CURRENT DATA FLOW

### Jury Side (Marks Entry)

```
┌─────────────────────┐
│  JWT Session        │
│  - jury.id          │
│  - jury.session     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│  /home Page                 │
│  - getSession() from auth   │
│  - getSessionById(session)  │
│  - getTeamsForJury(juryId)  │ ← WHERE teams.juryId = jury.id
└──────────┬────────────────-─┘
           │
           ▼
┌─────────────────────────────┐
│  List2 Component            │
│  - Display assigned teams   │
│  - "Enter Marks" button     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  MarksDialog Component      │
│  - 4 hardcoded input fields │
│  - Zod validation           │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  submitMarks() Action       │
│  - Validate session active  │
│  - createMark()            │
│  - updateTeamjury(null)    │ ← Team removed from jury
│  - revalidatePath()        │
└─────────────────────────────┘
```

### Admin Side (Session Management)

```
┌─────────────────────────────┐
│  createSession()            │
│  - Insert sessions record   │
│  - startedAt = NULL         │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  assignJuryToSession()      │
│  - UPDATE jury.session = id │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  startSession()             │
│  - UPDATE startedAt = NOW() │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  shuffleTeamsInSession()    │
│  - Distribute teams to jury │
│  - UPDATE teams.juryId      │
└──────────┬──────────────────┘
           │
           ▼  (Jury now sees teams)
┌─────────────────────────────┐
│  endSession()               │
│  - UPDATE endedAt = NOW()   │
│  - UPDATE jury.session=NULL │
└─────────────────────────────┘
```

---

## 5. CRITICAL FINDINGS

### Key Database Constraints

1. **Unique Constraint on Marks**:
   ```typescript
   // Enforced in createMark() logic, not in schema
   // Check: (teamId, juryId, session) must be unique
   ```
   ⚠️ **Risk**: No database-level unique index. Relies on application logic.

2. **Team-Jury Assignment**:
   ```typescript
   teams.juryId // Can be NULL
   // Set to NULL after mark submission
   ```
   ⚠️ **Implication**: Team can be reassigned to different jury after marking.

3. **Jury-Session Relationship**:
   ```typescript
   jury.session // Nullable FK, set null on session delete
   // Currently 1:1 (one jury in one session at a time)
   ```
   ⚠️ **Limitation**: Jury cannot be in multiple sessions simultaneously.

### Current Validation Points

| Validation | Location | Type |
|------------|----------|------|
| Mark uniqueness | `marksUtils.ts:createMark()` | Application logic |
| FK constraints | `marksUtils.ts:validateMarkRelations()` | Application logic |
| Session active | `actions/marks.ts:submitMarks()` | Application logic |
| Score ranges | Zod schemas | Client + Server |
| Required fields | Drizzle schema | Database |

### Revalidation Strategy

Current cache invalidation on mark submission:
```typescript
revalidatePath("/home");              // Jury dashboard
revalidatePath("/dashboard/marks");   // Admin marks view
revalidatePath("/dashboard/sessions"); // Admin sessions
```

**Pattern**: Server-side revalidation using Next.js 15 cache APIs

---

## 6. DEPENDENCIES ANALYSIS

### Critical Dependencies for Feature Changes

#### For Dynamic Criteria (Change 5):
**Currently Hardcoded**:
- `src/db/schema.ts` - 4 score fields in marks table
- `src/components/marks-dialog.tsx` - 4 hardcoded form inputs
- `src/zod/marksSchema.ts` - 4 score validations
- Any report/export logic using these fields

**Search Pattern**: `innovationScore|presentationScore|technicalScore|impactScore`

#### For Multiple Sessions (Change 3):
**Currently Coupled**:
- `src/lib/auth.ts` - Session callback assumes single session
- `jury.session` field - Nullable FK (1 session only)
- `src/app/home/page.tsx` - Assumes single session from auth

**Search Pattern**: `jury.session`, `session.user.session`

#### For Editable Marks (Change 1):
**Currently Affected**:
- `src/actions/marks.ts:submitMarks()` - Sets submitted=true
- `updateTeamjury()` - Removes team after submit
- UI showing submitted state

**Search Pattern**: `submitted`, `updateTeamjury`

---

## 7. MIGRATION CONSIDERATIONS

### Database Migration Strategy

**Tool**: Drizzle Kit
**Location**: `/drizzle` folder
**Command**: `drizzle-kit generate` → `drizzle-kit migrate`

**Current Migration Files**:
- `0000_far_expediter.sql` - Initial schema
- `0001_grey_tempest.sql` - Schema update

**Pattern**: 
1. Modify `src/db/schema.ts`
2. Run `drizzle-kit generate` to create migration
3. Run `drizzle-kit migrate` to apply
4. Update TypeScript types automatically via Drizzle

### Breaking Change Impact Matrix

| Change | Schema Impact | Data Migration | Code Impact | Risk Level |
|--------|---------------|----------------|-------------|------------|
| Editable Marks | Add 1 field | None (nullable) | Low (isolated) | 🟢 Low |
| Team Selection UI | None | None | Medium (workflow) | 🟡 Medium |
| Multiple Sessions | New table or schema change | Complex | High (auth + queries) | 🔴 High |
| Dynamic Criteria | Major schema change | Complex | Very High | 🔴 Critical |
| UI Updates | None | None | Medium | 🟡 Medium |
| Better Marks View | None | None | Low | 🟢 Low |
| Dynamic Fetching | None | None | Low (refactor) | 🟢 Low |

---

## 8. RECOMMENDATIONS

### Implementation Sequence (Revised)

**Phase 1 - Non-Breaking Enhancements** (1-2 weeks):
1. ✅ Add `locked` field to marks (Change 1)
2. ✅ Implement better marks UI per session (Change 6)
3. ✅ Create dynamic fetching utilities (Change 7)
4. ✅ Update UI components (Change 4 - partial)

**Phase 2 - Workflow Changes** (2-3 weeks):
5. ✅ Add team selection during session creation (Change 2)
6. ✅ Update marks entry to allow editing
7. ✅ Test workflow end-to-end

**Phase 3 - Major Restructuring** (3-4 weeks):
8. ⚠️ Plan multiple sessions architecture (Change 3)
9. ⚠️ Migrate auth system if needed
10. ⚠️ Update all jury-facing queries

**Phase 4 - Dynamic Criteria** (4-6 weeks):
11. 🔴 Design criteria system architecture
12. 🔴 Create migration strategy for existing marks
13. 🔴 Implement criteria selection
14. 🔴 Update all dependent code
15. 🔴 Comprehensive testing

### Next Steps

1. **Create detailed implementation plans** for each phase
2. **Set up feature branches** for each major change
3. **Create backup strategy** before schema changes
4. **Plan rollback procedures** for each phase
5. **Document API changes** for team communication

---

**Document Status**: ✅ Complete  
**Next Document**: Implementation Plan - Phase 1  
**Responsible**: Development Team
