import { events, World } from "dreki";
import { ElementState } from "../input/input";
import { KeyboardInput, Key } from "../input/keyboard";
import { MouseButtonInput, MouseMotion, MouseWheel, WheelDeltaMode } from "../input/mouse";
import { CanvasMounted, WindowMounted } from "./events";

/**
 * Setups DOM input listeners.
 * @param world
 */
export function setupDomInputSystem(world: World) {
  events(WindowMounted).take(1, () => {
    // on window mounted
    window.addEventListener("keyup", (e) => onKey(e, "up", world));
    window.addEventListener("keydown", (e) => onKey(e, "down", world));
  });

  events(CanvasMounted).take(1, ([event]) => {
    // on canvas mounted
    event.value.addEventListener("mouseup", (e) => onMouseButton(e, "up", world));
    event.value.addEventListener("mousedown", (e) => onMouseButton(e, "down", world));
    event.value.addEventListener("mousemove", (e) => onMouseMove(e, world, event.value), false);
    event.value.addEventListener("wheel", (e) => onMouseWheel(e, world), false);
  });
}

/**
 * Handle on mouse button. Emits a {@link MouseButtonInput} event.
 * @param event
 * @param state
 * @param world
 */
function onMouseButton(event: MouseEvent, state: "up" | "down", world: World) {
  event.preventDefault();
  const mouseInputWriter = world.eventWriter(MouseButtonInput);
  switch (state) {
    case "up": {
      mouseInputWriter.emit({ button: event.button, state: ElementState.Released });
      break;
    }
    case "down": {
      mouseInputWriter.emit({ button: event.button, state: ElementState.Pressed });
      break;
    }
  }
}

/**
 * Handle mouse motion. Emits a {@link MouseMotion} event.
 * @param event
 * @param world
 * @param element
 */
function onMouseMove(event: MouseEvent, world: World, element: HTMLElement) {
  event.preventDefault();
  world.eventWriter(MouseMotion).emit({
    delta: {
      x: (event.clientX / element!.clientWidth) * 2 - 1,
      y: -(event.clientY / element!.clientHeight) * 2 + 1,
    },
  });
}

/**
 * Handle mouse wheel. Emits a {@link MouseWheel} event.
 * @param event
 * @param world
 */
function onMouseWheel(event: WheelEvent, world: World) {
  event.preventDefault();
  world.eventWriter(MouseWheel).emit({
    x: event.deltaX,
    y: event.deltaY,
    mode: event.deltaMode as WheelDeltaMode,
  });
}

/**
 * Handles keyboard key event. Emits a {@link KeyboardInput} event.
 * @param event
 * @param state
 * @param world
 */
function onKey(event: KeyboardEvent, state: "up" | "down", world: World) {
  event.preventDefault();
  const keyboardInputWriter = world.eventWriter(KeyboardInput);
  switch (state) {
    case "up": {
      keyboardInputWriter.emit({ key: event.code as Key, state: ElementState.Released });
      break;
    }
    case "down": {
      keyboardInputWriter.emit({ key: event.code as Key, state: ElementState.Pressed });
      break;
    }
  }
}
