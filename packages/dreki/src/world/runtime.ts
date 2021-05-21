import type { ComponentId } from "../component/mod";
import type { ComponentInfo } from "../component/register";
import { EventsCounter } from "./events";
import type { World, WorldId } from "./mod";

/**
 * The Runtime class stores global variables thats related  to the
 * ecs Runtime when executing queries, fetching components, reading/writing
 * to events etc. It has references to the current world.
 */
export abstract class Runtime {
  // world info
  static worlds: Map<WorldId, World> = new Map();
  static worldIdCounter: WorldId = 0;

  // execution context
  static currentWorld: World = undefined as unknown as World;
  static lastChangeTick = 0;
  static lastEventCounts: EventsCounter = new Map();

  // component info
  static components: Map<ComponentId, ComponentInfo> = new Map();
  static componentIdCounter: ComponentId = 0;
}
