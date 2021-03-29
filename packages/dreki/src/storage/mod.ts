import { slice_of, Slice, SparseSet } from "@dreki.land/collections";
import { bitflags } from "@dreki.land/shared";
import { ComponentFlags, ComponentId } from "../component/mod";
import { ComponentSparseSet, ComponentStorage, EntitySlice } from "./components";
import {
  ComponentInfo,
  get_component_id,
  get_component_info_or_register,
} from "../component/register";
import { ProxyObserver } from "./proxy";
import type { Entity } from "../entity/mod";
import { PhantomComponentStorage } from "./phantom";

export class Storage {
  readonly observer: ProxyObserver;
  readonly sets: SparseSet<ComponentId, ComponentStorage>;

  constructor(initial_component_count: number) {
    this.sets = new SparseSet(initial_component_count);
    this.observer = new ProxyObserver((entity, component) => {
      this.sets
        .get(component)
        ?.set_flag(entity, (flags) => bitflags.insert(flags, ComponentFlags.Changed));
    });
  }

  get_comp(entity: Entity, id: ComponentId) {
    return this.sets.get_unchecked(id).get(entity);
  }

  get_comp_with_flags(entity: Entity, id: ComponentId) {
    return this.sets.get_unchecked(id).get_with_flags(entity);
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
    const info = new_storage.component_info;
    for (const other of this.sets) {
      const other_info = other.component_info;
      if (!other_info?.super || other_info.super !== info.component) continue;
      if (other instanceof PhantomComponentStorage) {
        // If it's a phantom storage, migrate existing entities & set reference
        // to the new storage that's to be inserted.
        for (const entity of other.entities) {
          (new_storage as PhantomComponentStorage).entities.insert(entity.index, entity);
        }
        other.change_reference(new_storage);
      } else if (other instanceof ComponentSparseSet) {
        // If it's a non-phantom storage, it should be converted to one & point to the
        // new storage that's to be inserted.
        const phantom_storage = new PhantomComponentStorage(other_info, new_storage);
        for (const entity of other.entities) {
          // Migrate existing components & entities.
          phantom_storage.insert(entity, ...other.get_with_flags(entity));
        }
        for (const [, ph] of other.phantoms) {
          // Register previous phantom storages.
          new_storage.register_phantom(ph);
        }
        // Replace old storage with created phantom storage.
        this.sets.insert(other_info.id, phantom_storage);
      }
    }
  }

  /**
   * Reallocate each storage to given `length`.
   * @param length
   */
  realloc(length: number) {
    for (let i = 0; i < this.sets.dense.length; i++) {
      this.sets.dense.raw[i].realloc(length);
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

    if (set === undefined) {
      return undefined;
    }

    return set.entity_slice();
  }

  /**
   * Clears all component flags for every component storage.
   * Won't clear `ComponentFlags.Disabled` flag.
   */
  clear_flags() {
    for (let i = 0; i < this.sets.dense.length; i++) {
      this.sets.dense.raw[i].clear_flags();
    }
  }
}

export { Resources } from "./resources";
