import { Slice, slice_of, SparseSet, Vec, vec } from "@dreki.land/collections";
import { Allocator, bitflags } from "@dreki.land/shared";
import { Entity } from "../entity/mod";
import { ComponentInstance, ComponentFlags, Component } from "../component/mod";
import { ComponentInfo } from "../component/register";
import { PhantomComponentStorage } from "./phantom";

export type EntitySlice = Slice<Entity>;

/**
 * Generic component storage interface type.
 */
export type ComponentStorage = {
  insert(entity: Entity, value: ComponentInstance, flags: ComponentFlags): ComponentInstance;
  remove(entity: Entity): boolean;
  get(entity: Entity): ComponentInstance;
  has(entity: Entity): boolean;
  set_flag(entity: Entity, fn: (flag: ComponentFlags) => ComponentFlags): void;
  get_with_flags(entity: Entity): readonly [ComponentInstance, ComponentFlags];
  clear_flags(): void;
  realloc(length?: number): void;
  empty(): boolean;

  readonly length: number;
  readonly capacity: number;
  readonly component_info: ComponentInfo;

  register_phantom(reference: PhantomComponentStorage): void;

  entity_slice(): EntitySlice;
};

/**
 * Default storage for components.
 */
export class ComponentSparseSet implements ComponentStorage {
  readonly component_info: ComponentInfo;
  readonly dense: Vec<ComponentInstance>;
  readonly flags: Vec<ComponentFlags>;
  readonly entities: Vec<Entity>;
  readonly sparse: Vec<number | -1>;

  /**
   * Phantom storages that references a component storage are stored here
   * so it can be notified if a component of it's component type has been removed.
   */
  readonly phantoms: Map<Component, PhantomComponentStorage>;

  /**
   * Registeres a phantom storage for given component.
   * @param component
   * @param reference
   */
  register_phantom(reference: PhantomComponentStorage) {
    this.phantoms.set(reference.component_info.component, reference);
  }

  constructor(capacity: number, info: ComponentInfo, allocator?: Allocator<ComponentInstance>) {
    this.dense = vec(capacity, allocator);
    this.flags = vec(capacity, ComponentFlags.Empty);
    this.entities = vec(capacity, () => Entity.null);
    this.sparse = vec(capacity, () => -1);

    this.component_info = info;
    this.phantoms = new Map();
  }

  /**
   * Insert component value & flags for given `entity`.
   * @param entity
   * @param value
   * @param flags
   * @returns
   */
  insert(entity: Entity, value: ComponentInstance, flags: ComponentFlags) {
    const { index } = entity;
    let dense_index = this.sparse.raw[index];

    if (dense_index !== -1) {
      // Remove from phantom storage
      if (this.phantoms.size > 0) {
        for (const ph of this.phantoms.values()) {
          const match_instance = value instanceof ph?.component_info.component;
          if (!match_instance) {
            ph?.entities.remove(entity.index);
          }
        }
      }
      this.dense.raw[dense_index].dispose?.();
      this.dense.raw[dense_index] = value;
      this.flags.raw[dense_index] = flags;
      return value;
    }

    dense_index = this.dense.length;
    this.sparse.raw[index] = dense_index;
    this.entities.push(entity);
    this.dense.push(value);
    this.flags.push(flags);
    return value;
  }

  /**
   * Remove component entry from given entity.
   * Will call `dispose` on component instance if the function is available.
   * @param entity
   * @returns
   */
  remove(entity: Entity) {
    const index = entity.index;
    const dense_index = this.sparse.raw[index];
    this.sparse.raw[index] = -1;

    if (dense_index === -1) {
      return false;
    }

    this.flags.swap_remove(dense_index);
    this.entities.swap_remove(dense_index);

    // Remove & call dispose if component implements it
    const value = this.dense.swap_remove(dense_index);
    value?.dispose?.();

    // Remove from phantom storage
    if (this.phantoms.size > 0) {
      for (const ph of this.phantoms.values()) {
        ph?.entities.remove(entity.index);
      }
    }

    const is_last = dense_index === this.dense.length;

    if (!is_last) {
      const swapped_index = this.entities.raw[dense_index];
      this.sparse.raw[swapped_index.index] = dense_index;
    }

    return true;
  }

  /**
   * Get component for given entity.
   * @param entity
   * @returns
   */
  get(entity: Entity) {
    return this.dense.raw[this.sparse.raw[entity.index]!];
  }

  /**
   * Returns true if storage has given entity.
   * @param entity
   * @returns
   */
  has(entity: Entity) {
    return this.sparse.raw[entity.index] !== -1;
  }

  /**
   * Set component flag for entity to the value returned by given `fn` function.
   * @param entity
   * @param fn
   */
  set_flag(entity: Entity, fn: (flag: ComponentFlags) => ComponentFlags) {
    const dense_index = this.sparse.raw[entity.index];
    this.flags.raw[dense_index] = fn(this.flags.raw[dense_index]);
  }

  /**
   * Get component & flags for given entity as a tuple.
   * @param entity
   * @returns
   */
  get_with_flags(entity: Entity) {
    const dense_index = this.sparse.raw[entity.index];
    return [this.dense.raw[dense_index], this.flags.raw[dense_index]] as const;
  }

  /**
   * Clears all component flags for every component entry.
   */
  clear_flags() {
    for (let i = 0; i < this.flags.length; i++) {
      const flag = this.flags.raw[i];
      if (flag !== ComponentFlags.Empty && bitflags.contains(flag, ComponentFlags.Disabled)) {
        this.flags.raw[i] = ComponentFlags.Empty | ComponentFlags.Disabled;
        continue;
      }
      this.flags.raw[i] = ComponentFlags.Empty;
    }
  }

  /**
   * Reallocate storage to given `length`.
   * @param length
   */
  realloc(length?: number) {
    this.sparse.realloc(length);
    this.sparse.resize(this.sparse.capacity);
  }

  /**
   * Returns true if component storage is empty.
   * @returns
   */
  empty() {
    return this.dense.empty();
  }

  entity_slice(): EntitySlice {
    return slice_of(this.entities.raw, 0, this.length);
  }

  get length() {
    return this.dense.length;
  }

  get capacity() {
    return this.dense.capacity;
  }
}
