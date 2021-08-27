import * as THREE from "three";
import { events, res, World } from "dreki";
import { WindowResize } from "../dom/events";
import { CanvasElement } from "../dom/resources";
import { MainCamera } from "./components";
import { CurrentScene } from "../core/components";

/**
 * Calls {@link THREE.WebGLRenderer.render} on {@link CurrentScene} for current {@link MainCamera}.
 * @param world
 */
export function renderSystem(world: World) {
  const renderer = res(THREE.WebGLRenderer);
  const camera = world.get(world.trySingle(MainCamera)!, THREE.Camera);
  const scene = world.get(world.trySingle(CurrentScene)!, THREE.Camera);
  renderer.render(scene, camera);
}

/**
 * Updates renderer & the main camera on window resize.
 * @param world
 */
export function resizeRendererSystem(world: World) {
  events(WindowResize).take(1, () => {
    const [{ value: canvas }, renderer] = res(CanvasElement, THREE.WebGLRenderer);
    const camera = world.get(world.trySingle(MainCamera)!, THREE.Camera);

    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
  });
}
