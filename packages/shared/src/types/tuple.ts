import type { Type, Types } from "./mod";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Tuple {
  /**
   * Convert a tuple of types to their instance types.
   */
  export type InstanceTypes<T extends Types> = {
    [K in keyof T]: T[K] extends Type ? InstanceType<T[K]> : never;
  };

  /**
   * Convert a tuple of types to their instance types as Readonly.
   */
  export type ReadonlyInstanceTypes<T extends Types> = {
    [K in keyof T]: T[K] extends Type ? Readonly<InstanceType<T[K]>> : never;
  };

  /**
   * Flattens a nested tuple.
   * @example [A,[B],[C,D,E],[F,[G]]] => [A,B,C,D,E,F,G]
   */
  export type Flatten<T extends readonly unknown[]> = ConcatX<
    [...{ [K in keyof T]: T[K] extends unknown[] ? T[K] : [T[K]] }, ...[][]]
  >;
}

/**
 * Omit the array type from T if the tuple only contains a single element.
 */
export type OmitTupleIfSingle<T extends readonly unknown[]> = T extends ArrayTwoOrMore<unknown>
  ? T
  : T extends { 0: T[number] }
  ? T[0]
  : never;

/**
 * Omit the array type from T if the tuple only contains a single element & convert elements to InstanceTypes.
 */
export type OmitTupleIfSingleInstanceTypes<
  T extends readonly Type[]
> = T extends ArrayTwoOrMore<unknown>
  ? Tuple.InstanceTypes<T>
  : T extends { 0: T[number] }
  ? InstanceType<T[0]>
  : never;

type ConcatX<T extends readonly (readonly unknown[])[]> = [
  ...T[0],
  ...T[1],
  ...T[2],
  ...T[3],
  ...T[4],
  ...T[5],
  ...T[6],
  ...T[7],
  ...T[8],
  ...T[9],
  ...T[10],
  ...T[11],
  ...T[12],
  ...T[13],
  ...T[14],
  ...T[15],
  ...T[16],
  ...T[17],
  ...T[18],
  ...T[19],
  ...T[20],
  ...T[21],
  ...T[22],
  ...T[24]
];

type ArrayTwoOrMore<T> = {
  0: T;
  1: T;
} & Array<T>;
