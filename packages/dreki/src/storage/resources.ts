import type { Resource, ResourceInstance } from "../world/resources";

/**
 * Storage for resources. Currently just a wrapper around a
 * Map with the constructor as `key` and the instance as `value`.
 */
export class Resources {
  readonly data: Map<Resource, ResourceInstance>;

  constructor() {
    this.data = new Map();
  }

  /**
   * Insert resource with an resource instance.
   * Throws if a resource of given type already exists.
   * @param resource
   */
  insert<T extends Resource>(resource: InstanceType<T>) {
    if (this.data.has(resource.constructor as Resource)) {
      throw new Error(`Resource of type ${resource.constructor} already exists!`);
    }
    this.data.set(resource.constructor as Resource, resource);
  }

  /**
   * Get resource instance of given type
   * @param resource
   * @returns
   */
  get<T extends Resource>(resource: T) {
    return this.data.get(resource) as InstanceType<T> | undefined;
  }

  /**
   * Returns true if the storage contains given resource
   * @param resource
   * @returns
   */
  has<T extends Resource>(resource: T) {
    return this.data.has(resource);
  }

  /**
   * Disposes given resource in the storage
   * @param resource
   * @returns
   */
  dispose<T extends Resource>(resource: T) {
    const value = this.data.get(resource);

    if (value) {
      value?.dispose?.();
      return this.data.delete(resource);
    }

    return false;
  }
}
