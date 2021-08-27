import type { World } from "dreki";

export function initTimeClockSystem(world: World) {
  world.addResource(new Time());
}

export function timeUpdateSystem(world: World) {
  world.resource(Time).update();
}

export class Time {
  #deltaMs = 0;
  #elapsedMs = 0;
  readonly #clock: Clock;

  constructor() {
    this.#clock = clock();
  }

  update() {
    this.#deltaMs = this.#clock.delta();
    this.#elapsedMs = this.#clock.elapsed();
  }

  /**
   * Retrieves delta time in seconds
   * @returns
   */
  delta = () => this.#deltaMs / 1000;

  /**
   * Retrieves elapsed time since world startup in seconds
   * @returns
   */
  elapsed = () => this.#elapsedMs / 1000;
}

/**
 * Simple clock
 * @returns
 */
export function clock() {
  const start = now();

  const timer = {
    lastTime: start,
  };

  return {
    delta: () => {
      const current = now();
      const dt = current - timer.lastTime;
      timer.lastTime = current;
      return round(dt);
    },
    elapsed: () => round(now() - start),
  };
}

export type Clock = ReturnType<typeof clock>;

/**
 *  Rounds a number to given digits
 * @param number
 * @param digits
 * @returns
 */
const round = (number: number, digits = 0) => Number(number.toFixed(digits));

/**
 * Retrieves current time. Uses `performance.now` if node or `window.performance` if browser.
 * @returns
 */
function now() {
  return (typeof performance === "undefined" ? window.performance : performance).now();
}
