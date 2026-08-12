// @ts-check

/**
 * @namespace Alarisa_Back_State_Case_Repository
 * @description Transactional access to Case components and their controlled semantic Relations.
 */
export default class Alarisa_Back_State_Case_Repository {
    /**
     * @param {object} deps
     * @param {TeqFw_Db_Back_App_Crud} deps.crud
     * @param {TeqFw_Db_Back_RDb_IConnect} deps.connection
     * @param {Alarisa_Back_State_Object_Schema$} deps.objectSchema
     * @param {Alarisa_Back_State_Case_Schema$} deps.caseSchema
     * @param {Alarisa_Back_State_Relation_Type_Schema$} deps.relationTypeSchema
     * @param {Alarisa_Back_State_Relation_Schema$} deps.relationSchema
     */
    constructor({crud, connection, objectSchema, caseSchema, relationTypeSchema, relationSchema}) {
        const CODE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        const PARENT = 'case-parent';

        /** @param {string} code @param {string} label */
        function assertCode(code, label = 'Code') {
            if (typeof code !== 'string' || code.length > 128 || !CODE.test(code)) {
                throw new TypeError(`${label} must be a lowercase kebab-case string up to 128 characters.`);
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
         * @param {Function} operation
         * @returns {Promise<any>}
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

        /** @param {string} code @param {TeqFw_Db_Back_RDb_ITrans} trx @returns {Promise<object|null>} */
        async function findRelationType(code, trx) {
            const {records} = await crud.readMany({
                schema: relationTypeSchema, trx, conditions: {code}, pagination: {limit: 1},
            });
            return records[0] ?? null;
        }

        /** @param {TeqFw_Db_Back_RDb_ITrans} trx @returns {Promise<object>} */
        async function ensureParentType(trx) {
            const existing = await findRelationType(PARENT, trx);
            if (existing) return existing;
            const {primaryKey} = await crud.createOne({
                schema: relationTypeSchema,
                trx,
                dto: {
                    code: PARENT,
                    description: 'A Case has the target Case as its single primary parent.',
                    constraints: {sourceComponents: ['case'], targetComponents: ['case'], sourceCardinality: 'zero-or-one'},
                },
            });
            return {id: primaryKey.id, code: PARENT};
        }

        /** @param {number|string} id @param {TeqFw_Db_Back_RDb_ITrans} trx @returns {Promise<object>} */
        async function requireCase(id, trx) {
            const {record} = await crud.readOne({schema: caseSchema, trx, key: {object_id: id}});
            if (!record) throw new Error(`Case '${id}' does not exist.`);
            return record;
        }

        /** @param {number|string} id @param {number|string} typeId @param {TeqFw_Db_Back_RDb_ITrans} trx @returns {Promise<object|null>} */
        async function findParentRelation(id, typeId, trx) {
            const {records} = await crud.readMany({
                schema: relationSchema,
                trx,
                conditions: {source_object_id: id, relation_type_id: typeId, archived_at: null},
                pagination: {limit: 2},
            });
            if (records.length > 1) throw new Error(`Case '${id}' has more than one primary parent.`);
            return records[0] ?? null;
        }

        /** @param {object} record @param {TeqFw_Db_Back_RDb_ITrans} trx @returns {Promise<object>} */
        async function withParent(record, trx) {
            const type = await findRelationType(PARENT, trx);
            const relation = type ? await findParentRelation(/** @type {number|string} */ (record.object_id), /** @type {number|string} */ (type.id), trx) : null;
            return {...record, id: record.object_id, parent_id: relation?.target_object_id ?? null};
        }

        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.create = async function (input) {
            const {code, title, description = null, parentId = null, trx} = input;
            assertCode(code, 'Case code');
            assertText(title, 'Case title', 255);
            if (description !== null && typeof description !== 'string') throw new TypeError('Case description must be a string or null.');
            return transact(trx, async (active) => {
                if (parentId !== null) await requireCase(parentId, active);
                const object = await crud.createOne({schema: objectSchema, trx: active, dto: {}});
                const id = object.primaryKey.id;
                await crud.createOne({schema: caseSchema, trx: active, dto: {object_id: id, code, title, description}});
                if (parentId !== null) {
                    const type = await ensureParentType(active);
                    await crud.createOne({
                        schema: relationSchema, trx: active,
                        dto: {source_object_id: id, relation_type_id: type.id, target_object_id: parentId},
                    });
                }
                return {primaryKey: {id, object_id: id}};
            });
        };

        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.readById = async function (input) {
            const {id, trx} = input;
            return transact(trx, async (active) => {
                const {record} = await crud.readOne({schema: caseSchema, trx: active, key: {object_id: id}});
                return {record: record ? await withParent(record, active) : null};
            });
        };

        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.readByCode = async function (input) {
            const {code, trx} = input;
            assertCode(code, 'Case code');
            return transact(trx, async (active) => {
                const {records} = await crud.readMany({schema: caseSchema, trx: active, conditions: {code}, pagination: {limit: 1}});
                return {record: records[0] ? await withParent(records[0], active) : null};
            });
        };

        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.updateDetails = async function (input) {
            const {id, title, description, trx} = input;
            /** @type {Record<string, unknown>} */
            const updates = {};
            if (title !== undefined) {
                assertText(title, 'Case title', 255);
                updates.title = title;
            }
            if (description !== undefined) {
                if (description !== null && typeof description !== 'string') throw new TypeError('Case description must be a string or null.');
                updates.description = description;
            }
            if (Object.keys(updates).length === 0) throw new TypeError('No Case details were provided.');
            return transact(trx, (active) => crud.updateOne({schema: caseSchema, trx: active, key: {object_id: id}, updates}));
        };

        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.reparent = async function (input) {
            const {id, parentId, trx} = input;
            if (String(parentId) === String(id)) throw new Error('A Case cannot be its own parent.');
            return transact(trx, async (active) => {
                await requireCase(id, active);
                const type = await ensureParentType(active);
                const typeId = /** @type {number|string} */ (type.id);
                const currentRelation = await findParentRelation(id, typeId, active);
                if (parentId !== null) {
                    await requireCase(parentId, active);
                    let currentId = parentId;
                    const visited = new Set();
                    while (currentId !== null) {
                        const key = String(currentId);
                        if (key === String(id)) throw new Error('Case reparenting would create a primary-parent cycle.');
                        if (visited.has(key)) throw new Error('The stored Case hierarchy already contains a cycle.');
                        visited.add(key);
                        const relation = await findParentRelation(currentId, typeId, active);
                        currentId = relation ? /** @type {number|string} */ (relation.target_object_id) : null;
                    }
                }
                if (currentRelation) {
                    const relationId = /** @type {number|string} */ (currentRelation.id);
                    if (parentId === null) return crud.deleteOne({schema: relationSchema, trx: active, key: {id: relationId}});
                    return crud.updateOne({
                        schema: relationSchema, trx: active, key: {id: relationId},
                        updates: {target_object_id: parentId},
                    });
                }
                if (parentId === null) return {updatedCount: 0};
                await crud.createOne({
                    schema: relationSchema, trx: active,
                    dto: {source_object_id: id, relation_type_id: type.id, target_object_id: parentId},
                });
                return {updatedCount: 1};
            });
        };

        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.registerRelationType = async function (input) {
            const {code, description, constraints = null, trx} = input;
            assertCode(code, 'Relation type code');
            assertText(description, 'Relation type description', 10000);
            return transact(trx, (active) => crud.createOne({
                schema: relationTypeSchema, trx: active, dto: {code, description, constraints},
            }));
        };

        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.addRelation = async function (input) {
            const sourceId = input.sourceObjectId ?? input.sourceCaseId;
            const targetId = input.targetObjectId ?? input.targetCaseId;
            if (sourceId === undefined || targetId === undefined) throw new TypeError('Source and target Object identities are required.');
            assertCode(input.relation, 'Relation type code');
            if (String(sourceId) === String(targetId)) throw new Error('A semantic Relation must connect distinct Objects.');
            return transact(input.trx, async (active) => {
                const type = await findRelationType(input.relation, active);
                if (!type || type.archived_at !== null) throw new Error(`Relation type '${input.relation}' is not registered and active.`);
                const source = await crud.readOne({schema: objectSchema, trx: active, key: {id: sourceId}});
                const target = await crud.readOne({schema: objectSchema, trx: active, key: {id: targetId}});
                if (!source.record || !target.record) throw new Error('A semantic Relation must reference existing Objects.');
                return crud.createOne({
                    schema: relationSchema, trx: active,
                    dto: {source_object_id: sourceId, relation_type_id: type.id, target_object_id: targetId},
                });
            });
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        crud: 'TeqFw_Db_Back_App_Crud$',
        connection: 'TeqFw_Db_Back_RDb_Connect$',
        objectSchema: 'Alarisa_Back_State_Object_Schema$',
        caseSchema: 'Alarisa_Back_State_Case_Schema$',
        relationTypeSchema: 'Alarisa_Back_State_Relation_Type_Schema$',
        relationSchema: 'Alarisa_Back_State_Relation_Schema$',
    }),
});
