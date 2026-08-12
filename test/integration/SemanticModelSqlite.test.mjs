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
    const objectSchema = await di.get('Alarisa_Back_State_Object_Schema$');
    const caseSchema = await di.get('Alarisa_Back_State_Case_Schema$');
    const relationTypeSchema = await di.get('Alarisa_Back_State_Relation_Type_Schema$');
    const relationSchema = await di.get('Alarisa_Back_State_Relation_Schema$');
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
    repository = new Repository({crud, connection, objectSchema, caseSchema, relationTypeSchema, relationSchema});
});

after(async () => {
    await connection?.disconnect();
    await fs.rm(tempRoot, {recursive: true, force: true});
});

describe('evidence-sourced semantic DEM on a file SQLite database', () => {
    it('creates every v1 layer and preserves coexisting interpretations and assertions', async () => {
        const expected = [
            'alarisa_action_data', 'alarisa_assertion', 'alarisa_assertion_object_support',
            'alarisa_assertion_relation_support', 'alarisa_case_data', 'alarisa_entity_data',
            'alarisa_event_data', 'alarisa_goal_data', 'alarisa_interpretation',
            'alarisa_interpretation_observation', 'alarisa_object', 'alarisa_object_extension',
            'alarisa_obligation_data', 'alarisa_observation', 'alarisa_relation', 'alarisa_relation_type',
        ];
        const tables = await connection.getKnex()('sqlite_master')
            .where({type: 'table'}).whereIn('name', expected).pluck('name');
        assert.deepEqual(tables.sort(), expected);

        const knex = connection.getKnex();
        const [observationId] = await knex('alarisa_observation').insert({
            source: 'principal-message',
            payload: JSON.stringify({text: 'I need to send Andrew the documents by Friday.'}),
        });
        const interpretationIds = [];
        for (const version of ['interpreter-1', 'interpreter-2']) {
            const [interpretationId] = await knex('alarisa_interpretation').insert({
                interpreter_version: version,
                model: 'test-model',
                prompt_version: 'prompt-1',
                ontology_version: 'ontology-1',
            });
            interpretationIds.push(interpretationId);
            await knex('alarisa_interpretation_observation').insert({
                interpretation_id: interpretationId, observation_id: observationId,
            });
            await knex('alarisa_assertion').insert({
                interpretation_id: interpretationId,
                claim: JSON.stringify({type: 'obligation', title: 'Send Andrew the documents'}),
                epistemic_status: version === 'interpreter-1' ? 'strong-inference' : 'weak-inference',
                lifecycle_status: 'candidate',
            });
        }
        assert.equal(await knex('alarisa_interpretation').count({count: '*'}).first().then((row) => Number(row.count)), 2);
        assert.equal(await knex('alarisa_assertion').count({count: '*'}).first().then((row) => Number(row.count)), 2);
    });

    it('uses one Object identity for composable Case and Entity roles', async () => {
        const rootCase = await repository.create({code: 'business', title: 'Business'});
        const child = await repository.create({code: 'teqfw', title: 'TeqFW development', parentId: rootCase.primaryKey.id});
        await connection.getKnex()('alarisa_entity_data').insert({
            object_id: child.primaryKey.id,
            name: 'TeqFW',
            entity_type: 'software-product',
        });

        const {record} = await repository.readByCode({code: 'teqfw'});
        assert.equal(record.id, child.primaryKey.id);
        assert.equal(String(record.parent_id), String(rootCase.primaryKey.id));
        assert.equal(
            await connection.getKnex()('alarisa_entity_data').where({object_id: child.primaryKey.id}).first().then((row) => row.name),
            'TeqFW',
        );
        await assert.rejects(repository.create({code: 'business', title: 'Duplicate'}), /unique|constraint/i);
    });

    it('requires controlled Relation Types and preserves Assertion-to-projection support', async () => {
        const business = (await repository.readByCode({code: 'business'})).record;
        const teqfw = (await repository.readByCode({code: 'teqfw'})).record;
        await assert.rejects(
            repository.addRelation({sourceObjectId: teqfw.id, targetObjectId: business.id, relation: 'supports'}),
            /not registered/,
        );
        await repository.registerRelationType({code: 'supports', description: 'The source supports the target.'});
        const created = await repository.addRelation({
            sourceObjectId: teqfw.id, targetObjectId: business.id, relation: 'supports',
        });
        const assertion = await connection.getKnex()('alarisa_assertion').first('id');
        await connection.getKnex()('alarisa_assertion_object_support').insert({
            assertion_id: assertion.id, object_id: teqfw.id,
        });
        await connection.getKnex()('alarisa_assertion_relation_support').insert({
            assertion_id: assertion.id, relation_id: created.primaryKey.id,
        });
        assert.equal(await connection.getKnex()('alarisa_assertion_relation_support').count({count: '*'}).first().then((row) => Number(row.count)), 1);
    });

    it('rejects primary-parent cycles before commit', async () => {
        const rootCase = (await repository.readByCode({code: 'business'})).record;
        const child = (await repository.readByCode({code: 'teqfw'})).record;
        await assert.rejects(repository.reparent({id: rootCase.id, parentId: child.id}), /cycle/);
        assert.equal((await repository.readById({id: rootCase.id})).record.parent_id, null);
    });

    it('survives disconnect and reconnect to the same file', async () => {
        await connection.disconnect();
        const di = container();
        connection = await di.get('TeqFw_Db_Back_RDb_Connect$$');
        await connection.init({client: 'sqlite3', connection: {filename}, useNullAsDefault: true});
        const rows = await connection.getKnex()('alarisa_case_data').orderBy('object_id');
        assert.deepEqual(rows.map((row) => row.code), ['business', 'teqfw']);
        assert.equal(await connection.getKnex()('alarisa_observation').count({count: '*'}).first().then((row) => Number(row.count)), 1);
    });
});
