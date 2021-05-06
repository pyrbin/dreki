import { World, WorldBuilder, Plugin, Stages, Stage } from "dreki";
import { CurrentScene, MainCamera } from "./singletons";
import { Scene, PerspectiveCamera, Color, AmbientLight, Camera, Object3D } from "three";
import { WebGLRendererContext, WebGL_renderer } from "./renderer/mod";
import { object3d_lifecycle } from "./systems";

type PluginOptions = {
  container?: string;
};

export * from "./singletons";
export { WebGLRendererContext } from "./renderer/resources";

export class Dreki3D implements Plugin {
  private options: PluginOptions;

  constructor(options?: Partial<PluginOptions>) {
    this.options = options ?? {};
  }

  public register(builder: WorldBuilder) {
    builder.resources(new WebGLRendererContext());
    builder.components(Camera, Object3D);
    builder.stage_after(Stages.Update, "rendering", new Stage(WebGL_renderer));
    builder.stage_before("rendering", "transform_systems", new Stage(object3d_lifecycle));
  }

  public async load(world: World) {
    const { renderer } = world.resource(WebGLRendererContext);
    const container = document.querySelector(this.options.container ?? "") ?? document.body;

    {
      // add the automatically created <canvas> element to the page
      (container ?? document.body).appendChild(renderer.domElement);
      // next, set the renderer to the same size as our container element
      renderer.setSize(container.clientWidth, container.clientHeight);
      // finally, set the pixel ratio so that our scene will look good on HiDPI displays
      renderer.setPixelRatio(window.devicePixelRatio);
    }

    {
      // create a Scene
      const scene = new Scene();
      // set the background color
      scene.background = new Color("black");
      // spawn main scene entity
      world.spawn(CurrentScene, scene);
    }

    {
      const color = 0xffffff;
      const intensity = 1;
      const light = new AmbientLight(color, intensity);
      world.spawn(light);
    }

    {
      const fov = 45;
      const aspect = container.clientWidth / container.clientHeight;
      const near = 0.1; // the near clipping plane
      const far = 100; // the far clipping plane

      const camera = new PerspectiveCamera(fov, aspect, near, far);
      camera.position.set(0, 20, 10);

      // spawn main camera entity
      world.spawn(MainCamera, camera);
    }

    return true;
  }
}
