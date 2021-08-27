import { record } from "../../../shared/out/mod";
import type { ComponentId } from "../component/mod";
import type { ComponentInfo } from "../component/register";
import { FilterId } from "../query/filter";
import { EventReadCounts, EventId } from "./events";
import type { World, WorldId } from "./mod";
import { Resource, ResourceId } from "./resources";

/**
 * The Runtime class stores global variables thats related  to the
 * ecs Runtime when executing queries, fetching components, reading/writing
 * to events etc. It has references to the current world.
 */
export abstract class Runtime {
  // worlds
  static worlds: record<WorldId, World> = {};
  static worldIdCounter: WorldId = 0;

  // schedules & systems
  static currentWorld: World = undefined as unknown as World;
  static lastChangeTick = 0;
  static lastEventCounts: EventReadCounts = {};

  // components
  static components: record<ComponentId, ComponentInfo> = {};
  static componentIdCounter: ComponentId = 1;

  // resources
  static resourceIdCounter: ResourceId = 1;

  // events
  static eventIdCounter: EventId = 1;

  // filters
  static filterIdCounter: FilterId = 1;
}
