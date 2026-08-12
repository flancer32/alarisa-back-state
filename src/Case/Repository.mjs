// @ts-check

/** @namespace Alarisa_Back_State_Case_Repository */
export default class Alarisa_Back_State_Case_Repository {
    /**
     * @param {object} deps
     * @param {TeqFw_Db_Back_App_Crud} deps.crud
     * @param {TeqFw_Db_Back_RDb_IConnect} deps.connection
     * @param {Alarisa_Back_State_Case_Schema$} deps.caseSchema
     * @param {Alarisa_Back_State_Case_Relation_Schema$} deps.relationSchema
     */
    constructor({crud, connection, caseSchema, relationSchema}) {
        const CODE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

        /** @param {string} code */
        function assertCode(code) {
            if (typeof code !== 'string' || code.length > 128 || !CODE.test(code)) {
                throw new TypeError('Case code must be a lowercase kebab-case string up to 128 characters.');
            }
        }

        /** @param {string} value @param {string} name @param {number} max */
        function assertText(value, name, max) {
            if (typeof value !== 'string' || value.length === 0 || value.length > max) {
                throw new TypeError(`${name} must be a non-empty string up to ${max} characters.`);
            }
        }

        /**
         * @param {TeqFw_Db_Back_RDb_ITrans|undefined} outer
         * @param {(trx: TeqFw_Db_Back_RDb_ITrans) => Promise<any>} operation
         */
        async function transact(outer, operation) {
            const trx = outer ?? await connection.startTransaction();
            try {
                const result = await operation(trx);
                if (!outer) await trx.commit();
                return result;
            } catch (error) {
                if (!outer) await trx.rollback();
                throw error;
            }
        }

        /** @param {number|string} id @param {TeqFw_Db_Back_RDb_ITrans} trx */
        async function requireCase(id, trx) {
            const {record} = await crud.readOne({schema: caseSchema, trx, key: {id}});
            if (!record) throw new Error(`Case '${id}' does not exist.`);
            return record;
        }

        /** @param {{code: string, title: string, description?: string|null, parentId?: number|string|null, trx?: TeqFw_Db_Back_RDb_ITrans}} input */
        this.create = async function (input) {
            const {code, title, description = null, parentId = null, trx} = input;
            assertCode(code);
            assertText(title, 'Case title', 255);
            if (description !== null && typeof description !== 'string') {
                throw new TypeError('Case description must be a string or null.');
            }
            return transact(trx, async (active) => {
                if (parentId !== null) await requireCase(parentId, active);
                return crud.createOne({
                    schema: caseSchema, trx: active,
                    dto: {code, title, description, parent_id: parentId},
                });
            });
        };

        /** @param {{id: number|string, trx?: TeqFw_Db_Back_RDb_ITrans}} input */
        this.readById = async function ({id, trx}) {
            return transact(trx, (active) => crud.readOne({schema: caseSchema, trx: active, key: {id}}));
        };

        /** @param {{code: string, trx?: TeqFw_Db_Back_RDb_ITrans}} input */
        this.readByCode = async function ({code, trx}) {
            assertCode(code);
            return transact(trx, async (active) => {
                const {records} = await crud.readMany({schema: caseSchema, trx: active, conditions: {code}, pagination: {limit: 1}});
                return {record: records[0] ?? null};
            });
        };

        /** @param {{id: number|string, title?: string, description?: string|null, trx?: TeqFw_Db_Back_RDb_ITrans}} input */
        this.updateDetails = async function ({id, title, description, trx}) {
            /** @type {Record<string, unknown>} */
            const updates = {};
            if (title !== undefined) {
                assertText(title, 'Case title', 255);
                updates.title = title;
            }
            if (description !== undefined) {
                if (description !== null && typeof description !== 'string') {
                    throw new TypeError('Case description must be a string or null.');
                }
                updates.description = description;
            }
            if (Object.keys(updates).length === 0) throw new TypeError('No Case details were provided.');
            return transact(trx, (active) => crud.updateOne({schema: caseSchema, trx: active, key: {id}, updates}));
        };

        /** @param {{id: number|string, parentId: number|string|null, trx?: TeqFw_Db_Back_RDb_ITrans}} input */
        this.reparent = async function ({id, parentId, trx}) {
            if (parentId === id) throw new Error('A Case cannot be its own parent.');
            return transact(trx, async (active) => {
                await requireCase(id, active);
                if (parentId !== null) {
                    /** @type {Record<string, unknown>} */
                    let current = await requireCase(parentId, active);
                    const visited = new Set();
                    while (current) {
                        const key = String(current.id);
                        if (key === String(id)) throw new Error('Case reparenting would create a primary-parent cycle.');
                        if (visited.has(key)) throw new Error('The stored Case hierarchy already contains a cycle.');
                        visited.add(key);
                        if (current.parent_id === null) break;
                        if (typeof current.parent_id !== 'number' && typeof current.parent_id !== 'string') {
                            throw new Error('Stored parent identity has an invalid type.');
                        }
                        current = await requireCase(current.parent_id, active);
                    }
                }
                return crud.updateOne({schema: caseSchema, trx: active, key: {id}, updates: {parent_id: parentId}});
            });
        };

        /** @param {{sourceCaseId: number|string, targetCaseId: number|string, relation: string, trx?: TeqFw_Db_Back_RDb_ITrans}} input */
        this.addRelation = async function ({sourceCaseId, targetCaseId, relation, trx}) {
            assertText(relation, 'Case relation', 64);
            if (sourceCaseId === targetCaseId) throw new Error('A semantic Case relation must connect distinct Cases.');
            return transact(trx, async (active) => {
                await requireCase(sourceCaseId, active);
                await requireCase(targetCaseId, active);
                return crud.createOne({
                    schema: relationSchema, trx: active,
                    dto: {source_case_id: sourceCaseId, target_case_id: targetCaseId, relation},
                });
            });
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        crud: 'TeqFw_Db_Back_App_Crud$',
        connection: 'TeqFw_Db_Back_RDb_Connect$',
        caseSchema: 'Alarisa_Back_State_Case_Schema$',
        relationSchema: 'Alarisa_Back_State_Case_Relation_Schema$',
    }),
});

