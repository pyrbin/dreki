import * as THREE from "three";
import { Stage, Stages, WorldBuilder, StartupStages, labels, events, World } from "dreki";
import { resizeRendererSystem, renderSystem } from "./systems";
import { MainCamera } from "./components";
import { CanvasMounted } from "../mod";

// stages
export const RenderStages = labels("render", {
  Setup: "setup_renderer",
  Rendering: "rendering",
});

// plugin
export class RendererPlugin {
  register(builder: WorldBuilder) {
    builder
      .components(THREE.Camera)
      .startupStageBefore(
        StartupStages.PreStartup,
        RenderStages.Setup,
        new Stage(setupRendererSystem),
      )
      .stageAfter(
        Stages.Last,
        RenderStages.Rendering,
        new Stage(resizeRendererSystem, renderSystem),
      );
  }
}

/**
 * Setup renderer system
 * @param world
 */
export function setupRendererSystem(world: World) {
  events(CanvasMounted).take(1, ([{ value: canvas }]) => {
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    world.addResource(renderer);

    renderer.setClearColor("#233143");
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;

    // create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;

    // spawn main camera entity
    world.spawn(MainCamera, camera);
  });
}

// exports
export { MainCamera };
