import type { ComponentId } from "../component/mod";
import type { ComponentInfo } from "../component/register";
import { EventsCount } from "./events";
import type { World, WorldId } from "./mod";

/**
 * The runtime class stores global variables thats related  to the
 * ecs runtime when executing queries, fetching components, reading/writing
 * to events etc. It has references to the current world.
 */
export abstract class runtime {
  // world info
  static worlds: Map<WorldId, World> = new Map();
  static world_id_counter: WorldId = 0;

  // execution context
  static current_world: World = (undefined as unknown) as World;
  static last_change_tick: number = 0;
  static last_event_counts: EventsCount = new Map();

  // component info
  static components: Map<ComponentId, ComponentInfo> = new Map();
  static component_id_counter: ComponentId = 0;

  // hide constructor
  private constructor() {}
}
