# Current World Picture Reads

The package provides an in-process, read-only current-Picture port. It does not
create an HTTP endpoint, browser transport, generic query API, repository, or
State mutation surface.

## DI tokens

Register the published `Alarisa_Back_State_ -> ./src (.mjs)` namespace before
the first container resolution. Resolve the public facade:

```text
Alarisa_Back_State_Service_Read$
```

It exposes named methods: `picture`, `tree`, `node`, `subtree`, and
`neighborhood`. Focused implementation tokens are also resolvable for narrow
package-internal composition:

```text
Alarisa_Back_State_Service_Read_Picture$
Alarisa_Back_State_Service_Read_Tree$
Alarisa_Back_State_Service_Read_Node$
Alarisa_Back_State_Service_Read_Subtree$
Alarisa_Back_State_Service_Read_Neighborhood$
```

The host initializes and disconnects `TeqFw_Db_Back_RDb_Connect$`; the package
does not choose a driver, configuration Source, database map, or lifecycle.

## DTOs and selections

Every result is a JSON-compatible version-1 envelope with `selection`,
`objects`, `componentTypes`, `propertyTypes`, `relationTypes`, and `relations`.
Fragment identities are generated numeric `id` values. Objects contain active
Components and their active typed Properties. Relations retain `sourceObjectId`,
`typeId`, and `targetObjectId`; types retain controlled `code` and optional description; Property Types also
retain `valueType`. Results never expose Knex objects, database row keys, Object
fixture `code`, or layout data.

`picture()` selects the complete active graph. `tree()` returns the Case Map;
`subtree({objectId})` focuses one Case and its descendants; `node({objectId})`
returns one Object with incident active Relations; and
`neighborhood({objectId})` returns that Object's one-hop active local graph.
Tree nodes contain `objectId`, `children`, and cross-link Relation IDs.

The practical `case-parent` Relation points child source to parent target. It is
the only tree-placement edge. Non-primary Relations, including parent-like
ones, remain cross-links. Multiple active `case-parent` Relations for a child
or a cycle cause a deterministic `ReadHierarchyError`.

## Transactions and limits

All facade methods accept an optional `{trx}`. A supplied
`TeqFw_Db_Back_RDb_ITrans` is used for all reads and is never committed or
rolled back by the reader. Without it, the facade starts, commits, or rolls
back its own short-lived transaction. Focused operations require a ready
transaction and do not own one.

This is the one currently addressable World Picture only. It does not prove
Assistant-scope isolation and does not implement revisions, history replay,
ChangeSet processing, generic CRUD, State transitions, HTTP, browser UI, or a
YAML API.
