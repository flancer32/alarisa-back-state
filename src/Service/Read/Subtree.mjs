// @ts-check

/**
 * @namespace Alarisa_Back_State_Service_Read_Subtree
 * @description Returns a focused Case subtree without transaction ownership.
 */

export default class Subtree {
    /**
     * @param {object} deps
     * @param {any} deps.tree
     */
    constructor({tree}) {
        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.read = async function (input) {
            const {trx, objectId} = input;
            return await tree.read({trx, focusObjectId: objectId, selectionKind: 'subtree'});
        };
    }
}

export const __deps__ = Object.freeze({default: Object.freeze({tree: 'Alarisa_Back_State_Service_Read_Tree$'})});
