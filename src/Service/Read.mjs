// @ts-check

/**
 * @namespace Alarisa_Back_State_Service_Read
 * @description Owns an optional short-lived transaction for coherent current-Picture reads.
 */

export default class Read {
    /**
     * @param {object} deps
     * @param {TeqFw_Db_Back_RDb_IConnect} deps.connection
     * @param {any} deps.picture
     * @param {any} deps.tree
     * @param {any} deps.node
     * @param {any} deps.subtree
     * @param {any} deps.neighborhood
     */
    constructor({connection, picture, tree, node, subtree, neighborhood}) {
        /**
         * @param {TeqFw_Db_Back_RDb_ITrans|undefined} trx
         * @param {(trx: TeqFw_Db_Back_RDb_ITrans) => Promise<object>} operation
         * @returns {Promise<object>}
         */
        const withTransaction = async function (trx, operation) {
            if (trx) return await operation(trx);
            const owned = await connection.startTransaction();
            try {
                const result = await operation(owned);
                await owned.commit();
                return result;
            } catch (error) {
                try {
                    await owned.rollback();
                } catch (_) {
                    // The original read failure is the contract-relevant error.
                }
                throw error;
            }
        };
        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.picture = async function (input = {}) {
            const {trx} = input;
            return await withTransaction(trx, async function (ready) { return await picture.read({trx: ready}); });
        };
        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.tree = async function (input = {}) {
            const {trx, focusObjectId} = input;
            return await withTransaction(trx, async function (ready) { return await tree.read({trx: ready, focusObjectId}); });
        };
        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.node = async function (input) {
            const {trx, objectId} = input;
            return await withTransaction(trx, async function (ready) { return await node.read({trx: ready, objectId}); });
        };
        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.subtree = async function (input) {
            const {trx, objectId} = input;
            return await withTransaction(trx, async function (ready) { return await subtree.read({trx: ready, objectId}); });
        };
        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.neighborhood = async function (input) {
            const {trx, objectId} = input;
            return await withTransaction(trx, async function (ready) { return await neighborhood.read({trx: ready, objectId}); });
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        connection: 'TeqFw_Db_Back_RDb_Connect$',
        picture: 'Alarisa_Back_State_Service_Read_Picture$',
        tree: 'Alarisa_Back_State_Service_Read_Tree$',
        node: 'Alarisa_Back_State_Service_Read_Node$',
        subtree: 'Alarisa_Back_State_Service_Read_Subtree$',
        neighborhood: 'Alarisa_Back_State_Service_Read_Neighborhood$',
    }),
});
