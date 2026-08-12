// @ts-check

/**
 * @namespace Alarisa_Back_State_Relation_Type_Schema
 * @description CRUD schema metadata for the controlled Relation Type vocabulary.
 */
export default class Alarisa_Back_State_Relation_Type_Schema {
    static ATTR = Object.freeze({
        ID: 'id', CODE: 'code', DESCRIPTION: 'description', INVERSE_TYPE_ID: 'inverse_type_id',
        CONSTRAINTS: 'constraints', ARCHIVED_AT: 'archived_at',
    });

    /** Construct immutable Relation Type schema behavior. */
    constructor() {
        const attrs = Alarisa_Back_State_Relation_Type_Schema.ATTR;
        /** @type {Set<string>} */
        const allowed = new Set(Object.values(attrs));
        /** @param {object} data @returns {object} */
        this.createDto = function (data = {}) {
            /** @type {Record<string, unknown>} */
            const result = {};
            for (const [key, value] of Object.entries(data)) if (allowed.has(key) && value !== undefined) result[key] = value;
            return result;
        };
        /** @returns {object} */
        this.getAttributes = () => attrs;
        /** @returns {object} */
        this.getColumns = () => attrs;
        /** @returns {string} */
        this.getEntityName = () => '@flancer32/alarisa-back-state/relation_type';
        /** @returns {string} */
        this.getId = () => attrs.ID;
        /** @returns {object} */
        this.getLogicalTypes = () => ({
            id: {id: 'core.integer', params: {bits: 64, unsigned: false}},
            code: {id: 'core.string', params: {length: 128}},
            description: {id: 'core.text', params: {}},
            inverse_type_id: {id: 'core.integer', params: {bits: 64, unsigned: false}},
            constraints: {id: 'core.json', params: {}},
            archived_at: {id: 'core.datetime', params: {precision: 3, timezone: true}},
        });
        /** @returns {string[]} */
        this.getPrimaryKey = () => [attrs.ID];
        /** @returns {string} */
        this.getTableName = () => 'alarisa_relation_type';
    }
}
