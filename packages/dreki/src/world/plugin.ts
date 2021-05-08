import { WorldBuilder } from "./builder";

// Plugin
// todo: implement a way to create dependencies between plugins.
export type Plugin = {
  register: (builder: WorldBuilder) => unknown;
};

export type Plugins = Plugin[];
