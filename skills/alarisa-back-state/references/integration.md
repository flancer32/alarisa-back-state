# Integration

This package is a persistence participant, not a server composition root. Confirm the installed package version and host's public `@teqfw/di` and `@teqfw/db` APIs before integrating.

At the current package version, integration composes the published DEM fragment and may resolve the read-only current-Picture facade. No State transition component or ChangeSet API is available yet.

## Runtime identity

Package metadata declares this TeqFW namespace mapping:

```text
Alarisa_Back_State_ -> ./src (.mjs)
```

Its DEM v2 fragment is `etc/teqfw.schema.json`. It currently declares ten generic relational projections: Objects, Components and Types, typed Properties and Types, Relations and Types, Object Extensions, and ChangeSet journal records with ordered Mutations. The fragment has no current cross-package references. It must be compiled with the host-owned database map. It does not select a driver, construct a connection, authorize schema operations, or provide a State transition API. See [Current Picture reads](read.md) for the implemented reader.

## Host composition

1. Install this package with compatible `@teqfw/di` and `@teqfw/db` dependencies.
2. Register the namespace before first resolution and resolve the documented current-Picture reader when needed.
3. Initialize the database connection in the host. A supplied reader transaction remains caller-owned; otherwise the facade owns its short read transaction.
4. Add the package DEM fragment to the host's complete database map. Resolve cross-package references only when a future fragment declares them.
5. Select the Knex-compatible driver, database location, connection lifecycle, and schema-operation policy in the host.
6. Compile the DEM before schema work and let the selected dialect perform connection-specific preflight.
7. Do not submit a ChangeSet to this package as though a State API existed. The Acceptance Contour boundary and State transaction contract are architectural targets for a future transition service.

Namespace registration, DEM compilation, connection lifecycle, and DI resolution are separate operations. Do not assume one performs another. The reader token, DTO selections, and transaction behavior are documented in [Current Picture reads](read.md).

## Skill distribution

The package publishes this skill under `skills/alarisa-back-state/`. A host owns discovery and may mount its installed copy in a root catalog:

```bash
mkdir -p .agents/skills
ln -s ../../node_modules/@flancer32/alarisa-back-state/skills/alarisa-back-state .agents/skills/alarisa-back-state
```

Installation must not create the link or modify host agent configuration.
