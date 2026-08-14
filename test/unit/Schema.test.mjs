import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {describe, it} from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');

describe('State DEM declaration', () => {
    it('describes the open World Model and ChangeSet journal', async () => {
        const schema = JSON.parse(await fs.readFile(path.join(root, 'etc/teqfw.schema.json'), 'utf8'));
        assert.equal(schema.version, 2);
        assert.deepEqual(Object.keys(schema.entity).sort(), [
            'change_set', 'change_set_mutation', 'component', 'component_type',
            'object', 'object_extension', 'property', 'property_type', 'relation', 'relation_type',
        ]);
        assert.ok(schema.entity.component.relation.object);
        assert.ok(schema.entity.property.relation.component);
        assert.ok(schema.entity.relation.relation.source);
        assert.equal(schema.entity.change_set.index.identity_unique.kind, 'primary');
        assert.equal(schema.entity.change_set_mutation.index.order_unique.kind, 'unique');
    });
});
