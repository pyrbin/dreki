import { WorldBuilder } from "./builder";
import type { World } from "./mod";

// Plugin
// @todo implement a way to create dependencies between plugins.
export type Plugin = {
  register: (builder: WorldBuilder) => unknown;
  load?: (world: World) => Promise<boolean>;
};
