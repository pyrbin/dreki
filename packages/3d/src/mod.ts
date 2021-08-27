import { Plugin, WorldBuilder } from "dreki";
import { CorePlugin } from "./core/mod";
import { DOMPlugin } from "./dom/mod";
import { InputPlugin } from "./input/mod";
import { RendererPlugin } from "./renderer/mod";

type PluginOptions = {
  canvas?: string | HTMLCanvasElement;
};

// plugins
export class Dreki3D implements Plugin {
  #options: PluginOptions;

  constructor(options?: Partial<PluginOptions>) {
    this.#options = options ?? {};
  }

  register(builder: WorldBuilder) {
    if (typeof this.#options.canvas === "string") {
      this.#options.canvas = document.querySelector(this.#options.canvas) as HTMLCanvasElement;
    }

    builder
      .plugins(new CorePlugin())
      .plugins(new DOMPlugin({ canvas: this.#options.canvas }))
      .plugins(new InputPlugin())
      .plugins(new RendererPlugin());
  }
}

// exports
export * from "./renderer/mod";
export * from "./core/mod";
export * from "./input/mod";
export * from "./dom/mod";
