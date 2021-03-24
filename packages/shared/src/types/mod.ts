export * from "./tuple";

/**
 * Represents a type
 */
export interface Type<T = Record<string, any>> extends Function {
  new (...args: any[]): T;
}

export type record = Record<string, any>;

export type Types<T = Type> = readonly T[];

export type Allocator<T> = (() => T) | number | undefined;

export type ExcludeMethods<T> = Pick<
  T,
  { [K in keyof T]: T[K] extends (_: any) => any ? never : K }[keyof T]
>;

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
