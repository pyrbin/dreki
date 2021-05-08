import { bitflags, get_instance_and_type } from "@dreki.land/shared";
import { SparseSet } from "@dreki.land/collections";
import {
  Component,
  ComponentBundle,
  ComponentFlags,
  ComponentId,
  Components,
  INVALID_COMPONENT_ID,
  ReadonlyComponents,
} from "../component/mod";
import { get_component_id, get_component_info_or_register } from "../component/register";
import type { Entity } from "../entity/mod";
import { Entities } from "../entity/entities";
import type { Resource } from "./resources";
import { Storage, Resources } from "../storage/mod";
import { runtime } from "./runtime";
import { Scheduler } from "../scheduler/mod";
import {
  DEFAULT_ENTITY_CAPACITY,
  INITIAL_COMPONENT_SPARSE_SETS_COUNT,
  MAX_ENTITY_CAPACITY,
} from "../constants";
import { WorldBuilder } from "./builder";
import type { Plugin, Plugins } from "./plugin";
import { EventsCount, EventStorage, Event, event_internal, EventWriter } from "./events";

/**
 * Represents the id of a world
 */
export type WorldId = number;

export type WorldOptions = {
  /**
   * Initial `entity` capacity of the world.
   */
  capacity: number;
};

/**
 * World stores & exposes operations on `entities`, `components` & their respective metadata.
 * It also contains a `Scheduler` to schedule systems acting on the World.
 */
export class World {
  readonly id: WorldId;
  readonly entities: Entities;
  readonly storage: Storage;
  readonly resources: Resources;
  readonly scheduler: Scheduler;
  readonly plugins: Plugins;
  readonly events: EventStorage;

  change_tick: number = 1;
  last_change_tick: number = 0;
  events_counts: EventsCount;

  get capacity() {
    return this.entities.capacity;
  }

  /**
   * Returns a new instance of `WorldBuilder`.
   * @returns
   */
  static build() {
    return new WorldBuilder();
  }

  constructor(options?: WorldOptions) {
    this.id = runtime.world_id_counter++;
    runtime.worlds.set(this.id, this);

    const capacity = Math.min(options?.capacity ?? DEFAULT_ENTITY_CAPACITY, MAX_ENTITY_CAPACITY);

    this.storage = new Storage(INITIAL_COMPONENT_SPARSE_SETS_COUNT, (entity, storage) => {
      storage?.set_changed_tick(entity, this.change_tick);
    });

    this.events = new Map();
    this.events_counts = new Map();
    this.plugins = [];
    this.scheduler = new Scheduler();
    this.resources = new Resources();
    this.entities = new Entities(capacity, (length) => {
      this.storage.realloc(length);
    });

    this.update_runtime();
  }

  /**
   * Iterate each plugin & call their `load` function. The call order equals the order of registration.
   * Throws if a plugins load function returns false.
   * ---
   * Call this before running `update` if you have registered any plugin that implements a load function.
   */
  async load() {
    for (const plugin of this.plugins.filter((x) => x.load != undefined)) {
      const result = await plugin.load!(this);
      if (!result) {
        throw new Error(`Load failed for plugin: ${plugin}`);
      }
    }
  }

  /**
   * Spawns an entity batch of given `size` with given `components`
   * @param size
   * @param components
   * @returns
   */
  batch(size: number, ...components: Components) {
    const result: Entity[] = [];
    for (let i = 0; i < size; i++) {
      result.push(this.spawn(...components));
    }
    return result;
  }

  /**
   * Spawns a new `entity` with given `components`.
   * @param components
   * @returns
   */
  spawn(...components: ComponentBundle) {
    const entity = this.entities.allocate();
    this.add(entity, ...components);
    return entity;
  }

  /**
   * Despawns given `entity`.
   * @param entity
   */
  despawn(entity: Entity) {
    this.entities.dispose(entity);
    for (const set of this.storage.sets) {
      set.remove(entity);
    }
  }

  /**
   * Add `components` to the given `entity`. If a `component` constructor is supplied
   * an instance will be created using `new`.
   * @param entity
   * @param components
   */
  add(entity: Entity, ...components: ComponentBundle) {
    for (let i = 0; i < components.length; i++) {
      const [instance, type] = get_instance_and_type(components[i]);
      const info = get_component_info_or_register(type);
      this.storage
        .get_or_create(info, this.capacity)
        .insert(entity, instance, ComponentFlags.None, this.change_tick);
    }
  }

  /**
   * Removes `components` of given types from the given `entity`.
   * @param entity
   * @param components
   */
  remove(entity: Entity, ...components: ReadonlyComponents) {
    for (let i = 0; i < components.length; i++) {
      const component_id = get_component_id(components[i]);
      this.storage.get(component_id).remove(entity);
    }
  }

  /**
   * Retrieves an instance to the given `entity`'s `component` of the given type.
   * @param entity
   * @param component
   * @returns
   */
  get<T extends Component>(entity: Entity, component: T) {
    return this.storage.get(get_component_id(component))?.get(entity) as InstanceType<T>;
  }

  /**
   * Retrieves a single `entity` that has given `component`. Enforces singleton pattern, will throw
   * if the component storage contains more than 1 entity.
   * @param component
   * @returns
   */
  single<T extends Component>(component: T) {
    const storage = this.storage.get(get_component_id(component));
    if (storage.length > 1) {
      throw new Error(`There exist more than 0 entity with component ${component.name}!`);
    }
    if (storage.length === 1) {
      return storage.entity_slice().get(0);
    }
  }

  /**
   * Safe call to `World.single`. Will catch if any error is thrown & return undefined instead.
   * @param component
   * @returns
   */
  try_single<T extends Component>(component: T) {
    try {
      return this.single(component);
    } catch {
      return undefined;
    }
  }

  /**
   * Enables a disabled `component` for a given `entity`
   * @param entity
   * @param component
   */
  enable<T extends Component>(entity: Entity, component: T) {
    this.storage
      .get(get_component_id(component))
      ?.set_flag(entity, (flag) => bitflags.remove(flag, ComponentFlags.Disabled));
  }

  /**
   * Disables a `component` for a given `entity`.
   * Disabled components are still able to be fetched via `World.get` and
   * be mutated / used etc. However will be ignored in queries.
   *
   * @example
   * ```ts
   * const entity = world.spawn(Position)
   *
   * // matches `entity`
   * for(const [p] of query(Position)) {}
   *
   * world.disable(entity, Position);
   *
   * // no longer matches `entity`, but the component still exists
   * for(const [p] of query(Position)) {}
   * ```
   * @param entity
   * @param component
   */
  disable<T extends Component>(entity: Entity, component: T) {
    this.storage
      .get(get_component_id(component))
      ?.set_flag(entity, (flag) => bitflags.insert(flag, ComponentFlags.Disabled));
  }

  /**
   * Returns true if an `entity` has given `component`.
   * @param entity
   * @param component
   * @returns
   */
  has(entity: Entity, component: Component) {
    return this.storage.get(get_component_id(component))?.has(entity) ?? false;
  }

  /**
   * Returns true if given `component` was removed from given `entity`
   * since last call to `clear_trackers`.
   * @param entity
   * @param component
   * @returns
   */
  was_removed(entity: Entity, component: Component) {
    return this.storage.get(get_component_id(component))?.has_removed(entity) ?? false;
  }

  /**
   * Returns component instance if given `component` was removed from given `entity`
   * since last call to `clear_trackers` else returns undefined.
   * @param entity
   * @param component
   * @returns
   */
  get_removed<T extends Component>(entity: Entity, component: T) {
    return this.storage.get(get_component_id(component))?.get_removed(entity);
  }

  /**
   * Returns true if the `entity` exists.
   * @param entity
   * @returns
   */
  exists(entity: Entity) {
    return this.entities.contains(entity);
  }

  /**
   * Get `resource` of given type.
   * @param resource
   * @returns
   */
  resource<T extends Resource>(resource: T) {
    return this.resources.get<T>(resource) as InstanceType<T>;
  }

  /**
   * Add a `resource` to the world.
   * @param resource
   */
  add_resource<T extends Resource>(resource: T | InstanceType<T>) {
    const [instance] = get_instance_and_type(resource);
    this.resources.insert(instance);
  }

  /**
   * Delete a `resource` from the world.
   * @param resource
   * @returns
   */
  delete_resource<T extends Resource>(resource: T) {
    return this.resources.dispose(resource);
  }

  /**
   * Runs the `Scheduler` which updates all stages & systems.
   */
  update() {
    runtime.current_world = this;
    this.scheduler.run(this);
    this.clear_trackers();

    // update event stores
    for (const [event, store] of this.events) {
      store.update();
    }
  }

  /**
   * Increment world change tick & return the value.
   * @returns
   */
  increment_change_tick() {
    return (this.change_tick += 1);
  }

  /**
   * Check & clamp component change ticks
   */
  check_change_ticks() {
    this.storage.check_change_ticks(this.change_tick);
  }

  /**
   * Clears all component state tracker.
   */
  clear_trackers() {
    // increment world last_change tick.
    this.last_change_tick = this.increment_change_tick();

    // clear removed trackers
    this.storage.clear_removed_cache();

    // update runtime
    this.update_runtime();
  }

  /**
   * Returns an `entity` iterable that iterates every entity in the world.
   * @returns
   */
  iter(): Iterable<Entity> {
    const iterator = this.entities[Symbol.iterator]();
    return {
      [Symbol.iterator]() {
        return iterator;
      },
    };
  }

  /**
   * Register a `component` to the world. Returns true if successful or
   * false if the `component` has already been registered.
   * @param component
   * @returns
   */
  register(component: Component) {
    if (get_component_id(component) !== INVALID_COMPONENT_ID) return false;
    const info = get_component_info_or_register(component);
    return this.storage.get_or_create(info, this.capacity) !== undefined;
  }

  /**
   * Retrieves an event read/write access for given component for this world with
   * this worlds event counter.
   * @param event
   * @returns
   */
  event(event: Event) {
    return event_internal(event, this, this.events_counts);
  }

  /**
   * Retrieves an event writer for given event for this world.
   * @param event
   * @returns
   */
  event_writer<T extends Event>(event: T): EventWriter<T> {
    return { send: event_internal(event, this, this.events_counts)["send"] };
  }

  /**
   * Update runtime with this World's values.
   */
  private update_runtime() {
    runtime.last_change_tick = this.last_change_tick;
    runtime.last_event_counts = this.events_counts;
  }
}
