import { slice_of, Slice, SparseSet } from "@dreki.land/collections";
import { bitflags } from "@dreki.land/shared";
import { ComponentFlags, ComponentId } from "../component/mod";
import { ComponentSparseSet } from "./components";
import type { ComponentInfo } from "../component/register";
import { ProxyObserver } from "./proxy";
import type { Entity } from "../entity/mod";

export { Resources } from "./resources";

export type EntitySlice = Slice<Entity>;

export class Storage {
  readonly observer: ProxyObserver;
  readonly sets: SparseSet<ComponentId, ComponentSparseSet>;

  constructor(initial_component_count: number) {
    this.sets = new SparseSet(initial_component_count);
    this.observer = new ProxyObserver((entity, component) => {
      this.sets
        .get(component)
        ?.set_flag(entity, (flags) => bitflags.insert(flags, ComponentFlags.Changed));
    });
  }

  get(id: ComponentId) {
    return this.sets.get_unchecked(id);
  }

  get_comp(entity: Entity, id: ComponentId) {
    return this.sets.get_unchecked(id).get(entity);
  }

  get_comp_with_flags(entity: Entity, id: ComponentId) {
    return this.sets.get_unchecked(id).get_with_flags(entity);
  }

  get_observed(entity: Entity, info: ComponentInfo) {
    return this.observer.track(this.get(info.id).get(entity), entity, info.id);
  }

  get_or_create(info: ComponentInfo, with_capacity: number) {
    if (!this.sets.contains(info.id)) {
      this.sets.insert(info.id, new ComponentSparseSet(with_capacity));
    }
    return this.sets.get_unchecked(info.id);
  }

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
    let set: ComponentSparseSet | undefined = undefined;

    for (let i = 0; i < components.length; i++) {
      const info = components[i];
      const current = this.get(info.id);
      if (current === undefined) return undefined;
      if (current.len < length) {
        length = current.len;
        set = current;
      }
    }

    if (set === undefined) {
      return undefined;
    }

    return slice_of(set.entities.raw, 0, length);
  }

  clear_flags() {
    for (let i = 0; i < this.sets.dense.length; i++) {
      this.sets.dense.raw[i].clear_flags();
    }
  }
}
