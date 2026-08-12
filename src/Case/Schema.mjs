// @ts-check

/**
 * @namespace Alarisa_Back_State_Case_Schema
 * @description CRUD schema metadata for the current Case semantic component.
 */
export default class Alarisa_Back_State_Case_Schema {
    static ATTR = Object.freeze({
        OBJECT_ID: 'object_id', CODE: 'code', TITLE: 'title', DESCRIPTION: 'description',
    });

    /** Construct immutable Case component schema behavior. */
    constructor() {
        const attrs = Alarisa_Back_State_Case_Schema.ATTR;
        /** @type {Set<string>} */
        const allowed = new Set(Object.values(attrs));

        /** @param {object} data @returns {object} */
        this.createDto = function (data = {}) {
            /** @type {Record<string, unknown>} */
            const result = {};
            for (const [key, value] of Object.entries(data)) {
                if (allowed.has(key) && value !== undefined) result[key] = value;
            }
            return result;
        };
        /** @returns {object} */
        this.getAttributes = () => attrs;
        /** @returns {object} */
        this.getColumns = () => attrs;
        /** @returns {string} */
        this.getEntityName = () => '@flancer32/alarisa-back-state/case_data';
        /** @returns {string} */
        this.getId = () => attrs.OBJECT_ID;
        /** @returns {object} */
        this.getLogicalTypes = () => ({
            object_id: {id: 'core.integer', params: {bits: 64, unsigned: false}},
            code: {id: 'core.string', params: {length: 128}},
            title: {id: 'core.string', params: {length: 255}},
            description: {id: 'core.text', params: {}},
        });
        /** @returns {string[]} */
        this.getPrimaryKey = () => [attrs.OBJECT_ID];
        /** @returns {string} */
        this.getTableName = () => 'alarisa_case_data';
    }
}
