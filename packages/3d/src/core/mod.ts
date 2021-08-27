import * as THREE from "three";
import { Stage, WorldBuilder, StartupStages, Stages, labels, World } from "dreki";
import { CurrentScene } from "./components";
import { initTimeClockSystem, timeUpdateSystem } from "./time";
import { Children, TransformToEntity, Parent, Transform, transformUpdateSystem } from "./transform";

// stages
export const CoreStages = labels("core", {
  SetupScene: "setup_scene",
  TimeUpdate: "time_update",
  TransformUpdate: "transform_update",
});

// plugin
export class CorePlugin {
  register(builder: WorldBuilder) {
    builder
      .components(Parent, Children, Transform, THREE.Scene)
      .components(CurrentScene)
      .resources(new TransformToEntity())
      .startupSystems(initTimeClockSystem)
      .startupStageBefore(
        StartupStages.PreStartup,
        CoreStages.SetupScene,
        new Stage(setupDefaultSceneSystem),
      )
      .stageBefore(Stages.First, CoreStages.TimeUpdate, new Stage(timeUpdateSystem))
      .stageBefore(Stages.Last, CoreStages.TransformUpdate, new Stage(transformUpdateSystem));
  }
}

/**
 * Setup default scene
 * @param world
 */
export function setupDefaultSceneSystem(world: World) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("black");
  world.spawn(CurrentScene, scene);
}

// exports
export { Time } from "./time";
export { CurrentScene };
