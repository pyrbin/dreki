import { World, events, res } from "dreki";
import { CanvasMounted, WindowResize, WindowMounted } from "./events";
import { DOMInitOptions, CanvasElement } from "./resources";

/**
 * Setup window, canvas & related resources.
 * @param world
 */
export function setupWindowSystem(world: World) {
  const canvasMounted = events(CanvasMounted);
  const domOptions = res(DOMInitOptions);
  const canvas = domOptions.canvas ?? createDefaultCanvas();

  // create canvas
  world.addResource(new CanvasElement(canvas));
  canvasMounted.emit({ value: canvas });
  world.deleteResource(DOMInitOptions);

  // when window is resized
  const windowResize = events(WindowResize);
  window.addEventListener("resize", () => {
    windowResize.emit({ width: window.innerWidth, height: window.innerHeight });
  });

  // when window is mounted
  const windowMounted = events(WindowMounted);
  windowMounted.emit({ window });
}

function createDefaultCanvas() {
  const canvas = document.createElement("canvas");
  canvas.style.display = "flex";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientWidth;
  document.body.appendChild(canvas);
  return canvas;
}
