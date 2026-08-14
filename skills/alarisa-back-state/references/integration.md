# Integration

This package is a persistence participant, not a server composition root. Confirm the installed package version and host's public `@teqfw/di` and `@teqfw/db` APIs before integrating.

## Runtime identity

The package declares this TeqFW namespace mapping:

```text
Alarisa_Back_State_ -> ./src (.mjs)
```

Its DEM v2 fragment is `etc/teqfw.schema.json`. It describes package-owned semantic-memory entities and must be compiled with the host-owned database map. It does not select a driver, construct a connection, or authorize schema operations.

## Host composition

1. Install this package with compatible `@teqfw/di` and `@teqfw/db` dependencies.
2. Register package namespaces from package metadata before resolving components.
3. Add the package DEM fragment to the host's complete database map and resolve cross-package references in that map.
4. Select the Knex-compatible driver, database location, connection lifecycle, and schema-operation policy in the host.
5. Compile the DEM before schema work and let the selected dialect perform connection-specific preflight.
6. Let the Control Plane validate accepted meaning and authority before submitting a ChangeSet; State owns the semantic transaction boundary and final durable outcome.

Namespace registration, DEM compilation, connection lifecycle, and DI resolution are separate operations. Do not assume one performs another.

## Skill distribution

The package publishes this skill under `skills/alarisa-back-state/`. A host owns discovery and may mount its installed copy in a root catalog:

```bash
mkdir -p .agents/skills
ln -s ../../node_modules/@flancer32/alarisa-back-state/skills/alarisa-back-state .agents/skills/alarisa-back-state
```

Installation must not create the link or modify host agent configuration.
