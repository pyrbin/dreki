/**
 * Window is resized event
 */
export class WindowResize {
  constructor(readonly width: number = 0, readonly height: number = 0) {}
}

/**
 * Window is mounted event
 */
export class WindowMounted {
  constructor(readonly window: Window) {}
}

/**
 * Canvas element is mounted event
 */
export class CanvasMounted {
  constructor(readonly value: HTMLCanvasElement) {}
}
