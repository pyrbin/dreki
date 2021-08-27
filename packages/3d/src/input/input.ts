/**
 * State of an input element
 */
export enum ElementState {
  Pressed = "pressed",
  Released = "released",
}

/**
 * Resources to be used to keep input state of a certain input.
 */
export class Input<T extends string | number> {
  readonly #pressedSet: Set<T>;
  readonly #justPressedSet: Set<T>;
  readonly #releasedSet: Set<T>;

  constructor() {
    this.#pressedSet = new Set();
    this.#justPressedSet = new Set();
    this.#releasedSet = new Set();
  }

  /**
   * Presses given input.
   * @param input
   */
  press(input: T) {
    if (!this.pressed(input)) {
      this.#justPressedSet.add(input);
    }
    this.#pressedSet.add(input);
  }

  /**
   * Returns true if given input is pressed.
   * @param input
   */
  pressed(input: T) {
    return this.#pressedSet.has(input);
  }

  /**
   * Returns true if given input was pressed this frame.
   * @param input
   * @returns
   */
  justPressed(input: T) {
    return this.#justPressedSet.has(input);
  }

  /**
   * Releases given input.
   * @param input
   * @returns
   */
  release(input: T) {
    this.#pressedSet.delete(input);
    return this.#releasedSet.add(input);
  }

  /**
   * Returns true if given input was released.
   * @param input
   * @returns
   */
  released(input: T) {
    return this.#releasedSet.has(input);
  }

  /**
   * Resets states for given input.
   * @param input
   */
  reset(input: T) {
    this.#pressedSet.delete(input);
    this.#justPressedSet.delete(input);
    this.#releasedSet.delete(input);
  }

  /**
   * Clears just pressed & released sets.
   */
  clear() {
    this.#justPressedSet.clear();
    this.#releasedSet.clear();
  }
}
