// @ts-check

/** @namespace Alarisa_Back_State_Case_Relation_Schema */
export default class Alarisa_Back_State_Case_Relation_Schema {
    static ATTR = Object.freeze({
        SOURCE_CASE_ID: 'source_case_id', TARGET_CASE_ID: 'target_case_id', RELATION: 'relation',
    });

    constructor() {
        const attrs = Alarisa_Back_State_Case_Relation_Schema.ATTR;
        /** @type {Set<string>} */
        const allowed = new Set(Object.values(attrs));

        this.createDto = function (data = {}) {
            /** @type {Record<string, unknown>} */
            const result = {};
            for (const [key, value] of Object.entries(data)) {
                if (allowed.has(key) && value !== undefined) result[key] = value;
            }
            return result;
        };
        this.getAttributes = () => attrs;
        this.getColumns = () => attrs;
        this.getEntityName = () => '@flancer32/alarisa-back-state/case_relation';
        this.getId = () => [attrs.SOURCE_CASE_ID, attrs.TARGET_CASE_ID, attrs.RELATION];
        this.getLogicalTypes = () => ({
            source_case_id: {id: 'core.integer', params: {bits: 64, unsigned: false}},
            target_case_id: {id: 'core.integer', params: {bits: 64, unsigned: false}},
            relation: {id: 'core.string', params: {length: 64}},
        });
        this.getPrimaryKey = () => [attrs.SOURCE_CASE_ID, attrs.TARGET_CASE_ID, attrs.RELATION];
        this.getTableName = () => 'alarisa_case_relation';
    }
}

