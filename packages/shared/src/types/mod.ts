export * from "./tuple";

/**
 * A generic record type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type record<K extends string | number | symbol = string, V = any> = Record<K, V>;

/**
 * Represents a type
 */
export interface Type<T = record> extends Function {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T;
}

/**
 * Tuple of types
 */
export type Types<T = Type> = readonly T[];

/**
 * A allocate-like function for creating an instance of T
 */
export type Allocator<T> = (() => T) | number | undefined;

/**
 * Remove methods from given type T
 */
export type ExcludeMethods<T> = Pick<
  T,
  { [K in keyof T]: T[K] extends ([,]: unknown) => unknown ? never : K }[keyof T]
>;

/**
 * Typed arrays
 */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

/**
 * Typed array constructors
 */
export type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;
