import { SparseSet } from "@dreki.land/collections";
import { ComponentId } from "../component/mod";
import { ComponentStorage, EntitySlice } from "./components";
import { ComponentInfo, getComponentId, getComponentInfoOrRegister } from "../component/register";
import { ProxyObserver } from "./proxy";
import type { Entity } from "../entity/mod";
import { PhantomComponentStorage } from "./phantom";
import { ComponentSparseSet } from "./sparse_set";

export class Storage {
  readonly sets: SparseSet<ComponentId, ComponentStorage>;
  readonly observer: ProxyObserver;

  /**
   * Create a storage of components.
   * @param initialComponentCount - initial storage size.
   * @param changedCallback - this is called whenever a observed component have been changed.
   */
  constructor(
    initialComponentCount: number,
    changedCallback?: (entity: Entity, storage: ComponentStorage) => unknown,
  ) {
    this.sets = new SparseSet(initialComponentCount);
    this.observer = new ProxyObserver((entity, component) =>
      changedCallback?.(entity, this.sets.get(component)!),
    );
  }

  get(id: ComponentId) {
    return this.sets.getUnchecked(id);
  }

  getObserved(entity: Entity, info: ComponentInfo) {
    return this.observer.track(this.get(info.id).get(entity), entity, info.id);
  }

  getOrCreate(info: ComponentInfo, withCapacity: number): ComponentStorage {
    let storage: ComponentStorage | undefined = undefined;

    if (!this.sets.contains(info.id)) {
      // Determine if this component set should reference an existing or not.
      if (info.super && getComponentId(info.super)) {
        // If component info has a super registered & that super class is registered as a component,
        // get or create it's storage & create a phantom storage.
        const parent = this.getOrCreate(getComponentInfoOrRegister(info.super), withCapacity);
        storage = new PhantomComponentStorage(info, parent);
      } else {
        // Else create a default component storage.
        storage = new ComponentSparseSet(withCapacity, info);
      }

      // Creating a new storage may create conflicts between existing phantom -> storage links
      this.#resolveWithNewStorage(storage);

      this.sets.insert(info.id, storage);
    }

    return storage ?? this.sets.getUnchecked(info.id);
  }

  /**
   * Resolves existing storage links & types for a new storage that's to be inserted.
   * @param info
   * @param newStorage
   */
  #resolveWithNewStorage(newStorage: ComponentStorage) {
    const info = newStorage.info;
    for (const other of this.sets) {
      const otherStorageInfo = other.info;
      if (!otherStorageInfo?.super || otherStorageInfo.super !== info.component) continue;
      if (other instanceof PhantomComponentStorage) {
        // If it's a phantom storage, migrate existing entities
        for (const entity of other.entities) {
          (newStorage as PhantomComponentStorage).entities.add(entity);
        }
        // migrate removed components/entities
        for (const entity of other.removed) {
          (newStorage as PhantomComponentStorage).removed.add(entity);
        }
        // set reference to the new storage that's to be inserted.
        other.setParentStorage(newStorage);
      } else if (other instanceof ComponentSparseSet) {
        // If it's a non-phantom storage, it should be converted to one & point to the
        // new storage that's to be inserted.
        const phantomStorage = new PhantomComponentStorage(otherStorageInfo, newStorage);
        for (const entity of other.entities) {
          // Migrate existing components & entities.
          const result = other.getWithState(entity)!;
          phantomStorage.insert(entity, result[0], result[1], result[2]);
          phantomStorage.setChangedTick(entity, result[3]);
        }
        for (const [entity, component] of other.removed) {
          // migrate removed components/entities
          newStorage.addRemoved(entity, component);
        }
        for (const [, ph] of other.phantoms) {
          // register previous phantom storages.
          newStorage.registerPhantom(ph);
        }
        // replace old storage with created phantom storage.
        this.sets.insert(otherStorageInfo.id, phantomStorage);
      }
    }
  }

  /**
   * Check & clamp component change ticks with given `changeTick`
   * @param changeTick
   */
  checkChangeTicks(changeTick: number) {
    for (let i = 0; i < this.sets.dense.length; i++) {
      this.sets.dense.raw[i].checkTicks(changeTick);
    }
  }

  /**
   * Clear remove caches in storages.
   * @param changeTick
   */
  clearRemovedCache() {
    for (let i = 0; i < this.sets.dense.length; i++) {
      this.sets.dense.raw[i].clearRemoved();
    }
  }

  /**
   * Reallocate each storage to given `length`.
   * @param length
   */
  realloc(length: number) {
    for (let i = 0; i < this.sets.dense.length; i++) {
      this.sets.dense.raw[i].realloc?.(length);
    }
  }

  /**
   * Returns a slice of entities from the component set with shortest entity count or
   * undefined if an ID of the given component infos haven't been registered.
   * @param components
   * @returns
   */
  shortestSliceOf(...components: ComponentInfo[]): EntitySlice | undefined {
    let length = 0xfffff;
    let set: ComponentStorage | undefined = undefined;

    for (let i = 0; i < components.length; i++) {
      const info = components[i];
      const current = this.get(info.id);
      if (current === undefined) return undefined;
      if (current.length < length) {
        length = current.length;
        set = current;
      }
    }
    return set?.entitySlice() ?? undefined;
  }

  /**
   * Like `shortestSliceOf` but also includes removed entities since last call to `clearRemovedCaches`.
   * @param components
   * @returns
   */
  shortestSliceOfWithRemoved(...components: ComponentInfo[]): EntitySlice | undefined {
    let length = 0xfffff;
    let set: ComponentStorage | undefined = undefined;

    for (let i = 0; i < components.length; i++) {
      const info = components[i];
      const current = this.get(info.id);
      if (current === undefined) return undefined;
      if (current.lengthWithRemoved < length) {
        length = current.lengthWithRemoved;
        set = current;
      }
    }
    return set?.entitySlice(true) ?? undefined;
  }
}
