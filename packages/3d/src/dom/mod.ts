import { WorldBuilder, Plugin, labels, Stage, StartupStages } from "dreki";
import { CanvasMounted, WindowMounted, WindowResize } from "./events";
import { setupDomInputSystem } from "./io";
import { CanvasElement, DOMInitOptions } from "./resources";
import { setupWindowSystem } from "./systems";

// stages
export const DOMStages = labels("dom", {
  SetupDOM: "setup_dom",
});

// plugin
type PluginOptions = {
  canvas?: HTMLCanvasElement;
};

export class DOMPlugin implements Plugin {
  #options: PluginOptions;

  constructor(options?: Partial<PluginOptions>) {
    this.#options = options ?? {};
  }

  register(builder: WorldBuilder) {
    builder
      .resources(new DOMInitOptions(this.#options.canvas))
      .startupStageBefore(
        StartupStages.PreStartup,
        DOMStages.SetupDOM,
        new Stage(setupWindowSystem, setupDomInputSystem),
      );
  }
}

// exports
export { CanvasElement, CanvasMounted };
export { WindowMounted, WindowResize };
