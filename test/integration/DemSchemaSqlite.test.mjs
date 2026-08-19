import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {after, before, describe, it} from 'node:test';
import Container from '@teqfw/di';

const root = path.resolve(import.meta.dirname, '../..');
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'alarisa-back-state-'));
let connection;
let compilation;
let schema;

function container() {
    const result = new Container();
    result.addNamespaceRoot('TeqFw_Db_', path.join(root, 'node_modules/@teqfw/db/src'), '.mjs');
    result.addNamespaceRoot('TeqFw_Cfg_', path.join(root, 'node_modules/@teqfw/cfg/src'), '.mjs');
    result.addNamespaceRoot('TeqFw_Log_', path.join(root, 'node_modules/@teqfw/log/src'), '.mjs');
    return result;
}

before(async () => {
    const di = container();
    const compile = await di.get('TeqFw_Db_Back_Dem_Compile$');
    const adapter = await di.get('TeqFw_Db_Back_RDb_Dialect_Sqlite$');
    connection = await di.get('TeqFw_Db_Back_RDb_Connect$');
    schema = await di.get('TeqFw_Db_Back_RDb_Schema$');
    await connection.init({client: 'sqlite3', connection: {filename: path.join(tempRoot, 'state.sqlite')}});
    connection.setSchemaConfig({prefix: 'alarisa'});
    const declaration = JSON.parse(await fs.readFile(path.join(root, 'etc/teqfw.schema.json'), 'utf8'));
    compilation = await compile.exec({
        adapter,
        fragments: [{declaration, filename: path.join(root, 'etc/teqfw.schema.json'), fragmentId: '@flancer32/alarisa-back-state', packageName: '@flancer32/alarisa-back-state'}],
        mapEnvelope: {declaration: {version: 2, namespace: 'alarisa', ref: {}, deprecated: {}}, filename: 'test://map', mapId: 'map', packageName: '@flancer32/alarisa'},
    });
    compile.assertResult({value: compilation});
    assert.equal(compilation.physical.tables.length, 10);
    schema.setCompilation({compilation});
});

after(async () => {
    await connection?.disconnect();
    await fs.rm(tempRoot, {recursive: true, force: true});
});

describe('compiled State DEM', () => {
    it('creates the ten relational projections', async () => {
        assert.deepEqual(compilation.physical.tables.map((table) => table.name).sort(), [
            'alarisa_change_set', 'alarisa_change_set_mutation', 'alarisa_component', 'alarisa_component_type',
            'alarisa_object', 'alarisa_object_extension', 'alarisa_property', 'alarisa_property_type',
            'alarisa_relation', 'alarisa_relation_type',
        ]);
        const evidence = await schema.createAllTables({conn: connection});
        assert.equal(evidence.status, 'complete');
        for (const table of compilation.physical.tables) {
            assert.equal(await connection.getSchemaBuilder().hasTable(table.name), true);
        }
    });
});
