import type { ComponentId } from "../component/mod";
import type { ComponentInfo } from "../component/register";
import type { World, WorldId } from "./mod";
import { RUNTIME_GLOBAL_KEY } from "../constants";

export type Runtime = {
  // world info
  worlds: Map<WorldId, World>;
  world_id_counter: WorldId;
  // execution context
  current_world: World;
  last_change_tick: number;
  // component info
  components: Map<ComponentId, ComponentInfo>;
  component_id_counter: ComponentId;
};

export function runtime(): Runtime {
  if ((globalThis as any)[RUNTIME_GLOBAL_KEY] !== undefined)
    return (globalThis as any)[RUNTIME_GLOBAL_KEY] as Runtime;
  return ((globalThis as any)[RUNTIME_GLOBAL_KEY] = {
    worlds: new Map(),
    current_world: (undefined as unknown) as World,
    world_id_counter: 0,
    last_change_tick: 0,
    components: new Map(),
    component_id_counter: 0,
  }) as Runtime;
}
