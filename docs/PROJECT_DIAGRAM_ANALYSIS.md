# EvalEase Project Analysis for UML/DFD/ER Diagrams

## System Summary

EvalEase is a monolithic Next.js 15 application for hackathon/event evaluations.

- Frontend: Next.js App Router + React + shadcn UI
- Backend: Next.js server actions + API routes
- Data layer: Drizzle ORM over MySQL
- Auth: NextAuth credentials with role-aware authorization
- Deployment: Docker Compose (App + MySQL)

## Primary Actors

- Admin: manages sessions, jury, teams, participants, and exports marks.
- Jury: views assigned sessions/teams and submits/locks marks.
- Participant (indirect actor): represented in team/participant master data.

## Core Domain Objects

- Session
- Jury
- JurySession (junction)
- Team
- Participant
- TeamMember (junction)
- Mark
- Credential
- Admin

## Key Business Flows

1. Admin creates session (can draft/publish), assigns juries and teams.
2. Admin starts session; jury can access ongoing session.Jury submits or updates team marks per session.
3. Jury can lock marks; admin ending session locks remaining marks.
4. Admin views dashboards and exports results.

## Functional Decomposition (for DFD)

- F1 Authentication & Authorization
- F2 Master Data Management (jury/team/participant)
- F3 Session Lifecycle Management
- F4 Team Assignment & Shuffle
- F5 Evaluation/Marks Processing
- F6 Reporting/Export

## Deployment View

- Client browser accesses Next.js app service.
- App service accesses MySQL service over Docker bridge network.
- Persistent DB storage uses Docker volume.

## Assumptions Used in Diagram Set

- Marks are unique by (teamId, juryId, sessionId) at business level.
- Team assignment is maintained at team record level (team.juryId).
- Jury-session assignment uses junction table jury_sessions.
- Session end triggers mark locking workflow.
