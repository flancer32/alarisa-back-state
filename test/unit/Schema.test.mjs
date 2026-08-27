import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {describe, it} from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');

describe('State DEM declaration', () => {
    it('describes the open World Model and ChangeSet journal', async () => {
        const schema = JSON.parse(await fs.readFile(path.join(root, 'etc/teqfw.schema.json'), 'utf8'));
        const state = schema.package.alarisa.package.state;
        assert.equal(schema.version, 2);
        assert.deepEqual(Object.keys(state.entity).sort(), [
            'change_set', 'change_set_mutation', 'component', 'component_type',
            'object', 'object_extension', 'property', 'property_type', 'relation', 'relation_type',
        ]);
        assert.ok(state.entity.component.relation.object);
        assert.ok(state.entity.property.relation.component);
        assert.ok(state.entity.relation.relation.source);
        assert.equal(state.entity.change_set.index.identity_unique.kind, 'primary');
        assert.equal(state.entity.change_set_mutation.index.order_unique.kind, 'unique');
        assert.equal(state.entity.component.relation.object.ref.path, '/alarisa/state/object');

        const identities = Object.values(state.entity).filter((entity) => entity.attr?.id);
        assert.equal(identities.length, 8);
        for (const entity of identities) {
            assert.deepEqual(entity.attr.id.type, {id: 'core.integer', params: {bits: 64, unsigned: false}});
            assert.deepEqual(entity.attr.id.generation, {kind: 'core.identity', params: {mode: 'byDefault'}});
            assert.equal(entity.index.id_unique.kind, 'unique');
        }
    });
});
