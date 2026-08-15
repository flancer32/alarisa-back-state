# World Data Authoring and ChangeSet Drafts

## Purpose and status

Use this reference when an agent must turn application facts into a portable
fragment of one delegated Assistant's World Model. The output is independent of
the physical DEM tables and contains no database-generated identifiers.

This document defines a skill-level authoring contract, not a runtime API. The
current package publishes the DEM but has no State transition service that
accepts this document. A host adapter or future State service must resolve the
authoring references, produce the normalized ChangeSet shape, and persist it.
Writing this YAML or JSON file alone does not change the database.

The authoring contract has two layers:

1. a **World Fragment** is the agent-friendly description of application data;
2. a **ChangeSet draft** is the ordered primitive representation prepared for a
   State boundary.

Do not collapse these layers. Codes and external references are useful while
authoring, but State Mutations address existing fragments by State identity or
by a ChangeSet-local reference.

## World Fragment format

The canonical portable format is JSON-compatible YAML:

~~~yaml
format: alarisa.world-fragment/v1
changeIdentity: case-map:2026-08-15:001

vocabulary:
  componentTypes:
    - code: case
      mode: resolve-or-create
      description: One distinct matter maintained in the World Model.
  propertyTypes:
    - code: code
      mode: resolve-or-create
      valueType: string
    - code: title
      mode: resolve-or-create
      valueType: string
    - code: description
      mode: resolve-or-create
      valueType: text
  relationTypes:
    - code: case-parent
      mode: resolve-or-create
      description: Primary Case Map placement.

objects:
  - ref: case:home
    mode: create
    components:
      - type: case
        properties:
          code: home
          title: Home
          description: Personal household matters.

  - ref: case:taxes
    mode: create
    components:
      - type: case
        properties:
          code: taxes
          title: Taxes
          description: Annual tax preparation.

relations:
  - ref: relation:taxes-parent
    mode: create
    type: case-parent
    source: case:taxes
    target: case:home
~~~

The same structure may be emitted as JSON. The format is deliberately
application-oriented:

- **changeIdentity** is the caller-assigned immutable ChangeSet identity;
- **vocabulary** declares or references controlled Component, Property, and
  Relation Types by stable codes;
- a vocabulary mode is **resolve**, **create**, or **resolve-or-create**;
  use **resolve-or-create** only when the adapter can safely read and
  de-duplicate existing vocabulary;
- every object ref is unique within the fragment;
- an object or relation mode is **resolve** or **create**; **resolve** requires
  a current State binding before a Mutation can be emitted;
- a component type is referenced by its Component Type code;
- the properties map uses Property Type codes as keys and JSON values as
  values;
- every relation has a ref, a Relation Type code, and two object references.

The fragment may contain goals, obligations, actions, events, or entities by
declaring those as Component Type codes. They remain Components on Objects; do
not turn them into fixed object classes or special record shapes.

An object may also carry experimental extensions:

~~~yaml
extensions:
  - namespace: example.project
    version: 1
    data:
      externalKey: ABC-123
~~~

Extensions require a namespace, version, and JSON data. They are not a
replacement for stable Components, typed Properties, or Relations.

## Authoring rules

- Do not put database-generated Object, Component, Property, or Relation IDs in
  a portable World Fragment.
- Mark newly created objects and relations with mode **create**. Mark existing
  objects and relations with mode **resolve** and provide a State resolution
  before compiling the ChangeSet.
- For vocabulary, use **resolve** when the code must already exist, **create**
  when the ChangeSet owns its creation, and **resolve-or-create** only when the
  adapter has an atomic de-duplication strategy.
- Use one stable external ref for every object and relation. Do not use a title
  as a reference.
- A Case is represented by an Object with a case Component. Its code is a
  Property, not the Object identity.
- A durable reference between Objects is a Relation, not a Property containing
  another object's code.
- Use controlled Relation Type codes. Never invent an arbitrary predicate string
  in a relation instance.
- Use JSON-native scalar, array, or object values for Properties. The declared
  valueType is semantic vocabulary; it does not make arbitrary text valid.
- Put only fully determined accepted World Model meaning in this fragment.
  Observations, Interpretations, Assertions, Reconciliation records, guesses,
  and unresolved alternatives belong outside State.
- Keep all objects and relations inside one delegated Assistant scope. The
  current DEM has no explicit scope field, so an external host must provide the
  scope boundary.
- If a fact is ambiguous, do not silently choose a target, parent, type, or
  identity. Emit an unresolved item for the caller instead of a speculative
  relation or Mutation.

## Existing State and reference resolution

The World Fragment uses application references; a ChangeSet uses State
identities. Before compiling a fragment, the adapter must:

1. read the current State for every referenced existing Object and vocabulary
   Type;
2. build a resolution map from external references or controlled codes to State
   identities;
3. reject missing or ambiguous existing targets;
4. allocate a ChangeSet-local reference for every newly created identity-bearing
   fragment;
5. emit Mutations that use only resolved State identities or local references.

For example, the authoring reference case:taxes may become the local reference
$object:case:taxes when created in this ChangeSet, or State identity 481 when it
already exists. A Mutation must never search by title, code, or meaning at
application time.

The resolution map is not a replacement for State identity. It is an adapter
input/output used to construct one ChangeSet and to report successful
local-reference bindings after acceptance.

## Normalized ChangeSet draft

The following JSON is the canonical skill-level draft for the example above.
The operation and field names are explicit so an adapter can map them to the
eventual State API. They are not a claim that the current package already
exposes these operations.

~~~json
{
  "format": "alarisa.change-set/v1",
  "identity": "case-map:2026-08-15:001",
  "preconditions": [],
  "mutations": [
    {
      "ordinal": 0,
      "operation": "create.componentType",
      "localRef": "$component-type:case",
      "code": "case",
      "description": "One distinct matter maintained in the World Model."
    },
    {
      "ordinal": 1,
      "operation": "create.propertyType",
      "localRef": "$property-type:code",
      "code": "code",
      "valueType": "string"
    },
    {
      "ordinal": 2,
      "operation": "create.propertyType",
      "localRef": "$property-type:title",
      "code": "title",
      "valueType": "string"
    },
    {
      "ordinal": 3,
      "operation": "create.propertyType",
      "localRef": "$property-type:description",
      "code": "description",
      "valueType": "text"
    },
    {
      "ordinal": 4,
      "operation": "create.relationType",
      "localRef": "$relation-type:case-parent",
      "code": "case-parent",
      "description": "Primary Case Map placement."
    },
    {
      "ordinal": 5,
      "operation": "create.object",
      "localRef": "$object:case:home"
    },
    {
      "ordinal": 6,
      "operation": "create.component",
      "localRef": "$component:case:home",
      "objectRef": "$object:case:home",
      "componentTypeRef": "$component-type:case"
    },
    {
      "ordinal": 7,
      "operation": "create.property",
      "localRef": "$property:case:home:code",
      "componentRef": "$component:case:home",
      "propertyTypeRef": "$property-type:code",
      "value": "home"
    },
    {
      "ordinal": 8,
      "operation": "create.property",
      "localRef": "$property:case:home:title",
      "componentRef": "$component:case:home",
      "propertyTypeRef": "$property-type:title",
      "value": "Home"
    },
    {
      "ordinal": 9,
      "operation": "create.property",
      "localRef": "$property:case:home:description",
      "componentRef": "$component:case:home",
      "propertyTypeRef": "$property-type:description",
      "value": "Personal household matters."
    },
    {
      "ordinal": 10,
      "operation": "create.object",
      "localRef": "$object:case:taxes"
    },
    {
      "ordinal": 11,
      "operation": "create.component",
      "localRef": "$component:case:taxes",
      "objectRef": "$object:case:taxes",
      "componentTypeRef": "$component-type:case"
    },
    {
      "ordinal": 12,
      "operation": "create.property",
      "localRef": "$property:case:taxes:code",
      "componentRef": "$component:case:taxes",
      "propertyTypeRef": "$property-type:code",
      "value": "taxes"
    },
    {
      "ordinal": 13,
      "operation": "create.property",
      "localRef": "$property:case:taxes:title",
      "componentRef": "$component:case:taxes",
      "propertyTypeRef": "$property-type:title",
      "value": "Taxes"
    },
    {
      "ordinal": 14,
      "operation": "create.property",
      "localRef": "$property:case:taxes:description",
      "componentRef": "$component:case:taxes",
      "propertyTypeRef": "$property-type:description",
      "value": "Annual tax preparation."
    },
    {
      "ordinal": 15,
      "operation": "create.relation",
      "localRef": "$relation:taxes-parent",
      "sourceObjectRef": "$object:case:taxes",
      "relationTypeRef": "$relation-type:case-parent",
      "targetObjectRef": "$object:case:home"
    }
  ]
}
~~~

For an existing fragment, replace the relevant local reference with a resolved
State identity and use a typed update or remove Mutation. Do not emit a
business command such as createCase, moveCase, or completeGoal; express the
operation as primitive Object, Component, Property, or Relation changes. Do not
add an implicit cascade when a referenced fragment is removed.

The normalized draft must preserve Mutation order. A later Mutation may use a
local reference created by an earlier Mutation. Preconditions, when needed,
are checked against one initial Picture and must not depend on fragments created
inside the same ChangeSet. Their exact transport representation remains an
adapter concern until the State API is implemented.

## Validation checklist

Before handing the draft to a host adapter, verify:

- format and ChangeSet identity are present;
- all external refs, local refs, and vocabulary codes are unique in their
  respective namespaces;
- every relation source and target resolves to an existing State identity or a
  local Object reference;
- every Component Type, Property Type, and Relation Type reference resolves or
  is created before use;
- every Property belongs to one Component and uses one declared Property Type;
- every non-root Case has exactly one primary parent and the case-parent graph
  is acyclic;
- no Mutation uses a title, code, selector, or free-form predicate as its
  application-time target;
- Mutations are ordered and each local reference is used only after creation;
- the fragment contains no Acceptance Contour records;
- the current package limitation is recorded: this draft still needs a State
  adapter and cannot be persisted by the published package alone.

If an existing State read is unavailable, produce the World Fragment and an
explicit list of unresolved references. Do not fabricate numeric IDs.
