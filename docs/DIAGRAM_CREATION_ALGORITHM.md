# Detailed Algorithm to Create Full Diagram Set for EvalEase

## Scope

This algorithm is specific to the EvalEase architecture (Next.js monolith, Drizzle ORM, MySQL, role-based auth, session-based jury evaluation).

Target outputs:

- Use Case Diagram
- Class Diagram
- Sequence Diagram
- Activity Diagram
- Collaboration Diagram
- Package Diagram
- Deployment Diagram
- Zero Level DFD (Context)
- Level 1 DFD
- Level 2 DFD
- Entity Relationship Diagram
- Data Dictionary

Note: The request listed Zero Level DFD twice. This guide includes it once as a single context-level DFD.

---

## Global Meta-Algorithm (Run Before Any Diagram)

### Step G1: Build Source Inventory

1. Read architecture and scope docs.
2. Read schema definitions and migration snapshots.
3. Read auth and middleware logic.
4. Read session and marks server actions.
5. Read deployment config (Docker Compose, Dockerfile).

### Step G2: Extract Canonical Project Facts

1. Actors: Admin, Jury, Participant (indirect data actor).
2. Core entities: Session, Jury, JurySession, Team, Participant, TeamMember, Mark, Credential, Admin.
3. Core functional blocks:

- Authentication & authorization
- Master data management
- Session lifecycle
- Team assignment/shuffle
- Marks lifecycle
- Reporting/export

4. Runtime/deployment units:

- Browser client
- Next.js app container/service
- MySQL container/service
- Persistent DB volume

### Step G3: Define Naming Dictionary

Create one canonical name list and reuse exact terms in all diagrams:

- Session (not EventRound)
- JurySession (junction table)
- Mark (singular)
- TeamMember (junction)
- Credentials (auth store)

### Step G4: Consistency Rules

Before finalizing any diagram:

1. Entity names must match schema names or accepted domain aliases.
2. Relationship direction must be consistent across Class, ER, and DFD.
3. Sequence + Activity must represent the same business flow semantics.
4. Deployment components must match actual runtime topology.

---

## 1) Use Case Diagram Algorithm

### Goal

Represent external actors and the functional services they invoke in EvalEase.

### Algorithm

1. Place actors outside system boundary:

- Admin
- Jury
- Participant (optional if only data-maintenance role is represented)

2. Draw system boundary named EvalEase.
3. Add core use cases inside boundary:

- Login
- Manage Session
- Manage Jury/Teams/Participants
- Shuffle Team Assignment
- Start Session
- End Session
- Submit Marks
- Lock/Unlock Marks
- View Results
- Export Reports

4. Connect actors to use cases:

- Admin -> all management, session lifecycle, reporting
- Jury -> login, submit marks, lock marks, view assigned sessions/results

5. Add include/extend where applicable:

- End Session includes Lock All Marks
- Submit Marks extends Validate Session State

6. Validate with real code behavior:

- Session actions and marks actions should map to at least one use case each.

### Completion Checks

- Every major feature in dashboard/home actions is represented.
- No use case is unowned by an actor.
- Boundary is explicit and labeled.

---

## 2) Class Diagram Algorithm

### Goal

Model domain classes and structural relationships.

### Algorithm

1. Create classes from domain entities:

- Session, Jury, JurySession, Team, Participant, TeamMember, Mark, Credential, Admin

2. For each class add key attributes:

- IDs, FKs, core business fields, lock/submitted flags for marks

3. Define associations with multiplicity:

- Session 1..* JurySession
- Jury 1..* JurySession
- Jury 1..* Team (via assignment)
- Team 1..* TeamMember
- Participant 1..* TeamMember
- Team 1..* Mark
- Jury 1..* Mark
- Session 1..* Mark

4. Model junctions explicitly:

- JurySession as Session<->Jury bridge
- TeamMember as Team<->Participant bridge

5. Optional behavior compartment:

- Session: start(), end(), publishDraft()
- Mark: lock(), unlock(), submit(), updateScores()

### Completion Checks

- All schema-level entities are represented.
- All FKs reflected in edges.
- Multiplicities are present on every non-trivial association.

---

## 3) Sequence Diagram Algorithm

### Goal

Show time-ordered interactions for critical runtime workflows.

### Primary Scenario

Jury submits marks.

### Algorithm

1. Define lifelines:

- Jury UI
- Server Action (marks action)
- Session Utils
- Marks Utils
- Database (MySQL)

2. Add messages in strict order:

- submitMarks(payload)
- getSessionById(session)
- session state result
- getMarks(team,jury,session)
- existing mark result
- createMark or updateMark
- revalidate paths
- success response

3. Add guard/alt frames:

- if session ended -> reject update
- if mark locked -> reject edit
- else create/update mark

4. Optional second sequence:

- End Session -> lockAllMarksForSession -> update session endedAt

### Completion Checks

- Message order matches server action logic.
- Alternate branches for lock/session-ended are explicit.
- DB interactions are represented for reads and writes.

---

## 4) Activity Diagram Algorithm

### Goal

Model workflow/state progression for session evaluation lifecycle.

### Algorithm

1. Start node.
2. Add actions:

- Create Session
- Assign Jury
- Assign/Shuffle Teams
- Start Session
- Jury Evaluates Teams
- Submit/Update Marks

3. Add decision:

- Session ended?

4. If No:

- Continue evaluation loop

5. If Yes:

- Lock marks
- Close session

6. End node.
7. Add optional swimlanes:

- Admin lane
- Jury lane
- System lane

### Completion Checks

- Has at least one decision and one loop.
- Covers start and end explicitly.
- Aligns with session start/end semantics in actions.

---

## 5) Collaboration Diagram Algorithm

### Goal

Show object collaboration and numbered message flow.

### Algorithm

1. Place collaborating objects:

- JuryUI, marksAction, dbUtils/sessionUtils, MySQL

2. Draw links between interacting objects.
3. Number messages by order:

- 1 submitMarks
- 2 validate session / fetch mark
- 3 create/update
- 4 return status

4. Add condition labels on links where needed (locked/session-ended guards).

### Completion Checks

- Numbered messages are unambiguous.
- Collaboration nodes match sequence diagram participants.

---

## 6) Package Diagram Algorithm

### Goal

Represent module-level organization and dependencies.

### Algorithm

1. Define packages:

- app
- components
- actions
- db/utils
- db/schema
- lib
- zod

2. Add dependency arrows:

- app -> components
- components -> actions
- actions -> db/utils
- db/utils -> db/schema
- app/actions -> lib (auth/middleware)
- actions -> zod (validation)

3. Mark dependency semantics labels:

- uses, invokes, validates, guards

### Completion Checks

- Package graph is acyclic at high-level (if possible).
- Every package has at least one relation except leaves.

---

## 7) Deployment Diagram Algorithm

### Goal

Show physical/runtime deployment architecture.

### Algorithm

1. Add runtime nodes:

- Client Browser Node
- App Node (Next.js runtime)
- DB Node (MySQL)
- Storage Node (volume)

2. Map communication channels:

- Browser -> App (HTTPS)
- App -> DB (TCP 3306)
- DB -> Volume (persistent storage)

3. Add environment notes:

- Docker bridge network
- health checks
- environment variables

### Completion Checks

- Every runtime component from compose file is present.
- Connectivity directions/protocols are labeled.

---

## 8) Zero Level DFD (Context Diagram) Algorithm

### Goal

Represent the system as one process with external entities and major flows.

### Algorithm

1. Add external entities:

- Admin
- Jury

2. Add one process:

- EvalEase Evaluation System

3. Add high-level flows:

- Admin -> system: session/team configuration
- System -> Admin: reports/analytics
- System -> Jury: assigned sessions/teams/forms
- Jury -> system: marks submission

### Completion Checks

- Exactly one central process.
- No data stores at level 0.

---

## 9) Level 1 DFD Algorithm

### Goal

Decompose context process into major subsystems.

### Algorithm

1. Create subprocesses:

- P1 Auth
- P2 Session Management
- P3 Team Assignment
- P4 Marks Processing
- P5 Reporting

2. Add data stores:

- D1 Credentials
- D2 Sessions
- D3 Teams/Jury/Participants
- D4 Marks

3. Connect processes to relevant data stores.
4. Add inter-process flows where business requires handoff.

### Completion Checks

- Every subprocess has at least one inbound/outbound flow.
- Stores align with schema domains.

---

## 10) Level 2 DFD Algorithm

### Goal

Decompose one level-1 process in detail (recommend P4 Marks Processing).

### Algorithm

1. Break P4 into sub-processes:

- 4.1 Validate Session State
- 4.2 Fetch Existing Mark
- 4.3 Create/Update Mark
- 4.4 Apply Lock/Unlock Rule
- 4.5 Revalidate Views and Return Status

2. Connect required data stores:

- D2 Sessions for state checks
- D4 Marks for read/write/lock flag

3. Add flow directions and labels:

- read session, read mark, write mark, update lock

4. Add rejection branches:

- session ended -> reject
- locked mark -> reject

### Completion Checks

- Level 2 process labels map back to level-1 parent process.
- Includes both success and rejection pathways.

---

## 11) Entity Relationship Diagram Algorithm

### Goal

Represent database structure with PK/FK and cardinality.

### Algorithm

1. Add entities/tables:

- sessions, jury, jury_sessions, users(participants), teams, team_members, marks, creds, admin

2. Annotate keys:

- PK for each table
- FK for all references

3. Add cardinality edges:

- sessions 1..* jury_sessions
- jury 1..* jury_sessions
- participants 1..* teams (leaderId relation)
- teams 1..* team_members
- participants 1..* team_members
- teams 1..* marks
- jury 1..* marks
- sessions 1..* marks

4. Optionally annotate constraints:

- unique emails
- logical uniqueness of mark by (team, jury, session)

### Completion Checks

- Every FK has a corresponding relationship line.
- Junction tables are explicitly represented.

---

## 12) Data Dictionary Algorithm

### Goal

Create a structured table-level and field-level dictionary for all persisted data.

### Dictionary Schema

For each table, define:

1. Field name
2. Data type
3. Nullability
4. Key type (PK/FK/Unique)
5. Default value
6. Description (business meaning)
7. Validation/constraints
8. Used by modules/actions

### Algorithm

1. Enumerate tables from schema.
2. For each table, parse every field.
3. Mark PK/FK/unique/default constraints.
4. Map FK to referenced table/field.
5. Map fields to business usage (forms, actions, reports).
6. Add computed/business fields if relevant (for docs only).
7. Publish in markdown sections:

- Table overview
- Column dictionary
- Relationships
- Lifecycle notes

### Minimum Fields to Include (EvalEase)

- sessions: id, name, startedAt, endedAt, isDraft, publishedAt, createdAt, updatedAt
- jury: id, name, email, phoneNumber, role, timestamps
- jury_sessions: id, juryId, sessionId, timestamps
- users(participants): id, name, email, institude, phoneNumber, timestamps
- teams: id, teamName, leaderId, juryId, room, timestamps
- team_members: id, teamId, memberId, timestamps
- marks: id, teamId, juryId, session, scores, submitted, locked, timestamps
- creds: id, email, role, password
- admin: id, name, email, timestamps

### Completion Checks

- 100% table coverage from schema.
- 100% column coverage per table.
- Every FK described with parent relation.

---

## Final Validation Algorithm (Whole Set)

1. Create a matrix with rows = entities/processes and columns = diagrams.
2. Ensure each critical concept appears where expected:

- Mark appears in Class, Sequence, DFD L1/L2, ER, Dictionary
- Session lifecycle appears in Use Case, Activity, Sequence, DFD

3. Verify naming consistency (no duplicate aliases unless documented).
4. Verify runtime consistency:

- Deployment links must reflect actual app-to-DB channel.

5. Add assumptions section for inferred details.
6. Add version/date stamp and source file references.

---

## Suggested Output Folder Structure

- docs/diagrams-drawio/
  - 01-use-case-diagram.drawio
  - 02-use-case-scenarios.drawio
  - 03-class-diagram.drawio
  - 04-sequence-diagram.drawio
  - 05-activity-diagram.drawio
  - 06-collaboration-diagram.drawio
  - 07-package-diagram.drawio
  - 08-deployment-diagram.drawio
  - 09-dfd-level-0.drawio
  - 10-dfd-level-1.drawio
  - 11-dfd-level-2.drawio
  - 12-er-diagram.drawio
- docs/
  - DATA_DICTIONARY.md
  - PROJECT_DIAGRAM_ANALYSIS.md
  - DIAGRAM_CREATION_ALGORITHM.md

---

## Optional Automation Algorithm

1. Keep one generator script per notation family:

- UML generator
- DFD generator
- ER generator

2. Store canonical metadata in JSON/YAML.
3. Generate `.drawio` from metadata.
4. Run validation script to check:

- file exists
- contains vertices/edges
- symbol style constraints satisfied

5. Regenerate on schema/action updates.
