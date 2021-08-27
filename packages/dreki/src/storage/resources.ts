import { Disposable, record, ctorof } from "@dreki.land/shared";
import { RESOURCE_ID_PROP_KEY } from "../constants";
import { defineIdentifier } from "../utils";
import { Resource, ResourceId, ResourceInstance } from "../world/resources";
import { Runtime } from "../world/runtime";

/**
 * Storage for resources.
 */
export class Resources implements Disposable {
  readonly data: record<ResourceId, ResourceInstance | undefined>;

  constructor() {
    this.data = {};
  }

  /**
   * Insert resource with an resource instance.
   * Throws if a resource of given type already exists.
   * @param resource
   */
  insert<T extends Resource>(resource: InstanceType<T>) {
    return (this.data[
      ctorof(resource)[RESOURCE_ID_PROP_KEY] ??
        defineIdentifier(ctorof(resource), ++Runtime.resourceIdCounter, RESOURCE_ID_PROP_KEY)
    ] = resource);
  }

  /**
   * Get resource instance of given type
   * @param resource
   * @returns
   */
  get<T extends Resource>(resource: T) {
    return this.data[resource[RESOURCE_ID_PROP_KEY]!];
  }

  /**
   * Returns true if the storage contains given resource
   * @param resource
   * @returns
   */
  has<T extends Resource>(resource: T) {
    return Boolean(this.data[resource[RESOURCE_ID_PROP_KEY]!]);
  }

  /**
   * Disposes given resource in the storage
   * @param resource
   * @returns
   */
  free<T extends Resource>(resource: T) {
    const id = resource[RESOURCE_ID_PROP_KEY]!;
    this.data[id]?.dispose();
    this.data[id] = undefined;
    return false;
  }

  /**
   * Dispose resources
   */
  dispose() {
    for (const key in this.data) {
      if (this.data[key]) this.free(ctorof(this.data[key]!));
    }
  }
}
