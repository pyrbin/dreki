import { PerspectiveCamera, WebGLRenderer, Scene } from "three";
import { World } from "dreki";
import { WebGLRendererContext } from "./resources";
import { utils } from "../utils";

export function WebGL_renderer(world: World) {
  const ctx = world.resource(WebGLRendererContext);
  if (ctx == undefined) return;

  const camera = utils.cam.main(world) as PerspectiveCamera;
  const scene = utils.scene.current(world);

  if (resize_renderer(ctx.renderer)) {
    const canvas = ctx.renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  // render current scene
  ctx.renderer.render(scene, camera);
}

function resize_renderer(renderer: WebGLRenderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
