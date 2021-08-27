/**
 * DOM initialization options
 */
export class DOMInitOptions {
  constructor(readonly canvas?: HTMLCanvasElement) {}
}

/**
 * Canvas element resource
 */
export class CanvasElement {
  constructor(readonly value: HTMLCanvasElement) {}
}
