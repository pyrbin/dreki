import { use_allocator } from "./mod";
import type { Allocator } from "../types/mod";

export const get_or_insert = <K, V>(map: Map<K, V>, key: K, allocator?: Allocator<V>) => {
  let value = map.get(key);
  if (value === undefined) {
    value = use_allocator(allocator);
    map.set(key, value);
  }
  return value;
};
