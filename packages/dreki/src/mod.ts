/**
 * dreki
 * ---
 * An Entity-Component System (ecs) library written in Typescript.
 * ---
 * https://github.com/pyrbin/dreki
 */

// world
export { World, WorldOptions } from "./world/mod";
export { WorldBuilder } from "./world/builder";
export { Plugin } from "./world/plugin";
export { events } from "./world/events";
export { res } from "./world/resources";
export { Runtime } from "./world/runtime";

// entity
export { Entity } from "./entity/mod";

// scheduler
export { Stage } from "./scheduler/stage";
export type { SystemFunc as System } from "./scheduler/system";
export { Stages, StartupStages } from "./scheduler/mod";
export { labels } from "./scheduler/mod";

// query
export { query } from "./query/mod";
