# Testing and Maintenance

Use the package scripts and Node.js built-in test runner.

```bash
npm run test:unit
npm run test:integration
npm test
npm run typecheck
```

`npm test` runs unit and integration tests. `npm run typecheck` checks JavaScript, JSDoc, and ambient declarations without emitting output.

## Change checks

- Keep `etc/teqfw.schema.json` and runtime schema metadata semantically aligned.
- Preserve the `Alarisa_Back_State_` namespace mapping and source-attached `__deps__` metadata.
- Update `types.d.ts` when a published DI type alias changes.
- Run unit tests for schema metadata or repository validation changes.
- Run integration tests for DEM compilation, database persistence, DI composition, transactions, or state invariants. Tests must use isolated temporary storage and disconnect before cleanup.
- Run `npm run typecheck` after JavaScript, JSDoc, declarations, or compiler-config changes.
- After changing this skill, inspect `npm pack --dry-run` to confirm the complete `skills/alarisa-back-state/` tree is included.

Do not add a driver, database lifecycle, host map, or new persistence authority without explicit human approval.
