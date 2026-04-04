# Draw.io Diagram Files

This section consolidates the visual artifacts used to describe the EvalEase system from functional, structural, behavioral, data-flow, and deployment perspectives. Collectively, these diagrams support architecture communication, implementation planning, and project report documentation.

Recommended reading sequence for project reporting:

1. Functional scope: 01, 02
2. Logical design: 03, 05, 06, 07
3. Runtime and infrastructure: 04, 08
4. Data movement analysis: 09, 10, 11 (and simplified alternates)
5. Data model definition: 12

Notation and interpretation note:

- DFD levels progress from context (Level 0) to decomposition (Level 1) and process-detail (Level 2).
- The ER diagram captures entity attributes and key constraints for relational consistency.
- Simplified DFD variants are presentation-focused and complement, rather than replace, the primary DFD set.

Formal summary of EvalEase architecture and analysis diagrams:

- 01-use-case-diagram.drawio: Presents the primary functional scope of the EvalEase platform by identifying the principal actors (Admin and Jury) and their corresponding responsibilities, including authentication, session and team administration, evaluation activities, lock management, and reporting/export operations.

- 02-use-case-scenarios.drawio: Provides scenario-level elaboration of key use cases through structured flows that include preconditions, main execution paths, and postconditions for session initiation, mark submission, session closure, team reallocation, and mark lock/unlock control.

- 03-class-diagram.drawio: Defines the core domain structure and object relationships of the system, covering entities such as Session, Jury, Team, Participant, and Mark, together with linking constructs and cardinality constraints required for consistent data modeling.

- 04-sequence-diagram.drawio: Illustrates the temporal interaction sequence for mark submission, tracing communication from the Jury user interface through server actions and utility layers to database persistence and subsequent cache/path revalidation.

- 05-activity-diagram.drawio: Describes the operational workflow and decision logic that governs the evaluation lifecycle, from session preparation and assignment through active execution, end-state determination, and marks locking.

- 06-collaboration-diagram.drawio: Depicts inter-component collaboration across presentation, application, and data layers, clarifying how UI modules, action handlers, utility services, and persistence mechanisms coordinate during core evaluation processes.

- 07-package-diagram.drawio: Documents package-level architectural organization of the codebase, outlining boundaries among routing, components, server actions, validation schemas, shared types, database utilities/schema, supporting scripts, and container artifacts.

- 08-deployment-diagram.drawio: Represents the deployment architecture and runtime topology, including client access points, Next.js ingress and application responsibilities, MySQL persistence services, storage volumes, and principal communication paths.

- 09-dfd-level-0.drawio: Provides a context-level data flow perspective in which EvalEase is treated as a single process interacting with external actors, highlighting high-level input/output exchanges such as assignments, scoring data, status information, and reports.

- 10-dfd-level-1.drawio: Expands the system into major functional processes, including authentication/authorization, session administration, team-jury allocation, evaluation and marks handling, reporting/export, and session status visibility, with associated data stores and flows.

- 11-dfd-level-2.drawio: Offers detailed decomposition of the evaluation and marks process, including access validation, assigned-team retrieval, score capture and rule checks, mark create/update logic, lock/unlock transitions, summary aggregation, and publish/revalidation outputs.

- 12-er-diagram.drawio: Establishes the conceptual and relational data model in ER form, covering Admin, Session, Jury, Participants, Teams, Marks, and Credentials, together with key attributes and foreign-key dependencies that ensure referential integrity.

- evalease-dfd-level1.drawio: Provides a simplified alternative of Level 1 DFD intended for clear communication, retaining essential Admin and Jury process interactions with primary data stores while reducing diagrammatic complexity.

- evalease-dfd-level2.drawio: Provides a simplified alternative of Level 2 DFD focused on operational execution paths, emphasizing session operations, assignment operations, score entry, and mark submission interactions with core repositories.

All files are compatible with and can be opened directly in the VS Code draw.io extension.