import { WebGLRenderer, WebGLRendererParameters } from "three";

// #[Resource]
export class WebGLRendererContext {
  public renderer: WebGLRenderer;

  constructor(params?: WebGLRendererParameters) {
    this.renderer = new WebGLRenderer(params ?? { antialias: true });
    this.renderer.setClearColor("#233143");
  }

  dispose() {}
}
