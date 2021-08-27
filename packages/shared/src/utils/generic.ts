import type { Allocator, record, Type } from "../mod";

/**
 * Typed hasOwnProperty wrapper
 * @param obj
 * @param prop
 * @returns
 */
export function hasOwnProperty<X extends record, Y extends PropertyKey>(
  obj: X,
  prop: Y,
): obj is X & Record<Y, unknown> {
  // eslint-disable-next-line no-prototype-builtins
  return obj.hasOwnProperty(prop);
}

/**
 * Use an 'Allocator' object. Will call it if it's a function or use value if not.
 * @param allocator
 * @returns
 */
export function useAllocator<T>(allocator: Allocator<T>): T {
  return (typeof allocator === "function" ? (allocator as () => T)() : allocator) as T;
}

/**
 * Take a constructor or instance of a class & return it's constructor & an instance.
 * If target is an constructor a new instance will be spawned with `new`.
 * @param target
 * @returns
 */
export function getInstanceAndType<T extends record = record>(target: T | Type<T>): [T, Type<T>] {
  return isConstructor(target)
    ? [new (target as Type<record>)() as T, target as Type<T>]
    : [target as T, target.constructor as Type<T>];
}

/**
 * Returns an iterable range that iterates from start number to end.
 * If end is undefined then end will be set to start & start to 0
 * @example ```range(20) === range(0, 20)```
 *
 * A parameter step can be supplied to change step size (default: `1`)
 *
 * @param start
 * @param end
 * @param step
 * @returns
 */
export function range(start: number, end?: number, step = 1): Iterable<number> {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  return {
    [Symbol.iterator]: () => ({
      next: (): IteratorResult<number> => ({
        value: (start += step) - step,
        done: start > end!,
      }),
    }),
  };
}

/**
 * Create an iterable of given length & with given return values.
 * @param length
 * @param fn
 * @returns
 */
export function iter<T = unknown>(length: number, fn: (i: number) => T): Iterable<T> {
  return (function* () {
    for (const i of range(0, length)) yield fn(i);
  })();
}

/**
 * Returns true if target is a constructor.
 * @param target
 * @returns
 */
export function isConstructor(target: record) {
  return !!target.prototype && !!target.prototype.constructor.name;
}

/**
 * Return the constructor of an object.
 * @param object
 * @returns
 */
export function ctorof<T extends Type>(object: InstanceType<T>): T {
  return object?.constructor as T;
}
