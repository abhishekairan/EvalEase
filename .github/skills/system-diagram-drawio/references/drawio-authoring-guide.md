# draw.io Authoring Guide

## File Strategy
- Prefer one diagram per file for maintainability.
- Store under `docs/diagrams/`.
- Keep stable, ordered file names (`01-`, `02-`, ...).

## Layout Rules
- Left-to-right primary flow where possible.
- Keep crossing edges minimal.
- Use consistent color semantics if colors are used.

## Labeling Rules
- Use exact names from code/schema for entities.
- Keep connector labels short and unambiguous.
- Avoid mixing synonyms for the same concept.

## Consistency Rules
- Align Class vs ER naming and relationships.
- Align Sequence vs Activity flow steps.
- Align Deployment with actual Docker/cloud runtime.

## Validation Pass
- Open every `.drawio` file in VS Code draw.io extension.
- Confirm shapes/text render and no broken links.
- Confirm each requested diagram type is present.
