# @flancer32/alarisa-back-state

Durable Principal state package for Alarisa. The package owns a distributed DEM v2 fragment for one delegated Assistant World Model and its accepted ChangeSet history.

The model is intentionally open: Objects carry Components, Components carry typed Properties, and Relations form the Case Map and the wider semantic graph. A Case is a Component on an Object, not a fixed `case_data` record. The package does not own Observations, Interpretations, Assertions, or Reconciliation records.

`etc/teqfw.schema.json` is compiled and applied by the host through `@teqfw/db`. The host owns the map, driver, connection lifecycle, and authorization for schema operations. The package currently publishes the DEM fragment rather than a generic CRUD or Case repository API.

For the local MariaDB/PostgreSQL fixture configured in `.env`, `node scripts/rebuild-cases.mjs` drops only the listed `alarisa_*` tables, recreates the compiled schema, and loads `/home/alex/work/flancer32/alarisa/tmp/cases.yaml` as Object–Case Component–Property–Relation data.

The authoritative cognitive context is maintained separately in the private `flancer32/alarisa-back-state-ctx` repository and mounted locally at `ctx/`.
