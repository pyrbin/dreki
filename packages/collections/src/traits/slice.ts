/**
 * Create a slice with a certain length
 * @param length
 * @param getter
 * @returns
 */
export function sliceOf<T = unknown>(array: ArrayLike<T>, start = 0, end = 0): Slice<T> {
  return {
    length: Math.max(1, end - start),
    get: (index: number) => array[Math.min(index + start, end)],
  };
}

/**
 * A type that can be used to represent a 'slice' of an array-like object.
 */
export type Slice<T = unknown> = {
  get(index: number): T;
  length: number;
};

/**
 * A sliceable type
 */
export type Sliceable<T = unknown> = {
  slice(range: [from: number, to: number]): Slice<T>;
};
