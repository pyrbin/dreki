import { use_allocator } from "../mod";
import type { Allocator, TypedArray } from "../types/mod";
import { iterable } from "./mod";

/**
 * Allocates an array of size with provided allocator object
 * @param size
 * @param allocator
 * @returns
 */
export const array_of = <T extends unknown>(size: number, allocator: Allocator<T> = undefined) => {
  const array = new Array<T>(size);
  for (let i = 0; i < size; i++) array[i] = use_allocator(allocator);
  return array;
};

/**
 * Swap two elements in an array
 * @param array
 * @param i
 * @param j
 */
export const swap = (array: Array<unknown> | TypedArray, i: number, j: number) => {
  [array[i], array[j]] = [array[j], array[i]];
};

/**
 * Insert an element to given index in the array
 * @param array
 * @param index
 * @param element
 */
export const insert_at = <T>(array: Array<T>, index: number, element: T) => {
  array.splice(index, 0, element);
};

/**
 *  Returns true if it's a typed array
 * @param array
 */
export const is_typed_array = <T>(array: T): boolean =>
  array instanceof Int8Array ||
  array instanceof Int16Array ||
  array instanceof Int32Array ||
  array instanceof Uint8Array ||
  array instanceof Uint8ClampedArray ||
  array instanceof Uint16Array ||
  array instanceof Uint32Array ||
  array instanceof Float32Array ||
  array instanceof Float64Array;

/**
 * Returns a constructor for a 'fitting' typed array based on provided size.
 * @param size
 * @returns TypedArray
 */
export const fitting_unsigned_typed_array = (size: number) => {
  if (size <= 0xff) return Uint8Array;
  if (size <= 0xffff) return Uint16Array;
  if (size <= 0xffffffff) return Uint32Array;
  return Float64Array;
};
