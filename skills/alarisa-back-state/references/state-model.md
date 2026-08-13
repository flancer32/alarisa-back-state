# State Model and Transitions

## Ownership

The package owns durable Principal-state declarations and transition behavior for evidence, interpretations, assertions, Objects, components, controlled Relations, and Cases. It does not infer Intent, own communication contracts, or decide a production database topology.

## Semantic boundaries

- An Observation is retained input evidence, not truth; correction appends new evidence.
- An Interpretation is a traceable processing attempt over Observations.
- An Assertion is a provenance-bearing, versioned claim. Its JSON claim envelope is provisional and must not be treated as a universal final triple schema.
- The Object/component/Relation projection represents current operational belief and remains distinct from retained evidence and claims.
- Object Extensions require a namespace and version and must not become the main semantic store.

## Case and Relation invariants

- A Case has the same identity as its Object. Its lowercase kebab-case `code` is unique, bounded to 128 characters, and not an identity substitute.
- A root Case has no primary parent. Each non-root Case has one primary parent, and primary-parent placement is acyclic.
- Reparenting changes placement, not Case identity. A transition must reject self-parenting, cycles, missing Cases, and corrupt stored cycles.
- Relations connect distinct existing Objects through a registered active Relation Type. Do not substitute arbitrary predicate strings.

Use `Alarisa_Back_State_Case_Repository$` for its published Case and Relation operations. It accepts an optional caller transaction; when absent, it opens, commits, or rolls back its own transaction. For a compound host transition, pass the caller-owned transaction so the whole change remains atomic.

Do not bypass these invariants through generic CRUD. A failed check or write rolls back; an unknown commit outcome is surfaced to the host and is not blindly retried.
