import { useAllocator } from "../mod";
import { Allocator } from "../types/mod";
import { arrayOf } from "../utils/array";

export function pooled<T>(
  allocator: Allocator<T>,
  reset: ((object: T) => unknown) | undefined = undefined,
  initial = 64,
) {
  return new ObjectPool<T>(allocator, reset, initial);
}

export class ObjectPool<T> {
  readonly #pool: T[];
  readonly #reset?: (object: T) => unknown;
  readonly #size: number;
  readonly #allocator: Allocator<T>;

  constructor(
    allocator: Allocator<T>,
    reset: ((object: T) => unknown) | undefined = undefined,
    initial = 0,
  ) {
    this.#pool = arrayOf(initial, allocator);
    this.#reset = reset;
    this.#size = initial;
    this.#allocator = allocator;
  }

  get(): T {
    if (this.#pool.length <= 0) {
      for (let i = 0; i < this.#size; i++) {
        this.#pool.push(useAllocator(this.#allocator));
      }
    }
    return this.#pool.pop() as T;
  }

  release(object: T) {
    this.#reset?.(object);
    this.#pool.push(object);
  }
}
