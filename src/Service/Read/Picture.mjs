// @ts-check

/**
 * @namespace Alarisa_Back_State_Service_Read_Picture
 * @description Reads the active current World Picture through a supplied transaction.
 */

const ENTITY_NAMESPACE = '@flancer32/alarisa-back-state/alarisa/state';

/**
 * @param {unknown} value
 * @param {boolean} isPostgres
 * @returns {unknown}
 */
function copyJson(value, isPostgres) {
    if (value === undefined) return null;
    if (!isPostgres && typeof value === 'string') return JSON.parse(value);
    return JSON.parse(JSON.stringify(value));
}

export default class Picture {
    /** Creates a transaction-bound Picture operation. */
    constructor() {
        /**
         * @param {TeqFw_Db_Back_RDb_ITrans} trx
         * @param {string} entity
         * @returns {string}
         */
        const tableName = function (trx, entity) {
            return trx.getTableName(/** @type {any} */ ({getEntityName: function () { return ENTITY_NAMESPACE + '/' + entity; }}));
        };
        /**
         * @param {TeqFw_Db_Back_RDb_ITrans} trx
         * @param {string} entity
         * @param {string[]} columns
         * @param {boolean} active
         * @returns {Promise<object[]>}
         */
        const readRows = async function (trx, entity, columns, active) {
            const query = trx.createQuery().select(columns).from(tableName(trx, entity));
            if (active) query.whereNull('removed_at');
            return /** @type {object[]} */ (await query.orderBy('id', 'asc'));
        };
        /**
         * @param {object} row
         * @returns {object}
         */
        const typeDto = function (row) {
            return row.value_type === undefined
                ? {id: Number(row.id), code: String(row.code), description: row.description === null ? null : String(row.description)}
                : {id: Number(row.id), code: String(row.code), valueType: String(row.value_type), description: row.description === null ? null : String(row.description)};
        };
        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.read = async function (input) {
            const {trx} = input;
            if (!trx || (typeof trx.createQuery !== 'function')) throw new TypeError('Picture.read requires an initialized transaction.');
            const isPostgres = trx.isPostgres();
            const [objectRows, componentTypeRows, componentRows, propertyTypeRows, propertyRows, relationTypeRows, relationRows] = await Promise.all([
                readRows(trx, 'object', ['id'], true),
                readRows(trx, 'component_type', ['id', 'code', 'description'], false),
                readRows(trx, 'component', ['id', 'object_id', 'type_id'], true),
                readRows(trx, 'property_type', ['id', 'code', 'value_type', 'description'], false),
                readRows(trx, 'property', ['id', 'component_id', 'type_id', 'value'], true),
                readRows(trx, 'relation_type', ['id', 'code', 'description', 'inverse_type_id'], false),
                readRows(trx, 'relation', ['id', 'source_object_id', 'relation_type_id', 'target_object_id'], true),
            ]);
            const objects = objectRows.map(function (row) { return {id: Number(row.id), components: []}; });
            const objectById = new Map(objects.map(function (object) { return [object.id, object]; }));
            const componentTypes = componentTypeRows.map(typeDto);
            const propertyTypes = propertyTypeRows.map(typeDto);
            const relationTypes = relationTypeRows.map(typeDto);
            const componentById = new Map();
            for (const row of componentRows) {
                const objectId = Number(row.object_id);
                const object = objectById.get(objectId);
                if (!object) continue;
                const component = {id: Number(row.id), objectId, typeId: Number(row.type_id), properties: []};
                object.components.push(component);
                componentById.set(component.id, component);
            }
            for (const row of propertyRows) {
                const component = componentById.get(Number(row.component_id));
                if (!component) continue;
                component.properties.push({id: Number(row.id), componentId: component.id, typeId: Number(row.type_id), value: copyJson(row.value, isPostgres)});
            }
            const relations = relationRows.map(function (row) {
                return {id: Number(row.id), sourceObjectId: Number(row.source_object_id), typeId: Number(row.relation_type_id), targetObjectId: Number(row.target_object_id)};
            }).filter(function (relation) {
                return objectById.has(relation.sourceObjectId) && objectById.has(relation.targetObjectId);
            });
            return {version: 1, selection: {kind: 'picture'}, objects, componentTypes, propertyTypes, relationTypes, relations};
        };
        /**
         * @param {object} input
         * @returns {object}
         */
        this.select = function (input) {
            const {picture, objectIds, relations, selection} = input;
            const objects = picture.objects.filter(function (object) { return objectIds.has(object.id); });
            const componentTypeIds = new Set(), propertyTypeIds = new Set(), relationTypeIds = new Set();
            for (const object of objects) for (const component of object.components) {
                componentTypeIds.add(component.typeId);
                for (const property of component.properties) propertyTypeIds.add(property.typeId);
            }
            for (const relation of relations) relationTypeIds.add(relation.typeId);
            return {
                version: 1, selection, objects,
                componentTypes: picture.componentTypes.filter(function (type) { return componentTypeIds.has(type.id); }),
                propertyTypes: picture.propertyTypes.filter(function (type) { return propertyTypeIds.has(type.id); }),
                relationTypes: picture.relationTypes.filter(function (type) { return relationTypeIds.has(type.id); }),
                relations,
            };
        };
    }
}
