import type { ComponentId } from "../component/mod";
import type { ComponentInfo } from "../component/register";
import type { World, WorldId } from "./mod";
import { RUNTIME_GLOBAL_KEY } from "../constants";

export type Runtime = {
  worlds: Map<WorldId, World>;
  current_world: World;
  world_id_counter: WorldId;
  components: Map<ComponentId, ComponentInfo>;
  component_counter: ComponentId;
};

export function runtime(): Runtime {
  if ((globalThis as any)[RUNTIME_GLOBAL_KEY] !== undefined)
    return (globalThis as any)[RUNTIME_GLOBAL_KEY] as Runtime;
  return ((globalThis as any)[RUNTIME_GLOBAL_KEY] = {
    worlds: new Map(),
    current_world: (undefined as unknown) as World,
    world_id_counter: 0,
    components: new Map(),
    component_counter: 0,
  }) as Runtime;
}
