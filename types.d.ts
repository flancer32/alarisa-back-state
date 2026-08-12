import '@teqfw/db';

declare global {
  type Alarisa_Back_State_Case_Schema = typeof import("./src/Case/Schema.mjs").default;
  type Alarisa_Back_State_Case_Schema$ = InstanceType<Alarisa_Back_State_Case_Schema>;
  type Alarisa_Back_State_Case_Relation_Schema = typeof import("./src/Case/Relation/Schema.mjs").default;
  type Alarisa_Back_State_Case_Relation_Schema$ = InstanceType<Alarisa_Back_State_Case_Relation_Schema>;
  type Alarisa_Back_State_Case_Repository = typeof import("./src/Case/Repository.mjs").default;
  type Alarisa_Back_State_Case_Repository$ = InstanceType<Alarisa_Back_State_Case_Repository>;
}

export {};

