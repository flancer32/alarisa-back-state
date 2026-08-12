import '@teqfw/db';

declare global {
  type Alarisa_Back_State_Case_Schema = typeof import("./src/Case/Schema.mjs").default;
  type Alarisa_Back_State_Case_Schema$ = InstanceType<Alarisa_Back_State_Case_Schema>;
  type Alarisa_Back_State_Object_Schema = typeof import("./src/Object/Schema.mjs").default;
  type Alarisa_Back_State_Object_Schema$ = InstanceType<Alarisa_Back_State_Object_Schema>;
  type Alarisa_Back_State_Relation_Type_Schema = typeof import("./src/Relation/Type/Schema.mjs").default;
  type Alarisa_Back_State_Relation_Type_Schema$ = InstanceType<Alarisa_Back_State_Relation_Type_Schema>;
  type Alarisa_Back_State_Relation_Schema = typeof import("./src/Relation/Schema.mjs").default;
  type Alarisa_Back_State_Relation_Schema$ = InstanceType<Alarisa_Back_State_Relation_Schema>;
  type Alarisa_Back_State_Case_Repository = typeof import("./src/Case/Repository.mjs").default;
  type Alarisa_Back_State_Case_Repository$ = InstanceType<Alarisa_Back_State_Case_Repository>;
}

export {};
