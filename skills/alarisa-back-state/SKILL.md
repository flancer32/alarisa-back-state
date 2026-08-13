---
name: alarisa-back-state
description: Use when integrating, modifying, testing, or reviewing @flancer32/alarisa-back-state durable Principal state, its semantic-memory DEM fragment, Case repository, or TeqFW DI components. Verify the installed package source, metadata, and tests for exact current contracts.
---

# `@flancer32/alarisa-back-state`

Use this package-owned skill for code that directly consumes or changes the installed package. It explains package responsibilities, not Alarisa product policy or host architecture; the host project's instructions and context remain authoritative.

## First route

Choose only the reference needed for the task:

- [Integration](references/integration.md) — compose the package DEM fragment and DI namespace in a host.
- [State model](references/state-model.md) — work with semantic records, Cases, relation types, or invariant boundaries.
- [Testing and maintenance](references/testing.md) — modify implementation, DEM, declarations, tests, or package distribution.

## Non-negotiable boundaries

- The runtime namespace is `Alarisa_Back_State_`, mapped to `./src` with `.mjs` files.
- The package publishes an additive DEM v2 fragment at `etc/teqfw.schema.json`; the host owns the map, driver, connection lifecycle, and schema-operation authorization.
- Resolve package components through `Alarisa_Back_State_` and `TeqFw_Db_` DI tokens. Do not use `@teqfw/db/src/**` deep imports or create a separate container.
- Treat `Object` identity as durable and independent of component classification. A Case uses its Object identity; its `code` is a unique immutable lookup key.
- Preserve the separation of retained Observations, Interpretations, Assertions, and the current Object/component/Relation projection. Interpretation output does not promote itself to current belief.
- Keep compound state changes in caller-owned transactions and enforce primary-parent acyclicity in transition behavior.
- This skill is discovered independently from TeqFW runtime metadata. It does not add a namespace, export, postinstall action, or automatic host link.

Confirm exact APIs, package versions, DEM composition, and host lifecycle in the installed package metadata, source, and tests before editing.
