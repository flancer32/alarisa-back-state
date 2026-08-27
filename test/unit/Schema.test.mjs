import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {describe, it} from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');

describe('State DEM declaration', () => {
    it('describes the open World Model and ChangeSet journal', async () => {
        const schema = JSON.parse(await fs.readFile(path.join(root, 'etc/teqfw.schema.json'), 'utf8'));
        const state = schema.package.alarisa.package.state;
        const entities = {
            object: state.entity.object,
            component: state.entity.component,
            property: state.entity.property,
            relation: state.entity.relation,
            change_set: state.package.change.entity.set,
            change_set_mutation: state.package.change.package.set.entity.mutation,
            component_type: state.package.component.entity.type,
            object_extension: state.package.object.entity.extension,
            property_type: state.package.property.entity.type,
            relation_type: state.package.relation.entity.type,
        };
        assert.equal(schema.version, 2);
        assert.deepEqual(Object.keys(entities).sort(), [
            'change_set', 'change_set_mutation', 'component', 'component_type',
            'object', 'object_extension', 'property', 'property_type', 'relation', 'relation_type',
        ]);
        assert.ok(entities.component.relation.object);
        assert.ok(entities.property.relation.component);
        assert.ok(entities.relation.relation.source);
        assert.equal(entities.change_set.index.identity_unique.kind, 'primary');
        assert.equal(entities.change_set_mutation.index.order_unique.kind, 'unique');
        assert.equal(entities.component.relation.object.ref.path, '/alarisa/state/object');
        assert.equal(entities.component.relation.type.ref.path, '/alarisa/state/component/type');
        assert.equal(entities.change_set_mutation.relation.change_set.ref.path, '/alarisa/state/change/set');

        const identities = Object.values(entities).filter((entity) => entity.attr?.id);
        assert.equal(identities.length, 8);
        for (const entity of identities) {
            assert.deepEqual(entity.attr.id.type, {id: 'core.integer', params: {bits: 64, unsigned: false}});
            assert.deepEqual(entity.attr.id.generation, {kind: 'core.identity', params: {mode: 'byDefault'}});
            assert.equal(entity.index.id_unique.kind, 'unique');
        }
    });
});
