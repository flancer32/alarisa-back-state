// @ts-check

/**
 * @namespace Alarisa_Back_State_Relation_Schema
 * @description CRUD schema metadata for first-class semantic Relations.
 */
export default class Alarisa_Back_State_Relation_Schema {
    static ATTR = Object.freeze({
        ID: 'id', SOURCE_OBJECT_ID: 'source_object_id', RELATION_TYPE_ID: 'relation_type_id',
        TARGET_OBJECT_ID: 'target_object_id', CREATED_AT: 'created_at', ARCHIVED_AT: 'archived_at',
    });

    /** Construct immutable Relation schema behavior. */
    constructor() {
        const attrs = Alarisa_Back_State_Relation_Schema.ATTR;
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
        this.getEntityName = () => '@flancer32/alarisa-back-state/relation';
        /** @returns {string} */
        this.getId = () => attrs.ID;
        /** @returns {object} */
        this.getLogicalTypes = () => ({
            id: {id: 'core.integer', params: {bits: 64, unsigned: false}},
            source_object_id: {id: 'core.integer', params: {bits: 64, unsigned: false}},
            relation_type_id: {id: 'core.integer', params: {bits: 64, unsigned: false}},
            target_object_id: {id: 'core.integer', params: {bits: 64, unsigned: false}},
            created_at: {id: 'core.datetime', params: {precision: 3, timezone: true}},
            archived_at: {id: 'core.datetime', params: {precision: 3, timezone: true}},
        });
        /** @returns {string[]} */
        this.getPrimaryKey = () => [attrs.ID];
        /** @returns {string} */
        this.getTableName = () => 'alarisa_relation';
    }
}
