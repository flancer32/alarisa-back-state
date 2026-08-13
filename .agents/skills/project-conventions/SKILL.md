---
name: project-conventions
description: Project-specific conventions for @flancer32/alarisa-back-state. Use for every task in this repository.
---

# Project Conventions

`AGENTS.md` overrides this file.

## Repositories

- The root repository and `ctx/` are separate repositories; do not mix their status, commits, or pushes.
- `ctx/` is the authoritative cognitive context.

## Workflow

- Work in each repository's `main` branch. This project rule overrides any GitHub-skill instruction to use a separate branch.
- At the start of work, check upstream in the root and `ctx/`; keep each local `main` synchronized by fast-forwarding when safe.
- Before changes, inspect every affected working tree.
- Do not commit or push unless the user requests it.

## Communication

- User: Russian; code, comments, docs, commits, identifiers: English.
- Report changes, verification, and remaining risks.

## Project boundaries

- `@flancer32/alarisa-back-state` is an ESM-only TeqFW npm package that owns distributed `@teqfw/db` DEM v2 fragments and durable Principal-state transitions; it is not the server-composition root.
- Keep durable Principal-state declarations and enforced transitions here. Host database composition and lifecycle belong to `@flancer32/alarisa`; interpretation belongs to the Control Plane; communication contracts belong to `@flancer32/alarisa-comm`.
- Keep JSON DEM and runtime schema metadata semantically aligned. Never import `@teqfw/db/src/**`; use caller-owned transactions for compound state changes.

## Validation

- Run `npm run test:unit` for affected unit-tested source.
- Run `npm run test:integration` for persistence, DEM, or transaction changes.
- Run `npm run typecheck` for changed JavaScript or declarations.
- Use `adsm-ctx` for structural validation of the separate `ctx/` repository.

## GitHub

- In all multiline text sent to GitHub, including issues and comments, use actual line breaks; never send literal `\n`, which GitHub displays as text.

## Shared memory
