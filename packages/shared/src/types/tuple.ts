import type { Type, Types } from "./mod";

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
  export type Flatten<T extends readonly unknown[]> = Internal.ConcatX<
    [...{ [K in keyof T]: T[K] extends unknown[] ? T[K] : [T[K]] }, ...[][]]
  >;
}

namespace Internal {
  export type ConcatX<T extends readonly (readonly unknown[])[]> = [
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
}
