# Testing and Maintenance

Use the package scripts and Node.js built-in test runner.

```bash
npm run test:unit
npm run test:integration
npm test
npm run typecheck
```

`npm test` runs unit and integration tests. `npm run typecheck` checks JavaScript, JSDoc, and ambient declarations without emitting output.

## Current coverage

- `test/unit/Schema.test.mjs` verifies the DEM version, ten declared entities, and selected foreign-key/index declarations.
- `test/integration/DemSchemaSqlite.test.mjs` compiles the fragment through the SQLite adapter using an isolated temporary file and verifies the ten planned relational projections.
- `test/integration/Read.test.mjs` compiles the published DEM, seeds an isolated SQLite graph, and verifies DI read resolution, deterministic DTOs, projections, hierarchy errors, transaction ownership, and no-write behavior.
- `npm run typecheck` checks declarations, runtime read modules, and compiler configuration.
- `npm pack --dry-run` verifies that the published package contains `skills/alarisa-back-state/`.

## Change checks

- Keep `etc/teqfw.schema.json` aligned with the conceptual model and package metadata. The `src/Service/Read/` modules declare source-attached `__deps__`; keep their DTO and transaction contract aligned with [Current Picture reads](read.md).
- Preserve the `Alarisa_Back_State_` namespace declaration in `package.json` unless a real package runtime module is introduced and the integration contract is updated with it.
- Keep the DEM declaration and the conceptual model aligned: Object/Component/Property/Relation plus ChangeSet journal.
- For current DEM changes, run the existing unit and SQLite compilation tests; for reader changes, run the isolated read suite and TeqFW ESM validator. The fixture script is not an automated integration test and is not part of `npm test`.
- Run `npm run typecheck` after JavaScript, JSDoc, declarations, or compiler-config changes.
- After changing this skill, inspect `npm pack --dry-run` to confirm the complete `skills/alarisa-back-state/` tree is included.

The current suite does not cover database persistence, MariaDB/PostgreSQL execution, State invariants, ChangeSet processing, primitive preconditions, ordered temporary Mutations, final-result idempotency, concurrent serialization, revision, historical reconstruction, or delegated Assistant-scope isolation. Add those checks only together with the corresponding implementation and architecture decisions.

Do not add a driver, database lifecycle, host map, or new persistence authority without explicit human approval.

The repository-local `scripts/rebuild-cases.mjs` is a destructive fixture utility, not a production migration. It is limited to the explicitly listed `alarisa_*` tables and requires the local `.env` plus Ruby YAML support.
