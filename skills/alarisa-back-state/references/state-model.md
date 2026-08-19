# State Model and Transitions

## Status and ownership

The target architecture assigns this package ownership of the durable World Model projection and State-side ChangeSet history for one delegated Assistant scope. The current implementation publishes the generic DEM fragment and a read-only current-Picture projection. It does not implement the State transition service, history processing, or scope isolation. The Acceptance Contour owns Observations, Interpretations, Assertions, and Reconciliation; a future State service must receive only fully determined ChangeSet proposals.

The current DEM contains these generic entities: `object`, `component_type`, `component`, `property_type`, `property`, `relation_type`, `relation`, `object_extension`, `change_set`, and `change_set_mutation`. It does not seed `case`, `case-parent`, or the practical Case properties; the local fixture creates those vocabulary records.

## Semantic boundaries

- The target model treats an Object as durable semantic identity, a Component as an attachable aspect, and a Property as a typed characteristic of a Component.
- A Case is the `case` Component on an Object. `code`, `title`, and `description` are open typed Properties in the practical fixture representation, not special schema columns.
- A Relation connects two Objects through a controlled Relation Type. The target Case Map is Relation-based, including `case-parent` placement; the current DEM does not enforce the associated State invariants.
- The target ChangeSet contract is immutable, externally identified, and finalized as State `ACCEPTED` or `REJECTED`, with ordered primitive Mutations retained for accepted history and result replay. The current DEM only provides journal-shaped storage and no processing API.
- Object Extensions use a namespace and version and must not become the main semantic store. The current DEM declares those fields but does not provide a runtime policy layer.

## Case and Relation invariants

- A Case has the same identity as its Object. Its lowercase kebab-case `code` is a typed Property and not an identity substitute.
- The target State contract requires that a root Case has no primary parent, each non-root Case has one primary parent, and primary-parent placement is acyclic.
- Reparenting changes placement, not Case identity. A future transition service must reject self-parenting, cycles, missing Cases, and corrupt stored cycles.
- The target model connects distinct existing Objects through a registered active Relation Type. The current DEM does not model Relation Type activity or enforce distinct endpoints; do not treat database rows as proof of these invariants.

The current package publishes the DEM fragment and a read-only current-Picture boundary, not a Case repository or generic CRUD API. Do not introduce direct mutation APIs as a substitute for the future ChangeSet transition service, and do not claim that the current package enforces the target State invariants.
