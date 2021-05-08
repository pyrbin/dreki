import type { record, Type } from "@dreki.land/shared";
import { OmitTupleIfSingleInstanceTypes } from "@dreki.land/shared";
import { runtime } from "./runtime";

export type Resource<T extends record = record> = Type<T>;
export type ResourceInstance<T extends record = record> = InstanceType<Resource<T>>;

/**
 *  Fetch resources of given types from current world retrieved from [runtime].
 * @param resources
 * @returns
 */
export function resources<T extends readonly Resource[]>(...resources: T) {
  const world = runtime.current_world;
  const result = resources.map((x) => world.resource(x));
  return (result.length > 1 ? result : result[0]) as OmitTupleIfSingleInstanceTypes<T>;
}
