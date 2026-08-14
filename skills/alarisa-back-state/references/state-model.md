# State Model and Transitions

## Ownership

The package owns the durable World Model projection and State-side ChangeSet history for one delegated Assistant scope. The Acceptance Contour owns Observations, Interpretations, Assertions, and Reconciliation; State receives only fully determined ChangeSet proposals.

## Semantic boundaries

- An Object is durable semantic identity; a Component is an attachable aspect; a Property is a typed characteristic of a Component.
- A Case is the `case` Component on an Object. `code`, `title`, and `description` are open typed Properties in the practical Case representation.
- A Relation connects two Objects through a controlled Relation Type. The Case Map is Relation-based, including `case-parent` placement.
- A ChangeSet is immutable, externally identified, and finalized as State `ACCEPTED` or `REJECTED`; ordered primitive Mutations are retained for accepted history and result replay.
- Object Extensions require a namespace and version and must not become the main semantic store.

## Case and Relation invariants

- A Case has the same identity as its Object. Its lowercase kebab-case `code` is a typed Property and not an identity substitute.
- A root Case has no primary parent. Each non-root Case has one primary parent, and primary-parent placement is acyclic.
- Reparenting changes placement, not Case identity. A transition must reject self-parenting, cycles, missing Cases, and corrupt stored cycles.
- Relations connect distinct existing Objects through a registered active Relation Type. Do not substitute arbitrary predicate strings.

The current package publishes the DEM fragment, not a Case repository. Do not bypass State invariants through generic CRUD when implementing the ChangeSet transition service.
