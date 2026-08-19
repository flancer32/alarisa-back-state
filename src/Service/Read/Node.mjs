// @ts-check

/**
 * @namespace Alarisa_Back_State_Service_Read_Node
 * @description Returns one active Object and its incident active Relations.
 */

export default class Node {
    /**
     * @param {object} deps
     * @param {any} deps.picture
     */
    constructor({picture}) {
        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.read = async function (input) {
            const {trx, objectId} = input;
            const full = await picture.read({trx});
            if (!full.objects.some(function (object) { return object.id === objectId; })) {
                const error = new RangeError(`Object ${objectId} is not active.`);
                error.name = 'ReadSelectionError';
                throw error;
            }
            const relations = full.relations.filter(function (relation) {
                return relation.sourceObjectId === objectId || relation.targetObjectId === objectId;
            });
            return picture.select({picture: full, objectIds: new Set([objectId]), relations, selection: {kind: 'node', objectId}});
        };
    }
}

export const __deps__ = Object.freeze({default: Object.freeze({picture: 'Alarisa_Back_State_Service_Read_Picture$'})});
