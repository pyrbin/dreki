import { useAllocator } from "./generic";
import type { Allocator } from "../types/mod";

export const getOrInsert = <K, V>(map: Map<K, V>, key: K, allocator?: Allocator<V>) => {
  let value = map.get(key);
  if (value === undefined) {
    value = useAllocator(allocator);
    map.set(key, value);
  }
  return value;
};
