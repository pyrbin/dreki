import { Vec, vec } from "@dreki.land/collections";
import { Allocator, bitflags } from "@dreki.land/shared";
import { Entity } from "../entity/mod";
import { ComponentInstance, ComponentFlags } from "../component/mod";

/**
 * ComponentSparseSet
 */
export class ComponentSparseSet {
  readonly dense: Vec<ComponentInstance>;
  readonly flags: Vec<ComponentFlags>;
  readonly entities: Vec<Entity>;
  readonly sparse: Vec<number | -1>;

  constructor(capacity: number, allocator?: Allocator<ComponentInstance>) {
    this.dense = vec(capacity, allocator);
    this.flags = vec(capacity, ComponentFlags.Empty);
    this.entities = vec(capacity, () => new Entity(0, 0));
    this.sparse = vec(capacity, () => -1);
  }

  insert(entity: Entity, value: ComponentInstance, flags: ComponentFlags) {
    const { index } = entity;
    let dense_index = this.sparse.raw[index];

    if (dense_index !== -1) {
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

  remove(entity: Entity) {
    const { index } = entity;
    const dense_index = this.sparse.raw[index];

    if (dense_index === -1) {
      return false;
    }

    this.flags.swap_remove(dense_index);
    this.entities.swap_remove(dense_index);

    /** Remove & call dispose if component implements it */
    const value = this.dense.swap_remove(index);
    value?.dispose?.();

    const is_last = dense_index === this.dense.length - 1;

    if (!is_last) {
      const swapped_index = this.entities.raw[dense_index];
      this.sparse.raw[swapped_index.index] = dense_index;
    }

    this.sparse.raw[index] = -1;
    return true;
  }

  get(entity: Entity) {
    return this.dense.raw[this.sparse.raw[entity.index]!];
  }

  has(entity: Entity) {
    return this.sparse.raw[entity.index] !== -1;
  }

  set_flag(entity: Entity, setter: (flag: ComponentFlags) => ComponentFlags) {
    const dense_index = this.sparse.raw[entity.index];
    this.flags.raw[dense_index] = setter(this.flags.raw[dense_index]);
  }

  get_with_flags(entity: Entity) {
    const dense_index = this.sparse.raw[entity.index];
    return [this.dense.raw[dense_index], this.flags.raw[dense_index]] as const;
  }

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

  realloc(length?: number) {
    this.sparse.realloc(length);
    this.sparse.resize(this.sparse.capacity);
  }

  empty() {
    return this.dense.empty();
  }

  get len() {
    return this.dense.length;
  }

  get capacity() {
    return this.dense.capacity;
  }
}
