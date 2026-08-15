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
- `test/integration/DemSchemaSqlite.test.mjs` compiles the fragment through the SQLite adapter using an isolated temporary file and verifies the ten planned relational projections. It does not apply the schema, insert data, or exercise State transitions.
- `npm run typecheck` checks the current declarations and compiler configuration. There are no package-owned State JavaScript modules to typecheck yet.
- `npm pack --dry-run` verifies that the published package contains `skills/alarisa-back-state/`.

## Change checks

- Keep `etc/teqfw.schema.json` aligned with the conceptual model and package metadata. There is currently no separate package-owned runtime schema metadata or source-attached `__deps__` contract.
- Preserve the `Alarisa_Back_State_` namespace declaration in `package.json` unless a real package runtime module is introduced and the integration contract is updated with it.
- Keep the DEM declaration and the conceptual model aligned: Object/Component/Property/Relation plus ChangeSet journal.
- For current DEM changes, run the existing unit and SQLite compilation tests. The fixture script is not an automated integration test and is not part of `npm test`.
- Run `npm run typecheck` after JavaScript, JSDoc, declarations, or compiler-config changes.
- After changing this skill, inspect `npm pack --dry-run` to confirm the complete `skills/alarisa-back-state/` tree is included.

The current suite does not cover database persistence, MariaDB/PostgreSQL execution, State invariants, ChangeSet processing, primitive preconditions, ordered temporary Mutations, final-result idempotency, concurrent serialization, revision, historical reconstruction, or delegated Assistant-scope isolation. Add those checks only together with the corresponding implementation and architecture decisions.

Do not add a driver, database lifecycle, host map, or new persistence authority without explicit human approval.

The repository-local `scripts/rebuild-cases.mjs` is a destructive fixture utility, not a production migration. It is limited to the explicitly listed `alarisa_*` tables and requires the local `.env` plus Ruby YAML support.
