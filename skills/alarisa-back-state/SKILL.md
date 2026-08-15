---
name: alarisa-back-state
description: Use when integrating, modifying, testing, or reviewing @flancer32/alarisa-back-state durable Principal state and its TeqFW DEM v2 fragment.
---

# `@flancer32/alarisa-back-state`

Use this package-owned skill for code that directly consumes or changes the installed package. It explains package responsibilities, not Alarisa product policy or host architecture; the host project's instructions and context remain authoritative.

## Current implementation status

The current package publishes an additive TeqFW DEM v2 fragment and fixture tooling. It does not currently provide package-owned runtime State modules, a ChangeSet processing service, a Case repository, generic CRUD, or a public transition API. The `Alarisa_Back_State_` namespace mapping exists in package metadata, but there are no package components to resolve through it yet.

The current checks cover the DEM declaration, SQLite compilation and physical planning, TypeScript checking, and package contents. They do not prove ChangeSet processing, State invariants, idempotent result replay, concurrent serialization, historical reconstruction, or Assistant-scope isolation.

The semantic and architectural rules below are the target State contract. Treat them as implementation constraints for future State services unless a sentence explicitly says that the current DEM or tests enforce them.

This skill also defines a portable application-data authoring contract. An agent can use it to describe a World Model fragment and emit a normalized ChangeSet draft without ctx/ or database IDs. The current package does not consume that draft directly; a host or future State adapter must resolve it and submit it to a real State API.

## First route

Choose only the reference needed for the task:

- [Integration](references/integration.md) — compose the currently published DEM fragment in a host; runtime State API integration is not available yet.
- [State model](references/state-model.md) — use the target contract for Objects, Components, Properties, Cases, Relations, and ChangeSets, while distinguishing it from the current DEM.
- [Data authoring](references/data-authoring.md) — describe a portable World Model fragment and compile it into a normalized ChangeSet draft.
- [Testing and maintenance](references/testing.md) — modify the current DEM, declarations, tests, fixture, skill, or package distribution.

## Non-negotiable boundaries

- Package metadata declares the `Alarisa_Back_State_` namespace, mapped to `./src` with `.mjs` files. Do not assume that this currently exposes package-owned runtime components.
- The package publishes an additive DEM v2 fragment at `etc/teqfw.schema.json`; the host owns the map, driver, connection lifecycle, and schema-operation authorization.
- Resolve TeqFW components through `TeqFw_Db_` when working with the published DEM. Resolve package components through `Alarisa_Back_State_` only after such components exist in the installed version. Do not use `@teqfw/db/src/**` deep imports or create a separate container.
- The target model treats `Object` identity as durable and independent of component classification. A Case is a Component on an Object; its `code` is an ordinary typed Property, not an identity substitute. The current DEM provides generic entities and does not seed a Case vocabulary.
- Keep the Acceptance Contour boundary: this package does not own Observations, Interpretations, Assertions, or Reconciliation records.
- The target Case Map is Relation-based. Primary-parent cardinality and acyclicity are State invariants; the current DEM and tests do not enforce them.
- The target State contract treats `ChangeSet` as an immutable, identity-idempotent journal entry with ordered primitive Mutations. The current DEM stores journal-shaped entities but no service enforces processing, final outcomes, or replay.
- The current DEM has no explicit Assistant-scope identity or proven storage isolation. Do not claim cross-scope isolation from this package alone.
- This skill is discovered independently from TeqFW runtime metadata. It does not add a namespace, export, postinstall action, or automatic host link.

Confirm exact APIs, package versions, DEM composition, and host lifecycle in the installed package metadata, source, and tests before editing.
