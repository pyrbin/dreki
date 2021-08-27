import { events, res } from "dreki";
import { ElementState, Input } from "./input";

/**
 * Mouse input event store
 */
export class Mouse extends Input<MouseButton> {}

/**
 * Mouse mouse button input event
 */
export class MouseButtonInput {
  constructor(readonly button: MouseButton, readonly state: ElementState) {}
}

/**
 * Mouse input system
 */
export function mouseInputSystem() {
  const mouse = res(Mouse);
  const mouseButtonInputs = events(MouseButtonInput);

  mouse.clear();

  for (const event of mouseButtonInputs.iter()) {
    switch (event.state) {
      case ElementState.Released: {
        mouse.release(event.button);
        break;
      }
      case ElementState.Pressed: {
        mouse.press(event.button);
        break;
      }
    }
  }
}

/**
 * A mouse delta position event.
 */
export class MouseMotion {
  readonly delta = { x: 0, y: 0 };
  constructor(x: number, y: number) {
    this.delta = { x, y };
  }
}

// Enum wrapper around https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode
export enum WheelDeltaMode {
  Pixel = 0x00,
  Line = 0x01,
  Page = 0x02,
}

/**
 * A mouse scroll event, where x = horizontal scroll, y = vertical scroll.
 */
export class MouseWheel {
  readonly mode: WheelDeltaMode;
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number, mode: WheelDeltaMode) {
    this.x = x;
    this.y = y;
    this.mode = mode;
  }
}

/**
 * A button on a mouse device.
 */
export enum MouseButton {
  Left = 0,
  Middle = 1,
  Right = 2,
  M4 = 3,
  M5 = 4,
}
