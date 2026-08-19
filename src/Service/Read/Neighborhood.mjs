// @ts-check

/**
 * @namespace Alarisa_Back_State_Service_Read_Neighborhood
 * @description Returns the selected Object's one-hop active local graph.
 */

export default class Neighborhood {
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
            const objectIds = new Set([objectId]);
            for (const relation of full.relations) {
                if (relation.sourceObjectId === objectId) objectIds.add(relation.targetObjectId);
                if (relation.targetObjectId === objectId) objectIds.add(relation.sourceObjectId);
            }
            const relations = full.relations.filter(function (relation) {
                return objectIds.has(relation.sourceObjectId) && objectIds.has(relation.targetObjectId);
            });
            return picture.select({picture: full, objectIds, relations, selection: {kind: 'neighborhood', objectId, hops: 1}});
        };
    }
}

export const __deps__ = Object.freeze({default: Object.freeze({picture: 'Alarisa_Back_State_Service_Read_Picture$'})});
