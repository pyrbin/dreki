import { bitflags, getInstanceAndType } from "@dreki.land/shared";
import {
  Component,
  ComponentBundle,
  ComponentFlags,
  Components,
  ReadonlyComponents,
} from "../component/mod";
import { getComponentId, getComponentInfoOrRegister } from "../component/register";
import type { Entity } from "../entity/mod";
import { Entities } from "../entity/entities";
import type { Resource } from "./resources";
import { Storage } from "../storage/mod";
import { Runtime } from "./Runtime";
import { Scheduler } from "../scheduler/mod";
import {
  DEFAULT_ENTITY_CAPACITY,
  INITIAL_COMPONENT_SPARSE_SETS_COUNT,
  MAX_ENTITY_CAPACITY,
} from "../constants";
import { WorldBuilder } from "./builder";
import type { Plugins } from "./plugin";
import { EventsCounter, EventStorage, Event, eventInternal, EventWriter } from "./events";
import { Commands } from "./commands";
import { Resources } from "../storage/resources";

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
 * This error is thrown when `World.resource` is called & requested resource doesn't exist in world.
 * This is being catched in `Stage` & thus doesn't stop the `World.update` execution but makes sure that
 * a system isn't being run when requested resource doesn't exist.
 * ---
 * ? not sure if this is something I want to keep, but it would be nice to create dependencies
 * ? between resources & systems without increasing verbosity.
 */
export class ResourceNotFoundError extends Error {
  constructor(world: World, resource: Resource) {
    super(`Resource ${resource.name} not found on world (id: ${world.id}).`);
  }
}

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

  changeTick = 1;
  lastChangeTick = 0;
  eventsCounter: EventsCounter;

  #shouldRunStartup = true;

  get capacity() {
    return this.entities.capacity;
  }

  /**
   * Returns a new instance of {@link WorldBuilder}.
   * @returns
   */
  static build() {
    return new WorldBuilder();
  }

  /**
   * Create a new World with given options. You should never use this, always create
   * new worlds using {@link WorldBuilder}.
   * @see {@link World.build}
   * @param options
   */
  constructor(options?: WorldOptions) {
    this.id = Runtime.worldIdCounter++;
    Runtime.worlds.set(this.id, this);

    const capacity = Math.min(options?.capacity ?? DEFAULT_ENTITY_CAPACITY, MAX_ENTITY_CAPACITY);

    this.storage = new Storage(INITIAL_COMPONENT_SPARSE_SETS_COUNT, (entity, storage) => {
      storage?.setChangedTick(entity, this.changeTick);
    });

    this.plugins = [];
    this.events = new Map();
    this.eventsCounter = new Map();
    this.scheduler = new Scheduler();
    this.resources = new Resources();
    this.entities = new Entities(capacity, (length) => {
      this.storage.realloc(length);
    });

    this.#updateRuntime();
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
   *  Retrieves a {@link Commands} instance for give `entity`
   *
   * @example
   *  ```typescript
   *  world.commands(player)
   *       .add(Velocity)
   *       .remove(StaticTag);
   *  ```
   * @param entity
   * @returns
   */
  commands(entity: Entity) {
    return new Commands(entity, this);
  }

  /**
   * Add `components` to the given `entity`. If a `component` constructor is supplied
   * an instance will be created using `new`. If entity already have given
   * component(s), the operation will be ignored.
   * @param entity
   * @param components
   */
  add(entity: Entity, ...components: ComponentBundle) {
    for (let i = 0; i < components.length; i++) {
      const [instance, type] = getInstanceAndType(components[i]);
      if (this.has(entity, type)) continue;
      const info = getComponentInfoOrRegister(type);
      this.storage
        .getOrCreate(info, this.capacity)
        .insert(entity, instance, ComponentFlags.None, this.changeTick);
    }
  }

  /**
   * Removes `components` of given types from the given `entity`.
   * @param entity
   * @param components
   */
  remove(entity: Entity, ...components: ReadonlyComponents) {
    for (let i = 0; i < components.length; i++) {
      const componentId = getComponentId(components[i]);
      this.storage.get(componentId).remove(entity);
    }
  }

  /**
   * Retrieves an instance to the given `entity`'s `component` of the given type.
   * @param entity
   * @param component
   * @returns
   */
  get<T extends Component>(entity: Entity, component: T) {
    return this.storage.get(getComponentId(component))?.get(entity) as InstanceType<T>;
  }

  /**
   * Retrieves a single `entity` that has given `component`. Enforces singleton pattern, will throw
   * if the component storage contains more than 1 entity, return undefined if no entities exist.
   * @param component
   * @returns
   */
  single<T extends Component>(component: T) {
    const storage = this.storage.get(getComponentId(component));
    if (storage == undefined) {
      return undefined;
    }
    if (storage.length > 1) {
      throw new Error(`There exist more than 0 entity with component ${component.name}!`);
    }
    if (storage.length === 1) {
      return storage.entitySlice().get(0);
    }
  }

  /**
   * Safe call to {@link World.single}. Will catch any error thrown & return undefined instead.
   * @param component
   * @returns
   */
  trySingle<T extends Component>(component: T) {
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
      .get(getComponentId(component))
      ?.setFlag(entity, (flag: ComponentFlags) => bitflags.remove(flag, ComponentFlags.Disabled));
  }

  /**
   * Return true If disable flag is not set for given `component` for given `entity`.
   * @param entity
   * @param component
   * @returns
   */
  enabled<T extends Component>(entity: Entity, component: T) {
    return !this.disabled(entity, component);
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
      .get(getComponentId(component))
      ?.setFlag(entity, (flag: ComponentFlags) => bitflags.insert(flag, ComponentFlags.Disabled));
  }

  /**
   * Return true If disable flag is set for given `component` for given `entity`.
   * @param entity
   * @param component
   * @returns
   */
  disabled<T extends Component>(entity: Entity, component: T) {
    return bitflags.contains(
      this.storage.get(getComponentId(component))?.getWithState(entity)?.[1] ?? ComponentFlags.None,
      ComponentFlags.Disabled,
    );
  }

  /**
   * Returns true if an `entity` has given `component`.
   * @param entity
   * @param component
   * @returns
   */
  has(entity: Entity, component: Component) {
    return this.storage.get(getComponentId(component))?.has(entity) ?? false;
  }

  /**
   * Returns true if given `component` was removed from given `entity`
   * since last call to `clearTrackers`.
   * @param entity
   * @param component
   * @returns
   */
  wasRemoved(entity: Entity, component: Component) {
    return this.storage.get(getComponentId(component))?.hasRemoved(entity) ?? false;
  }

  /**
   * Returns component instance if given `component` was removed from given `entity`
   * since last call to `clearTrackers` else returns undefined.
   * @param entity
   * @param component
   * @returns
   */
  getRemoved<T extends Component>(entity: Entity, component: T) {
    return this.storage.get(getComponentId(component))?.getRemoved(entity);
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
   * Get `resource` of given type. Throws [ResourceNotFoundError] if the resource isn't found.
   * @see ResourceNotFoundError
   * @param resource
   * @returns
   */
  resource<T extends Resource>(resource: T) {
    const res = this.resources.get<T>(resource);
    if (res === undefined) {
      throw new ResourceNotFoundError(this, resource);
    } else {
      return res as InstanceType<T>;
    }
  }

  /**
   * Get `resource` of given type.
   * @param resource
   * @returns
   */
  hasResource<T extends Resource>(resource: T) {
    return this.resources.has(resource);
  }

  /**
   * Add a `resource` to the world.
   * @param resource
   */
  addResource<T extends Resource>(resource: T | InstanceType<T>) {
    const [instance] = getInstanceAndType(resource);
    this.resources.insert(instance);
  }

  /**
   * Delete a `resource` from the world.
   * @param resource
   * @returns
   */
  deleteResource<T extends Resource>(resource: T) {
    return this.resources.free(resource);
  }

  /**
   * Runs the `Scheduler` which updates all stages & systems.
   */
  update() {
    Runtime.currentWorld = this;

    if (this.#shouldRunStartup) {
      this.scheduler.runStartup(this);
      this.#shouldRunStartup = false;
    }

    this.scheduler.run(this);
    this.clearTrackers();

    // update event stores
    for (const [, store] of this.events) {
      store.update();
    }
  }

  /**
   * Increment world change tick & return the value.
   * @returns
   */
  incrementChangeTick() {
    return (this.changeTick += 1);
  }

  /**
   * Check & clamp component change ticks
   */
  checkChangeTicks() {
    this.storage.checkChangeTicks(this.changeTick);
  }

  /**
   * Clears all component state tracker.
   */
  clearTrackers() {
    // increment world lastChange tick.
    this.lastChangeTick = this.incrementChangeTick();

    // clear removed trackers
    this.storage.clearRemovedCache();

    // update Runtime
    this.#updateRuntime();
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
   * Register a `component` to the world. Returns true if successfully registered or
   * if it was already registered.
   * @param component
   * @returns
   */
  register(component: Component) {
    const storage = this.storage.getOrCreate(getComponentInfoOrRegister(component), this.capacity);
    return storage !== undefined;
  }

  /**
   * Retrieves an event read/write access for given component for this world with
   * this worlds event counter.
   * @param event
   * @returns
   */
  event(event: Event) {
    return eventInternal(event, this, this.eventsCounter);
  }

  /**
   * Retrieves an event writer for given event for this world.
   * @param event
   * @returns
   */
  eventWriter<T extends Event>(event: T): EventWriter<T> {
    return { emit: eventInternal(event, this, this.eventsCounter)["emit"] };
  }

  /**
   * Update Runtime with this World's values.
   */
  #updateRuntime() {
    Runtime.lastChangeTick = this.lastChangeTick;
    Runtime.lastEventCounts = this.eventsCounter;
  }
}
