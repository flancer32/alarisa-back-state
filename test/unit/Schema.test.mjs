import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import CaseSchema from '../../src/Case/Schema.mjs';
import RelationSchema from '../../src/Case/Relation/Schema.mjs';

describe('Case schema metadata', () => {
    it('keeps identity separate from the human-readable code', () => {
        const schema = new CaseSchema();
        assert.equal(schema.getId(), 'id');
        assert.deepEqual(schema.getPrimaryKey(), ['id']);
        assert.equal(schema.getLogicalTypes().id.params.bits, 64);
        assert.equal(schema.getLogicalTypes().code.params.length, 128);
        assert.deepEqual(schema.createDto({id: undefined, code: 'business', title: 'Business', ignored: true}), {
            code: 'business', title: 'Business',
        });
    });

    it('uses the complete directed relation identity as its key', () => {
        const schema = new RelationSchema();
        assert.deepEqual(schema.getPrimaryKey(), ['source_case_id', 'target_case_id', 'relation']);
    });
});

