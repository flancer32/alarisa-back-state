// @ts-check

/**
 * @namespace Alarisa_Back_State_Service_Read_Tree
 * @description Projects the active Case Map as a deterministic tree without mutating State.
 */

export default class Tree {
    /**
     * @param {object} deps
     * @param {any} deps.picture
     */
    constructor({picture}) {
        /**
         * @param {string} message
         * @returns {Error}
         */
        const hierarchyError = function (message) {
            const error = new Error(message);
            error.name = 'ReadHierarchyError';
            return error;
        };
        /**
         * @param {object} input
         * @returns {Promise<object>}
         */
        this.read = async function (input) {
            const {trx, focusObjectId, selectionKind = 'tree'} = input;
            const full = await picture.read({trx});
            const caseType = full.componentTypes.find(function (type) { return type.code === 'case'; });
            const caseIds = new Set(full.objects.filter(function (object) {
                return caseType && object.components.some(function (component) { return component.typeId === caseType.id; });
            }).map(function (object) { return object.id; }));
            const primaryType = full.relationTypes.find(function (type) { return type.code === 'case-parent'; });
            const parentByChild = new Map(), childrenByParent = new Map();
            for (const id of caseIds) childrenByParent.set(id, []);
            const primaryRelations = full.relations.filter(function (relation) {
                return primaryType && relation.typeId === primaryType.id && caseIds.has(relation.sourceObjectId) && caseIds.has(relation.targetObjectId);
            });
            for (const relation of primaryRelations) {
                if (parentByChild.has(relation.sourceObjectId)) throw hierarchyError(`Object ${relation.sourceObjectId} has more than one active case-parent Relation.`);
                parentByChild.set(relation.sourceObjectId, relation.targetObjectId);
                childrenByParent.get(relation.targetObjectId).push(relation.sourceObjectId);
            }
            for (const children of childrenByParent.values()) children.sort(function (left, right) { return left - right; });
            for (const id of caseIds) {
                const visited = new Set();
                let current = id;
                while (parentByChild.has(current)) {
                    if (visited.has(current)) throw hierarchyError(`A case-parent cycle includes Object ${current}.`);
                    visited.add(current);
                    current = parentByChild.get(current);
                }
            }
            const roots = [...caseIds].filter(function (id) { return !parentByChild.has(id); }).sort(function (left, right) { return left - right; });
            if ((focusObjectId !== undefined) && !caseIds.has(focusObjectId)) {
                const error = new RangeError(`Object ${focusObjectId} is not an active Case.`);
                error.name = 'ReadSelectionError';
                throw error;
            }
            const selectedIds = new Set();
            /**
             * @param {number} id
             * @returns {void}
             */
            const collect = function (id) {
                selectedIds.add(id);
                for (const child of childrenByParent.get(id)) collect(child);
            };
            if (focusObjectId === undefined) for (const root of roots) collect(root);
            else collect(focusObjectId);
            const relations = full.relations.filter(function (relation) {
                const primary = primaryType && relation.typeId === primaryType.id;
                return primary
                    ? selectedIds.has(relation.sourceObjectId) && selectedIds.has(relation.targetObjectId)
                    : selectedIds.has(relation.sourceObjectId) || selectedIds.has(relation.targetObjectId);
            });
            const crossLinksByObject = new Map();
            for (const id of selectedIds) crossLinksByObject.set(id, []);
            for (const relation of relations) {
                if (primaryType && relation.typeId === primaryType.id) continue;
                if (selectedIds.has(relation.sourceObjectId)) crossLinksByObject.get(relation.sourceObjectId).push(relation.id);
                if (selectedIds.has(relation.targetObjectId)) crossLinksByObject.get(relation.targetObjectId).push(relation.id);
            }
            /**
             * @param {number} id
             * @returns {object}
             */
            const node = function (id) {
                return {objectId: id, children: childrenByParent.get(id).filter(function (child) { return selectedIds.has(child); }).map(node), crossLinkRelationIds: crossLinksByObject.get(id)};
            };
            const treeRoots = focusObjectId === undefined ? roots : [focusObjectId];
            const result = picture.select({
                picture: full,
                objectIds: selectedIds,
                relations,
                selection: focusObjectId === undefined ? {kind: selectionKind} : {kind: selectionKind, objectId: focusObjectId},
            });
            return {...result, tree: treeRoots.map(node)};
        };
    }
}

export const __deps__ = Object.freeze({default: Object.freeze({picture: 'Alarisa_Back_State_Service_Read_Picture$'})});
