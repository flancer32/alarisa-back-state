import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {after, before, describe, it} from 'node:test';
import Container from '@teqfw/di';

const root = path.resolve(import.meta.dirname, '../..');
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'alarisa-back-state-read-'));
let connection;
let di;
let read;
let ids;

function container() {
    const result = new Container();
    result.addNamespaceRoot('Alarisa_Back_State_', path.join(root, 'src'), '.mjs');
    result.addNamespaceRoot('TeqFw_Db_', path.join(root, 'node_modules/@teqfw/db/src'), '.mjs');
    result.addNamespaceRoot('TeqFw_Cfg_', path.join(root, 'node_modules/@teqfw/cfg/src'), '.mjs');
    result.addNamespaceRoot('TeqFw_Log_', path.join(root, 'node_modules/@teqfw/log/src'), '.mjs');
    return result;
}

async function insertOne(knex, table, row) {
    return (await knex(table).insert(row))[0];
}

async function createTables(knex) {
    await knex.schema.createTable('alarisa_state_object', (table) => { table.increments('id'); table.timestamp('created_at').nullable(); table.timestamp('removed_at').nullable(); });
    await knex.schema.createTable('alarisa_state_component_type', (table) => { table.increments('id'); table.string('code'); table.text('description').nullable(); });
    await knex.schema.createTable('alarisa_state_component', (table) => { table.increments('id'); table.integer('object_id'); table.integer('type_id'); table.timestamp('created_at').nullable(); table.timestamp('removed_at').nullable(); });
    await knex.schema.createTable('alarisa_state_property_type', (table) => { table.increments('id'); table.string('code'); table.string('value_type'); table.text('description').nullable(); });
    await knex.schema.createTable('alarisa_state_property', (table) => { table.increments('id'); table.integer('component_id'); table.integer('type_id'); table.text('value'); table.timestamp('created_at').nullable(); table.timestamp('removed_at').nullable(); });
    await knex.schema.createTable('alarisa_state_relation_type', (table) => { table.increments('id'); table.string('code'); table.text('description').nullable(); table.integer('inverse_type_id').nullable(); });
    await knex.schema.createTable('alarisa_state_relation', (table) => { table.increments('id'); table.integer('source_object_id'); table.integer('relation_type_id'); table.integer('target_object_id'); table.timestamp('created_at').nullable(); table.timestamp('removed_at').nullable(); });
    await knex.schema.createTable('alarisa_state_object_extension', (table) => { table.integer('object_id'); table.string('namespace'); table.integer('version'); table.text('data'); });
    await knex.schema.createTable('alarisa_state_change_set', (table) => { table.string('identity').primary(); table.string('status'); table.integer('revision').nullable(); table.text('payload'); table.text('result').nullable(); table.timestamp('processed_at').nullable(); });
    await knex.schema.createTable('alarisa_state_change_set_mutation', (table) => { table.increments('id'); table.string('change_set_identity'); table.integer('ordinal'); table.string('operation'); table.text('payload'); });
}

async function seed(knex) {
    const componentCase = await insertOne(knex, 'alarisa_state_component_type', {code: 'case', description: 'Case'});
    const componentNote = await insertOne(knex, 'alarisa_state_component_type', {code: 'note', description: 'Note'});
    const propertyTitle = await insertOne(knex, 'alarisa_state_property_type', {code: 'title', value_type: 'string', description: 'Title'});
    const propertyRank = await insertOne(knex, 'alarisa_state_property_type', {code: 'rank', value_type: 'number', description: 'Rank'});
    const parentType = await insertOne(knex, 'alarisa_state_relation_type', {code: 'case-parent', description: 'Primary placement'});
    const blocksType = await insertOne(knex, 'alarisa_state_relation_type', {code: 'blocks', description: 'Cross-link'});
    const root = await insertOne(knex, 'alarisa_state_object', {});
    const child = await insertOne(knex, 'alarisa_state_object', {});
    const grandchild = await insertOne(knex, 'alarisa_state_object', {});
    const other = await insertOne(knex, 'alarisa_state_object', {});
    await insertOne(knex, 'alarisa_state_object', {removed_at: '2026-01-01T00:00:00.000Z'});
    const rootCase = await insertOne(knex, 'alarisa_state_component', {object_id: root, type_id: componentCase});
    const childCase = await insertOne(knex, 'alarisa_state_component', {object_id: child, type_id: componentCase});
    const grandchildCase = await insertOne(knex, 'alarisa_state_component', {object_id: grandchild, type_id: componentCase});
    const otherCase = await insertOne(knex, 'alarisa_state_component', {object_id: other, type_id: componentCase});
    const rootNote = await insertOne(knex, 'alarisa_state_component', {object_id: root, type_id: componentNote});
    await insertOne(knex, 'alarisa_state_component', {object_id: child, type_id: componentNote, removed_at: '2026-01-01T00:00:00.000Z'});
    for (const [component, title, rank] of [[rootCase, 'Root', 1], [childCase, 'Child', 2], [grandchildCase, 'Grandchild', 3], [otherCase, 'Other', 4]]) {
        await insertOne(knex, 'alarisa_state_property', {component_id: component, type_id: propertyTitle, value: JSON.stringify(title)});
        await insertOne(knex, 'alarisa_state_property', {component_id: component, type_id: propertyRank, value: JSON.stringify(rank)});
    }
    await insertOne(knex, 'alarisa_state_property', {component_id: rootNote, type_id: propertyTitle, value: JSON.stringify('Note')});
    await insertOne(knex, 'alarisa_state_property', {component_id: childCase, type_id: propertyTitle, value: JSON.stringify('Removed'), removed_at: '2026-01-01T00:00:00.000Z'});
    const childParent = await insertOne(knex, 'alarisa_state_relation', {source_object_id: child, relation_type_id: parentType, target_object_id: root});
    const grandchildParent = await insertOne(knex, 'alarisa_state_relation', {source_object_id: grandchild, relation_type_id: parentType, target_object_id: child});
    const blocks = await insertOne(knex, 'alarisa_state_relation', {source_object_id: child, relation_type_id: blocksType, target_object_id: other});
    await insertOne(knex, 'alarisa_state_relation', {source_object_id: root, relation_type_id: blocksType, target_object_id: other, removed_at: '2026-01-01T00:00:00.000Z'});
    return {root, child, grandchild, other, parentType, childParent, grandchildParent, blocks};
}

function assertNoDatabaseShape(value) {
    if (Array.isArray(value)) {
        for (const item of value) assertNoDatabaseShape(item);
        return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
        assert.ok(!key.includes('_'), `DTO key ${key} leaks a database column name.`);
        assert.notEqual(typeof item, 'function');
        assertNoDatabaseShape(item);
    }
}

function postgresPictureTransaction(propertyRows) {
    const rows = [
        [{id: 1}],
        [{id: 1, code: 'case', description: null}],
        [{id: 1, object_id: 1, type_id: 1}],
        [{id: 1, code: 'value', value_type: 'json', description: null}],
        propertyRows,
        [],
        [],
    ];
    return {
        createQuery() {
            const query = {
                select() { return query; },
                from() { return query; },
                whereNull() { return query; },
                orderBy() { return Promise.resolve(rows.shift()); },
            };
            return query;
        },
        getTableName() { return 'alarisa_state_unused'; },
        isPostgres() { return true; },
    };
}

before(async () => {
    di = container();
    const compile = await di.get('TeqFw_Db_Back_Dem_Compile$');
    const adapter = await di.get('TeqFw_Db_Back_RDb_Dialect_Sqlite$');
    connection = await di.get('TeqFw_Db_Back_RDb_Connect$');
    await connection.init({client: 'sqlite3', connection: {filename: path.join(tempRoot, 'state.sqlite')}});
    connection.setSchemaConfig({prefix: ''});
    const declaration = JSON.parse(await fs.readFile(path.join(root, 'etc/teqfw.schema.json'), 'utf8'));
    const compilation = await compile.exec({
        adapter,
        fragments: [{declaration, filename: path.join(root, 'etc/teqfw.schema.json'), fragmentId: '@flancer32/alarisa-back-state', packageName: '@flancer32/alarisa-back-state'}],
        mapEnvelope: {declaration: {version: 2, namespace: '', ref: {}, deprecated: {}}, filename: 'test://map', mapId: 'map', packageName: '@flancer32/alarisa'},
    });
    compile.assertResult({value: compilation});
    assert.equal(compilation.physical.tables.length, 10);
    await createTables(connection.getClient());
    ids = await seed(connection.getClient());
    read = await di.get('Alarisa_Back_State_Service_Read$');
});

after(async () => {
    await connection?.disconnect();
    await fs.rm(tempRoot, {recursive: true, force: true});
});

describe('current World Picture read contract', () => {
    it('resolves the facade and every focused operation through the package namespace', async () => {
        for (const token of [
            'Alarisa_Back_State_Service_Read$',
            'Alarisa_Back_State_Service_Read_Picture$',
            'Alarisa_Back_State_Service_Read_Tree$',
            'Alarisa_Back_State_Service_Read_Node$',
            'Alarisa_Back_State_Service_Read_Subtree$',
            'Alarisa_Back_State_Service_Read_Neighborhood$',
        ]) assert.ok(await di.get(token));
    });

    it('returns deterministic active graph DTOs without database rows or writes', async () => {
        const knex = connection.getClient();
        const beforeCounts = await Promise.all(['object', 'component', 'property', 'relation'].map(async (entity) => Number((await knex(`alarisa_state_${entity}`).count({count: 'id'}))[0].count)));
        const picture = await read.picture();
        const afterCounts = await Promise.all(['object', 'component', 'property', 'relation'].map(async (entity) => Number((await knex(`alarisa_state_${entity}`).count({count: 'id'}))[0].count)));
        assert.deepEqual(afterCounts, beforeCounts);
        assert.equal(picture.version, 1);
        assert.deepEqual(picture.selection, {kind: 'picture'});
        assert.deepEqual(picture.objects.map((object) => object.id), [ids.root, ids.child, ids.grandchild, ids.other]);
        assert.deepEqual(picture.relations.map((relation) => relation.id), [ids.childParent, ids.grandchildParent, ids.blocks]);
        assert.equal(picture.objects.find((object) => object.id === ids.child).components.length, 1);
        assert.equal(picture.objects.find((object) => object.id === ids.child).components[0].properties.length, 2);
        assert.equal(picture.propertyTypes.find((type) => type.code === 'rank').valueType, 'number');
        assert.deepEqual(picture.componentTypes.map((type) => type.id), [...picture.componentTypes.map((type) => type.id)].sort((left, right) => left - right));
        assertNoDatabaseShape(picture);
    });

    it('preserves PostgreSQL-decoded JSON Property values', async () => {
        const {default: Picture} = await import('../../src/Service/Read/Picture.mjs');
        const values = ['Principal', 42, true, ['case', 2], {status: 'active'}];
        const picture = new Picture();
        const result = await picture.read({trx: postgresPictureTransaction(values.map(function (value, index) {
            return {id: index + 1, component_id: 1, type_id: 1, value};
        }))});
        assert.deepEqual(result.objects[0].components[0].properties.map(function (property) { return property.value; }), values);
    });

    it('builds the primary-parent Case tree and preserves cross-link references when focused', async () => {
        const tree = await read.tree();
        assert.deepEqual(tree.tree.map((node) => node.objectId), [ids.root, ids.other]);
        assert.equal(tree.tree[0].children[0].objectId, ids.child);
        assert.equal(tree.tree[0].children[0].children[0].objectId, ids.grandchild);
        assert.deepEqual(tree.tree[0].children[0].crossLinkRelationIds, [ids.blocks]);
        const subtree = await read.subtree({objectId: ids.child});
        assert.deepEqual(subtree.selection, {kind: 'subtree', objectId: ids.child});
        assert.deepEqual(subtree.objects.map((object) => object.id), [ids.child, ids.grandchild]);
        assert.deepEqual(subtree.relations.map((relation) => relation.id), [ids.grandchildParent, ids.blocks]);
        assert.equal(subtree.relations.find((relation) => relation.id === ids.blocks).targetObjectId, ids.other);
    });

    it('selects only the documented node and one-hop neighbourhood scopes', async () => {
        const node = await read.node({objectId: ids.child});
        assert.deepEqual(node.objects.map((object) => object.id), [ids.child]);
        assert.deepEqual(node.relations.map((relation) => relation.id), [ids.childParent, ids.grandchildParent, ids.blocks]);
        const neighborhood = await read.neighborhood({objectId: ids.child});
        assert.deepEqual(neighborhood.selection, {kind: 'neighborhood', objectId: ids.child, hops: 1});
        assert.deepEqual(neighborhood.objects.map((object) => object.id), [ids.root, ids.child, ids.grandchild, ids.other]);
        assert.deepEqual(neighborhood.relations.map((relation) => relation.id), [ids.childParent, ids.grandchildParent, ids.blocks]);
    });

    it('uses a supplied transaction without finalizing it', async () => {
        const trx = await connection.startTransaction();
        try {
            const picture = await read.picture({trx});
            assert.equal(picture.objects.length, 4);
            const rows = await trx.createQuery().select('id').from('alarisa_state_object').orderBy('id', 'asc');
            assert.equal(rows.length, 5);
        } finally {
            await trx.rollback();
        }
    });

    it('owns and finalizes a facade-created transaction on success and failure', async () => {
        const {default: Read} = await import('../../src/Service/Read.mjs');
        let commits = 0, rollbacks = 0;
        const fakeTrx = {commit: async () => { commits += 1; }, rollback: async () => { rollbacks += 1; }};
        const fakeConnection = /** @type {any} */ ({startTransaction: async () => fakeTrx});
        const success = new Read({connection: fakeConnection, picture: {read: async () => ({ok: true})}, tree: {}, node: {}, subtree: {}, neighborhood: {}});
        assert.deepEqual(await success.picture(), {ok: true});
        assert.deepEqual([commits, rollbacks], [1, 0]);
        const failure = new Read({connection: fakeConnection, picture: {read: async () => { throw new Error('read failed'); }}, tree: {}, node: {}, subtree: {}, neighborhood: {}});
        await assert.rejects(async () => await failure.picture(), /read failed/);
        assert.deepEqual([commits, rollbacks], [1, 1]);
    });

    it('reports duplicate primary parents and cycles deterministically', async () => {
        const knex = connection.getClient();
        const duplicate = await insertOne(knex, 'alarisa_state_relation', {source_object_id: ids.grandchild, relation_type_id: ids.parentType, target_object_id: ids.root});
        await assert.rejects(async () => await read.tree(), {name: 'ReadHierarchyError'});
        await knex('alarisa_state_relation').where({id: duplicate}).delete();
        const cycle = await insertOne(knex, 'alarisa_state_relation', {source_object_id: ids.root, relation_type_id: ids.parentType, target_object_id: ids.grandchild});
        await assert.rejects(async () => await read.tree(), {name: 'ReadHierarchyError'});
        await knex('alarisa_state_relation').where({id: cycle}).delete();
    });
});
