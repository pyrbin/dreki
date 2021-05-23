import { WorldBuilder } from "./builder";

// todo: improve plugin api
// * implement a way to create dependencies between plugins.
// * more meta data like `name`, `version` etc.

/**
 * A plugin type
 */
export type Plugin = {
  register: (builder: WorldBuilder) => unknown;
};

export type Plugins = Plugin[];
