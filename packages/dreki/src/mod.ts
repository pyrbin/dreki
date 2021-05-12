/**
 * dreki
 * ---
 * An Entity-Component System (ecs) library written in Typescript.
 * ---
 * https://github.com/pyrbin/dreki
 */

// World
export { World, WorldOptions } from "./world/mod";
export { WorldBuilder } from "./world/builder";
export { Plugin } from "./world/plugin";
export { resources } from "./world/resources";
export { events } from "./world/events";
export { runtime } from "./world/runtime";

// Entity
export { Entity } from "./entity/mod";

// Scheduler
export { Stage } from "./scheduler/stage";
export type { SystemFunc as System } from "./scheduler/system";
export { Stages, StartupStages } from "./scheduler/mod";
export { stage_labels } from "./scheduler/mod";

// Query
export { query } from "./query/mod";
