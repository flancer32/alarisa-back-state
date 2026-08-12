import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import ObjectSchema from '../../src/Object/Schema.mjs';
import CaseSchema from '../../src/Case/Schema.mjs';
import RelationSchema from '../../src/Relation/Schema.mjs';
import RelationTypeSchema from '../../src/Relation/Type/Schema.mjs';

describe('semantic projection schema metadata', () => {
    it('keeps Object identity separate from Case code and component data', () => {
        const object = new ObjectSchema();
        const component = new CaseSchema();
        assert.equal(object.getId(), 'id');
        assert.deepEqual(object.getPrimaryKey(), ['id']);
        assert.equal(object.getLogicalTypes().id.params.bits, 64);
        assert.equal(component.getId(), 'object_id');
        assert.deepEqual(component.getPrimaryKey(), ['object_id']);
        assert.equal(component.getLogicalTypes().code.params.length, 128);
        assert.deepEqual(component.createDto({object_id: 3, code: 'business', title: 'Business', kind: 'case'}), {
            object_id: 3, code: 'business', title: 'Business',
        });
    });

    it('gives Relation and controlled Relation Type independent identities', () => {
        assert.deepEqual(new RelationSchema().getPrimaryKey(), ['id']);
        assert.deepEqual(new RelationTypeSchema().getPrimaryKey(), ['id']);
        assert.equal(new RelationSchema().getLogicalTypes().relation_type_id.params.bits, 64);
    });
});
