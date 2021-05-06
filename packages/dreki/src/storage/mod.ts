import { SparseSet } from "@dreki.land/collections";
import { ComponentId } from "../component/mod";
import { ComponentStorage, EntitySlice } from "./components";
import {
  ComponentInfo,
  get_component_id,
  get_component_info_or_register,
} from "../component/register";
import { ProxyObserver } from "./proxy";
import type { Entity } from "../entity/mod";
import { PhantomComponentStorage } from "./phantom";
import { ComponentSparseSet } from "./sparse-set";

export class Storage {
  readonly sets: SparseSet<ComponentId, ComponentStorage>;
  readonly observer: ProxyObserver;

  constructor(
    initial_component_count: number,
    changed_callback?: (entity: Entity, storage: ComponentStorage) => unknown,
  ) {
    this.sets = new SparseSet(initial_component_count);
    this.observer = new ProxyObserver((entity, component) =>
      changed_callback?.(entity, this.sets.get(component)!),
    );
  }

  get(id: ComponentId) {
    return this.sets.get_unchecked(id);
  }

  get_observed(entity: Entity, info: ComponentInfo) {
    return this.observer.track(this.get(info.id).get(entity), entity, info.id);
  }

  get_or_create(info: ComponentInfo, with_capacity: number): ComponentStorage {
    let storage: ComponentStorage | undefined = undefined;

    if (!this.sets.contains(info.id)) {
      // Determine if this component set should reference an existing or not.
      if (info.super && get_component_id(info.super)) {
        // If component info has a super registered & that super class is registered as a component,
        // get or create it's storage & create a phantom storage.
        const parent = this.get_or_create(
          get_component_info_or_register(info.super),
          with_capacity,
        );
        storage = new PhantomComponentStorage(info, parent);
      } else {
        // Else create a default component storage.
        storage = new ComponentSparseSet(with_capacity, info);
      }

      // Creating a new storage may create conflicts between existing phantom -> storage links
      this.resolve_storage_types_with_inserted(storage);

      this.sets.insert(info.id, storage);
    }

    return storage ?? this.sets.get_unchecked(info.id);
  }

  /**
   * Resolves existing storage links & types for a new storage that's to be inserted.
   * @param info
   * @param new_storage
   */
  private resolve_storage_types_with_inserted(new_storage: ComponentStorage) {
    const info = new_storage.info;
    for (const other of this.sets) {
      const other_info = other.info;
      if (!other_info?.super || other_info.super !== info.component) continue;
      if (other instanceof PhantomComponentStorage) {
        // If it's a phantom storage, migrate existing entities
        for (const entity of other.entities) {
          (new_storage as PhantomComponentStorage).entities.add(entity);
        }
        // migrate removed components/entities
        for (const entity of other.removed) {
          (new_storage as PhantomComponentStorage).removed.add(entity);
        }
        // set reference to the new storage that's to be inserted.
        other.set_reference(new_storage);
      } else if (other instanceof ComponentSparseSet) {
        // If it's a non-phantom storage, it should be converted to one & point to the
        // new storage that's to be inserted.
        const phantom_storage = new PhantomComponentStorage(other_info, new_storage);
        for (const entity of other.entities) {
          // Migrate existing components & entities.
          const result = other.get_with_state(entity)!;
          phantom_storage.insert(entity, result[0], result[1], result[2]);
          phantom_storage.set_changed_tick(entity, result[3]);
        }
        for (const [entity, component] of other.removed) {
          // migrate removed components/entities
          new_storage.add_removed(entity, component);
        }
        for (const [, ph] of other.phantoms) {
          // register previous phantom storages.
          new_storage.register_phantom(ph);
        }
        // replace old storage with created phantom storage.
        this.sets.insert(other_info.id, phantom_storage);
      }
    }
  }

  /**
   * Check & clamp component change ticks with given `change_tick`
   * @param change_tick
   */
  check_change_ticks(change_tick: number) {
    for (let i = 0; i < this.sets.dense.length; i++) {
      this.sets.dense.raw[i].check_ticks(change_tick);
    }
  }

  /**
   * Clear remove caches in storages.
   * @param change_tick
   */
  clear_removed_cache() {
    for (let i = 0; i < this.sets.dense.length; i++) {
      this.sets.dense.raw[i].clear_removed();
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
  shortest_slice_of(...components: ComponentInfo[]): EntitySlice | undefined {
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
    return set?.entity_slice() ?? undefined;
  }

  /**
   * Like `shortest_slice_of` but also includes removed entities since last call to `clear_removed_caches`.
   * @param components
   * @returns
   */
  shortest_slice_of_with_removed(...components: ComponentInfo[]): EntitySlice | undefined {
    let length = 0xfffff;
    let set: ComponentStorage | undefined = undefined;

    for (let i = 0; i < components.length; i++) {
      const info = components[i];
      const current = this.get(info.id);
      if (current === undefined) return undefined;
      if (current.length_with_removed < length) {
        length = current.length_with_removed;
        set = current;
      }
    }
    return set?.entity_slice(true) ?? undefined;
  }
}

export { Resources } from "./resources";
