import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {after, before, describe, it} from 'node:test';
import Container from '@teqfw/di';
import Repository from '../../src/Case/Repository.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'alarisa-back-state-'));
const filename = path.join(tempRoot, 'state.sqlite');
let connection;
let repository;

function container() {
    const result = new Container();
    result.addNamespaceRoot('Alarisa_Back_State_', path.join(root, 'src'), '.mjs');
    result.addNamespaceRoot('TeqFw_Db_', path.join(root, 'node_modules/@teqfw/db/src'), '.mjs');
    result.addNamespaceRoot('TeqFw_Cfg_', path.join(root, 'node_modules/@teqfw/cfg/src'), '.mjs');
    result.addNamespaceRoot('TeqFw_Log_', path.join(root, 'node_modules/@teqfw/log/src'), '.mjs');
    return result;
}

before(async () => {
    const di = container();
    const compile = await di.get('TeqFw_Db_Back_Dem_Compile$');
    const adapter = await di.get('TeqFw_Db_Back_RDb_Dialect_Sqlite$');
    const planner = await di.get('TeqFw_Db_Back_RDb_Schema_A_Plan$');
    const builder = await di.get('TeqFw_Db_Back_RDb_Schema_A_Builder$');
    const crud = await di.get('TeqFw_Db_Back_App_Crud$');
    const caseSchema = await di.get('Alarisa_Back_State_Case_Schema$');
    const relationSchema = await di.get('Alarisa_Back_State_Case_Relation_Schema$');
    connection = await di.get('TeqFw_Db_Back_RDb_Connect$$');
    await connection.init({client: 'sqlite3', connection: {filename}, useNullAsDefault: true});
    connection.setSchemaConfig({prefix: 'alarisa'});

    const declaration = JSON.parse(await fs.readFile(path.join(root, 'etc/teqfw.schema.json'), 'utf8'));
    const compilation = await compile.exec({
        adapter,
        fragments: [{
            declaration,
            filename: path.join(root, 'etc/teqfw.schema.json'),
            fragmentId: '@flancer32/alarisa-back-state',
            packageName: '@flancer32/alarisa-back-state',
        }],
        mapEnvelope: {
            declaration: {version: 2, namespace: 'alarisa', ref: {}, deprecated: {}},
            filename: 'test://teqfw.schema.map.json',
            mapId: '@flancer32/alarisa:test-map',
            packageName: '@flancer32/alarisa',
        },
    });
    compile.assertResult({value: compilation});
    const evidence = await builder.exec({adapter, connection, plan: planner.exec({compilation, operation: 'create'})});
    assert.equal(evidence.status, 'complete');
    repository = new Repository({crud, connection, caseSchema, relationSchema});
});

after(async () => {
    await connection?.disconnect();
    await fs.rm(tempRoot, {recursive: true, force: true});
});

describe('Case DEM on a file SQLite database', () => {
    it('creates physical tables, constraints and persistent records', async () => {
        const tables = await connection.getKnex()('sqlite_master')
            .where({type: 'table'}).whereIn('name', ['alarisa_case', 'alarisa_case_relation']).pluck('name');
        assert.deepEqual(tables.sort(), ['alarisa_case', 'alarisa_case_relation']);

        const rootCase = await repository.create({code: 'business', title: 'Business'});
        const child = await repository.create({code: 'alarisa', title: 'Alarisa', parentId: rootCase.primaryKey.id});
        await repository.addRelation({
            sourceCaseId: child.primaryKey.id,
            targetCaseId: rootCase.primaryKey.id,
            relation: 'part-of',
        });

        const {record} = await repository.readByCode({code: 'alarisa'});
        assert.equal(record.code, 'alarisa');
        assert.equal(String(record.parent_id), String(rootCase.primaryKey.id));
        assert.equal(await connection.getKnex()('alarisa_case_relation').count({count: '*'}).first().then((row) => Number(row.count)), 1);

        await assert.rejects(
            repository.create({code: 'business', title: 'Duplicate'}),
            /unique|constraint/i,
        );
    });

    it('rejects primary-parent cycles before commit', async () => {
        const rootCase = (await repository.readByCode({code: 'business'})).record;
        const child = (await repository.readByCode({code: 'alarisa'})).record;
        await assert.rejects(
            repository.reparent({id: rootCase.id, parentId: child.id}),
            /cycle/,
        );
        assert.equal((await repository.readById({id: rootCase.id})).record.parent_id, null);
    });

    it('survives disconnect and reconnect to the same file', async () => {
        await connection.disconnect();
        const di = container();
        connection = await di.get('TeqFw_Db_Back_RDb_Connect$$');
        await connection.init({client: 'sqlite3', connection: {filename}, useNullAsDefault: true});
        const rows = await connection.getKnex()('alarisa_case').orderBy('id');
        assert.deepEqual(rows.map((row) => row.code), ['business', 'alarisa']);
    });
});

