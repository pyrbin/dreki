import { record } from "@dreki.land/shared";
import { Allocator, Disposable, iter, swap, Vec, vec, sliceOf } from "@dreki.land/shared";
import {
  ComponentInstance,
  ComponentFlags,
  ComponentTick,
  isAdded,
  isChanged,
  ComponentId,
} from "../component/mod";
import { ComponentInfo } from "../component/register";
import { MAX_CHANGE_TICK_DELTA } from "../constants";
import { Entity } from "../entity/mod";
import { ComponentState, ComponentStorage, MutableComponentState } from "./components";
import { PhantomComponentStorage } from "./phantom";

/**
 * Default storage for components.
 */
export class ComponentSparseSet implements ComponentStorage {
  readonly info: ComponentInfo;
  readonly dense: Vec<ComponentInstance>;
  readonly entities: Vec<Entity>;

  readonly sparse: record<Entity, number | undefined>;
  readonly removed: Map<Entity, ComponentInstance>;

  readonly flags: Vec<ComponentFlags>;
  readonly added: Uint32Array;
  readonly changed: Uint32Array;

  /**
   * Phantom storages that references this storage are stored here so it can
   * be notified if a component of it's component type has been removed.
   */
  readonly phantoms: record<ComponentId, PhantomComponentStorage>;

  /**
   * Registeres a phantom storage.
   * @param reference
   */
  registerPhantom(reference: PhantomComponentStorage) {
    this.phantoms[reference.info.id] = reference;
  }

  constructor(capacity: number, info: ComponentInfo, allocator?: Allocator<ComponentInstance>) {
    // storage metadata
    this.info = info;
    this.phantoms = {};
    this.removed = new Map();

    // component storage
    this.dense = vec(capacity, allocator);
    this.entities = vec(capacity, () => Entity.none);
    this.sparse = {};

    // component state
    this.added = new Uint32Array(iter(capacity, () => 0));
    this.changed = new Uint32Array(iter(capacity, () => 0));
    this.flags = vec(capacity, ComponentFlags.None);

    /**
     * todo: why do i have to manually bind this?
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
    changeTick: ComponentTick,
  ): ComponentInstance {
    const denseIndex = this.sparse[entity];

    if (denseIndex == undefined) {
      return this.#allocateNew(entity, value, flags, changeTick);
    }

    // remove from phantom storages
    for (const key in this.phantoms) {
      const phantom = this.phantoms[key];
      const matchInstance = value instanceof phantom?.info.component;
      if (!matchInstance) {
        phantom?.entities.delete(entity);
      }
    }

    (this.dense.raw[denseIndex] as Disposable).dispose?.();
    this.dense.raw[denseIndex] = value;
    this.flags.raw[denseIndex] = flags;
    this.added[denseIndex] = changeTick;
    this.changed[denseIndex] = changeTick;
    return value;
  }

  #allocateNew(
    entity: Entity,
    value: ComponentInstance,
    flags: ComponentFlags,
    changeTick: ComponentTick,
  ) {
    const denseIndex = this.dense.length;
    this.sparse[entity] = denseIndex;
    this.entities.push(entity);
    this.dense.push(value);
    this.flags.push(flags);
    this.added[denseIndex] = changeTick;
    this.changed[denseIndex] = changeTick;
    return value;
  }

  /**
   * Remove component entry from given entity.
   * Will call `dispose` on component instance if the function is available.
   * @param entity
   * @returns
   */
  remove(entity: Entity) {
    const denseIndex = this.sparse[entity];

    if (denseIndex == undefined) {
      return false;
    }

    this.sparse[entity] = undefined;

    const currentLength = this.entities.length - 1;

    this.entities.swapRemove(denseIndex);
    this.flags.swapRemove(denseIndex);

    swap(this.added, denseIndex, currentLength);
    swap(this.changed, denseIndex, currentLength);

    // remove component
    const value = this.dense.swapRemove(denseIndex);

    // add to remove buffer
    this.removed.set(entity, value);

    // remove from phantom storages
    for (const key in this.phantoms) {
      const phantom = this.phantoms[key];
      if (phantom.entities.has(entity)) {
        phantom.entities.delete(entity);
        phantom.removed.add(entity);
      }
    }

    const isLast = denseIndex === this.dense.length;

    if (!isLast) {
      const swappedEntity = this.entities.raw[denseIndex];
      this.sparse[swappedEntity] = denseIndex;
    }

    return true;
  }

  /**
   * Get component for given entity.
   * @param entity
   * @returns
   */
  get(entity: Entity) {
    return this.dense.raw[this.sparse[entity]!];
  }

  /**
   * Returns true if storage has given entity.
   * @param entity
   * @returns
   */
  has(entity: Entity) {
    return Boolean(this.sparse[entity]);
  }

  /**
   * Set component flag for entity to the value returned by given `fn` function.
   * @param entity
   * @param fn
   */
  setFlag(entity: Entity, fn: (flag: ComponentFlags) => ComponentFlags) {
    const denseIndex = this.sparse[entity]!;
    this.flags.raw[denseIndex] = fn(this.flags.raw[denseIndex]);
  }

  /**
   * Set the value of the added tick for given entity
   * @param entity
   * @param changedTick
   */
  setAddedTick(entity: Entity, changedTick: number) {
    const denseIndex = this.sparse[entity]!;
    this.added[denseIndex] = changedTick;
  }

  /**
   * Set the value of the change tick for given entity
   * @param entity
   * @param changedTick
   */
  setChangedTick(entity: Entity, changedTick: number) {
    const denseIndex = this.sparse[entity]!;
    this.changed[denseIndex] = changedTick;
  }

  /**
   * Returns true if component was added for given entity for current tick retrieved
   * from `Runtime.changeTick`.
   * @param entity
   * @returns
   */
  isAdded(entity: Entity) {
    return isAdded(this.getTicks(entity));
  }

  /**
   * Returns true if component was changed for given entity for current tick retrieved
   * from `Runtime.changeTick`.
   * @param entity
   * @returns
   */
  isChanged(entity: Entity) {
    return isChanged(this.getTicks(entity));
  }

  /**
   * Array used when returning state from {@link ComponentSparseSet.getWithState} to avoid GC.
   */
  static readonly #stateResult: MutableComponentState = [{}, ComponentFlags.None, 0, 0];

  /**
   * Get component & flags for given entity as a tuple.
   * @param entity
   * @returns
   */
  getWithState(entity: Entity) {
    const denseIndex = this.sparse[entity];
    if (denseIndex == undefined) return undefined;

    ComponentSparseSet.#stateResult[0] = this.dense.raw[denseIndex];
    ComponentSparseSet.#stateResult[1] = this.flags.raw[denseIndex];
    ComponentSparseSet.#stateResult[2] = this.added[denseIndex];
    ComponentSparseSet.#stateResult[3] = this.changed[denseIndex];

    return ComponentSparseSet.#stateResult as ComponentState;
  }

  /**
   * Get component change ticks for given `entity`.
   * @param entity
   * @returns
   */
  getTicks(entity: Entity) {
    const denseIndex = this.sparse[entity]!;
    return [this.added[denseIndex], this.changed[denseIndex]] as const;
  }

  /**
   * Check & clamp component change ticks with given `changeTick`
   * @param changeTick
   */
  checkTicks(changeTick: number) {
    for (let i = 0; i < this.dense.length; i++) {
      this.#checkTick(i, this.added, changeTick);
      this.#checkTick(i, this.changed, changeTick);
    }
  }

  #checkTick(index: number, array: Uint32Array, changeTick: number) {
    const lastChangeTick = array[index];
    const tickDelta = changeTick - lastChangeTick;

    if (tickDelta > MAX_CHANGE_TICK_DELTA) {
      array[index] = changeTick - MAX_CHANGE_TICK_DELTA;
    }
  }

  /**
   * Reallocate storage to given `length`.
   * @param length
   */
  realloc(length: number) {
    // todo: figure out if we can reallocate a typed array without creating a new one.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    this.added = new Uint32Array(iter(length, (x) => this.added[x] ?? 0));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    this.changed = new Uint32Array(iter(length, (x) => this.changed[x] ?? 0));
  }

  /**
   * Inserts an entity & component pair to removed cache.
   * ! this is only used when migrating data when creating new storages & phantom storages
   * @param entity
   * @param component
   */
  addRemoved(entity: Entity, component: ComponentInfo) {
    this.removed.set(entity, component);
  }

  /**
   * Returns a component (or undefined) if it's been removed since last frame for entity.
   * @param entity
   * @returns
   */
  getRemoved(entity: Entity) {
    return this.removed.get(entity);
  }

  /**
   * Returns true if given `entity` has been removed from this storage.
   * @param entity
   * @returns
   */
  hasRemoved(entity: Entity) {
    return this.removed.has(entity);
  }

  /**
   *  Clear removed buffer
   */
  clearRemoved() {
    for (const [entity, component] of this.removed) {
      // Call dispose if component implements it
      (component as Disposable)?.dispose?.();
      this.removed.delete(entity);
    }
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
  entitySlice() {
    return sliceOf(this.entities.raw, 0, this.length);
  }

  /**
   * Returns an entity slice for this storage with removed.
   * @returns
   */
  entitySliceWithRemoved() {
    return sliceOf([...this.entities.raw, ...this.removed.keys()], 0, this.lengthWithRemoved);
  }

  get lengthWithRemoved() {
    return this.entities.length + this.removed.size;
  }

  get length() {
    return this.dense.length;
  }

  get capacity() {
    return this.dense.capacity;
  }
}
