---
name: system-diagram-drawio
description: 'Create software/system diagrams in draw.io format (.drawio) for VS Code draw.io extension workflows. Use for use case diagrams, use case scenarios, UML (class, sequence, activity, collaboration, package, deployment), DFD level 0/1/2, and ER diagrams from project code and docs.'
argument-hint: 'Project path, domain context, and required diagram set'
user-invocable: true
disable-model-invocation: false
---

# System Diagram Authoring (draw.io)

Create accurate system diagrams as editable `.drawio` files, grounded in the real codebase.

## When to Use
- User asks to generate system diagrams in draw.io.
- User needs architecture artifacts for reports or documentation.
- User requests any of the following outputs:
  - Use Case Diagram
  - Use Case Scenarios
  - UML diagrams: Class, Sequence, Activity, Collaboration, Package, Deployment
  - DFD Level 0, 1, 2
  - ER Diagram

## Inputs
- Repository or workspace path
- Required diagram set (single or full pack)
- Output scope:
  - Project-scoped: `.github/skills/...` usage in current repo
  - Personal-scoped: `~/.copilot/skills/...` workflow

## Procedure
1. Discover system context.
2. Extract domain model and actors.
3. Map runtime and data flows.
4. Draft each diagram specification before drawing.
5. Generate `.drawio` files (one per diagram preferred).
6. Validate semantic consistency across files.
7. Deliver index + assumptions + known gaps.

## Step-by-Step Workflow

### 1) Discover System Context
- Read high-signal files first:
  - `README`, architecture docs, deployment docs
  - database schema and migrations
  - auth, middleware, server actions, API routes
- Build a quick inventory:
  - Actors, bounded contexts, services, persistence, integrations

### 2) Extract Domain and Behavior
- Domain entities: tables/models and key attributes
- Relationships: cardinality and ownership
- Behaviors: key use cases and state transitions
- Cross-check with code paths (not only docs)

### 3) Build Diagram Specs
Create a short spec for each required diagram:
- Title and purpose
- Nodes/components/entities
- Connections with labels
- Constraints/assumptions

Use the checklist in [diagram checklist](./references/diagram-checklist.md).

### 4) Decision Points and Branching
- If code and docs disagree:
  - Prefer code behavior; note docs mismatch in assumptions.
- If deployment details are missing:
  - infer minimal safe topology and mark as inferred.
- If requested scope is too broad:
  - split into multiple `.drawio` files and include an index.
- If model is evolving:
  - add version/date labels in diagram titles.

### 5) Generate draw.io Files
- Preferred output: one file per diagram, under `docs/diagrams/`.
- Naming convention:
  - `01-use-case-diagram.drawio`
  - `02-use-case-scenarios.drawio`
  - `03-class-diagram.drawio`
  - ...
- Keep labels concise and technical.
- Use consistent naming for entities across all diagrams.

Use the structure guide in [draw.io authoring guide](./references/drawio-authoring-guide.md).

### 6) Quality Checks (Completion Gate)
A diagram set is complete only if all checks pass:
- Coverage:
  - Every requested diagram exists.
- Consistency:
  - Entity names and relationships match across Class/ER/DFD.
- Behavioral correctness:
  - Sequence and Activity flows align with server actions/runtime behavior.
- Deployment realism:
  - Deployment diagram matches actual runtime stack.
- Traceability:
  - Assumptions and inferred details are explicitly documented.

### 7) Deliverables
- Diagram files in `.drawio` format.
- `docs/diagrams/README.md` index.
- Optional `docs/PROJECT_DIAGRAM_ANALYSIS.md` with assumptions.

## Output Contract
When this skill runs, it should produce:
- A complete requested diagram set in `.drawio` files.
- A concise summary of what was generated and where.
- Any unresolved ambiguities listed as explicit assumptions.

## Example Prompts
- `/system-diagram-drawio analyze this repo and create full UML + DFD + ER in .drawio`
- `/system-diagram-drawio create class, sequence, and deployment diagrams from src + docker-compose`
- `/system-diagram-drawio generate DFD level 0/1/2 and ER for this evaluation platform`
