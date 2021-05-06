import { Vec, vec, slice_of } from "@dreki.land/collections";
import { Allocator, iter, swap } from "@dreki.land/shared";
import {
  ComponentInstance,
  ComponentFlags,
  Component,
  ComponentTick,
  is_added,
  is_changed,
} from "../component/mod";
import { ComponentInfo } from "../component/register";
import { MAX_CHANGE_TICK_DELTA } from "../constants";
import { Entity, INVALID_ENTITY_INDEX } from "../entity/mod";
import { ComponentStorage, EntitySlice } from "./components";
import { PhantomComponentStorage } from "./phantom";

/**
 * Default storage for components.
 */
export class ComponentSparseSet implements ComponentStorage {
  readonly info: ComponentInfo;
  readonly dense: Vec<ComponentInstance>;
  readonly entities: Vec<Entity>;
  readonly sparse: Map<Entity, number>;

  readonly flags: Vec<ComponentFlags>;
  readonly added: Uint32Array;
  readonly changed: Uint32Array;

  /**
   * Phantom storages that references this storage are stored here so it can
   * be notified if a component of it's component type has been removed.
   */
  readonly phantoms: Map<Component, PhantomComponentStorage>;

  /**
   * Registeres a phantom storage.
   * @param reference
   */
  register_phantom(reference: PhantomComponentStorage) {
    this.phantoms.set(reference.info.component, reference);
  }

  constructor(capacity: number, info: ComponentInfo, allocator?: Allocator<ComponentInstance>) {
    // storage metadata
    this.info = info;
    this.phantoms = new Map();

    // component storage
    this.dense = vec(capacity, allocator);
    this.entities = vec(capacity, () => Entity.null);
    this.sparse = new Map();

    // component state
    this.added = new Uint32Array(iter(capacity, () => 0));
    this.changed = new Uint32Array(iter(capacity, () => 0));
    this.flags = vec(capacity, ComponentFlags.None);

    /**
     * @todo why do i have to manually bind this?
     */
    this.realloc = this.realloc.bind(this);
  }

  /**
   * Insert component value, flags & ticks for given `entity`.
   * @param entity
   * @param value
   * @param flags
   * @returns
   */
  insert(
    entity: Entity,
    value: ComponentInstance,
    flags: ComponentFlags,
    change_tick: ComponentTick,
  ): ComponentInstance {
    const dense_index = this.sparse.get(entity);

    if (dense_index == undefined) {
      return this.allocate_new(entity, value, flags, change_tick);
    }

    if (this.phantoms.size > 0) {
      // Remove from phantom storages
      for (const phantom of this.phantoms.values()) {
        const match_instance = value instanceof phantom?.info.component;
        if (!match_instance) {
          phantom?.entities.delete(entity);
        }
      }
    }

    this.dense.raw[dense_index].dispose?.();
    this.dense.raw[dense_index] = value;
    this.flags.raw[dense_index] = flags;
    this.added[dense_index] = change_tick;
    this.changed[dense_index] = change_tick;
    return value;
  }

  private allocate_new(
    entity: Entity,
    value: ComponentInstance,
    flags: ComponentFlags,
    change_tick: ComponentTick,
  ) {
    const dense_index = this.dense.length;
    this.sparse.set(entity, dense_index);
    this.entities.push(entity);
    this.dense.push(value);
    this.flags.push(flags);
    this.added[dense_index] = change_tick;
    this.changed[dense_index] = change_tick;
    return value;
  }

  /**
   * Remove component entry from given entity.
   * Will call `dispose` on component instance if the function is available.
   * @param entity
   * @returns
   */
  remove(entity: Entity) {
    const dense_index = this.sparse.get(entity);

    if (dense_index == undefined) {
      return false;
    }

    this.sparse.delete(entity);

    const current_length = this.entities.length - 1;

    this.entities.swap_remove(dense_index);
    this.flags.swap_remove(dense_index);

    swap(this.added, dense_index, current_length);
    swap(this.changed, dense_index, current_length);

    // Remove & call dispose if component implements it
    const value = this.dense.swap_remove(dense_index);
    value?.dispose?.();

    if (this.phantoms.size > 0) {
      // Remove from phantom storages
      for (const phantom of this.phantoms.values()) {
        phantom?.entities.delete(entity);
      }
    }

    const is_last = dense_index === this.dense.length;

    if (!is_last) {
      const swapped_entity = this.entities.raw[dense_index];
      this.sparse.set(swapped_entity, dense_index);
    }

    return true;
  }

  /**
   * Get component for given entity.
   * @param entity
   * @returns
   */
  get(entity: Entity) {
    return this.dense.raw[this.sparse.get(entity)!];
  }

  /**
   * Returns true if storage has given entity.
   * @param entity
   * @returns
   */
  has(entity: Entity) {
    return this.sparse.has(entity);
  }

  /**
   * Set component flag for entity to the value returned by given `fn` function.
   * @param entity
   * @param fn
   */
  set_flag(entity: Entity, fn: (flag: ComponentFlags) => ComponentFlags) {
    const dense_index = this.sparse.get(entity)!;
    this.flags.raw[dense_index] = fn(this.flags.raw[dense_index]);
  }

  /**
   * Set the value of the added tick for given entity
   * @param entity
   * @param changed_tick
   */
  set_added_tick(entity: Entity, changed_tick: number) {
    const dense_index = this.sparse.get(entity)!;
    this.added[dense_index] = changed_tick;
  }

  /**
   * Set the value of the change tick for given entity
   * @param entity
   * @param changed_tick
   */
  set_changed_tick(entity: Entity, changed_tick: number) {
    const dense_index = this.sparse.get(entity)!;
    this.changed[dense_index] = changed_tick;
  }

  /**
   * Returns true if component was added for given entity for current tick retrieved
   * from `runtime.change_tick`.
   * @param entity
   * @returns
   */
  is_added(entity: Entity) {
    return is_added(this.get_ticks(entity));
  }

  /**
   * Returns true if component was changed for given entity for current tick retrieved
   * from `runtime.change_tick`.
   * @param entity
   * @returns
   */
  is_changed(entity: Entity) {
    return is_changed(this.get_ticks(entity));
  }

  /**
   * Get component & flags for given entity as a tuple.
   * @param entity
   * @returns
   */
  get_with_state(entity: Entity) {
    const dense_index = this.sparse.get(entity)!;
    return [
      this.dense.raw[dense_index],
      this.flags.raw[dense_index],
      this.added[dense_index],
      this.changed[dense_index],
    ] as const;
  }

  /**
   * Get component change ticks for given `entity`.
   * @param entity
   * @returns
   */
  get_ticks(entity: Entity) {
    const dense_index = this.sparse.get(entity)!;
    return [this.added[dense_index], this.changed[dense_index]] as const;
  }

  /**
   * Check & clamp component change ticks with given `change_tick`
   * @param change_tick
   */
  check_ticks(change_tick: number) {
    for (let i = 0; i < this.dense.length; i++) {
      this.check_tick(i, this.added, change_tick);
      this.check_tick(i, this.changed, change_tick);
    }
  }

  private check_tick(index: number, array: Uint32Array, change_tick: number) {
    const last_change_tick = array[index];
    const tick_delta = change_tick - last_change_tick;

    if (tick_delta > MAX_CHANGE_TICK_DELTA) {
      array[index] = change_tick - MAX_CHANGE_TICK_DELTA;
    }
  }

  /**
   * Reallocate storage to given `length`.
   * @param length
   */
  realloc(length: number) {
    /**
     * @todo figure out if we can reallocate a typed array without creating a new one.
     */
    //@ts-ignore
    this.added = new Uint32Array(iter(length, (x) => this.added[x] ?? 0));
    //@ts-ignore
    this.changed = new Uint32Array(iter(length, (x) => this.changed[x] ?? 0));
  }

  /**
   * Returns true if component storage is empty.
   * @returns
   */
  empty() {
    return this.dense.empty();
  }

  /**
   * Returns an entity slice for this storage.
   * @returns
   */
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
