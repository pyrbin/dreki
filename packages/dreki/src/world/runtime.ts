import type { ComponentId } from "../component/mod";
import type { ComponentInfo } from "../component/register";
import type { World, WorldId } from "./mod";

export abstract class runtime {
  // world info
  static worlds: Map<WorldId, World> = new Map();
  static world_id_counter: WorldId = 0;
  // execution context
  static current_world: World = (undefined as unknown) as World;
  static last_change_tick: number = 0;
  // component info
  static components: Map<ComponentId, ComponentInfo> = new Map();
  static component_id_counter: ComponentId = 0;

  // hide constructor
  private constructor() {}
}
