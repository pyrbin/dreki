import { SparseSet, slice_of } from "@dreki.land/collections";
import { ComponentInstance, ComponentFlags, Component } from "../component/mod";
import { ComponentInfo } from "../component/register";
import { Entity } from "../entity/mod";
import { ComponentStorage } from "./components";

/**
 * Phantom component storage. Phantom storages doesn't store data (other than belonging entities) but
 * rather references another component storage.
 */
export class PhantomComponentStorage implements ComponentStorage {
  readonly entities: SparseSet<number, Entity>;
  readonly component_info: ComponentInfo;

  reference: ComponentStorage;

  constructor(info: ComponentInfo, storage: ComponentStorage) {
    this.entities = new SparseSet(storage.capacity);
    this.component_info = info;
    this.reference = storage;
    this.change_reference(storage);
  }

  change_reference(storage: ComponentStorage) {
    storage.register_phantom(this);
    this.reference = storage;
  }

  insert(entity: Entity, value: ComponentInstance, flags: ComponentFlags): ComponentInstance {
    this.entities.insert(entity.index, entity);
    return this.reference.insert(entity, value, flags);
  }

  remove(entity: Entity): boolean {
    this.entities.remove(entity.index);
    return this.reference.remove(entity);
  }

  get(entity: Entity): ComponentInstance {
    return this.entities.contains(entity.index)
      ? this.reference.get(entity)
      : ((undefined as unknown) as ComponentInstance);
  }

  get_with_flags(entity: Entity): [ComponentInstance, ComponentFlags] {
    return (this.entities.contains(entity.index)
      ? this.reference.get_with_flags(entity)
      : [undefined, undefined]) as [ComponentInstance, ComponentFlags];
  }

  set_flag(entity: Entity, fn: (flag: ComponentFlags) => ComponentFlags) {
    if (!this.entities.contains(entity.index)) return;
    this.reference.set_flag(entity, fn);
  }

  has(entity: Entity): boolean {
    return this.entities.contains(entity.index);
  }

  clear_flags() {
    this.reference.clear_flags();
  }

  register_phantom(reference: PhantomComponentStorage) {
    this.reference.register_phantom(reference);
  }

  /**
   * This doesn't do anything because phantom storages doesn't allocate any data.
   * Access it's reference storage `PhantomComponentStorage.reference.realloc` instead.
   * @param length
   * @returns
   */
  realloc(length?: number): void {
    return;
  }

  empty(): boolean {
    return this.entities.length === 0;
  }

  entity_slice() {
    return slice_of(this.entities.dense.raw, 0, this.length);
  }

  get length() {
    return this.entities.length;
  }

  get capacity() {
    return this.reference.capacity;
  }
}
