import { SparseSet, slice_of } from "@dreki.land/collections";
import { ComponentInstance, ComponentFlags, ComponentTick } from "../component/mod";
import { ComponentInfo } from "../component/register";
import { Entity } from "../entity/mod";
import { ComponentStorage, ComponentState } from "./components";

/**
 * Phantom component storage. Phantom storages doesn't store data (other than belonging entities) but
 * rather references another component storage.
 */
export class PhantomComponentStorage implements ComponentStorage {
  readonly info: ComponentInfo;
  readonly entities: Set<Entity>;
  readonly reference: ComponentStorage;

  constructor(info: ComponentInfo, storage: ComponentStorage) {
    this.info = info;
    this.reference = storage;
    this.entities = new Set();
    this.change_reference(storage);
  }

  change_reference(storage: ComponentStorage) {
    storage.register_phantom(this);
    //@ts-ignore
    this.reference = storage;
  }

  insert(
    entity: Entity,
    value: ComponentInstance,
    flags: ComponentFlags,
    change_tick: ComponentTick,
  ): ComponentInstance {
    this.entities.add(entity);
    return this.reference.insert(entity, value, flags, change_tick);
  }

  remove(entity: Entity): boolean {
    this.entities.delete(entity);
    return this.reference.remove(entity);
  }

  get(entity: Entity): ComponentInstance {
    return this.entities.has(entity)
      ? this.reference.get(entity)
      : ((undefined as unknown) as ComponentInstance);
  }

  get_with_state(entity: Entity) {
    return this.entities.has(entity)
      ? this.reference.get_with_state(entity)
      : (([] as unknown) as ComponentState);
  }

  set_flag(entity: Entity, fn: (flag: ComponentFlags) => ComponentFlags) {
    if (!this.entities.has(entity)) return;
    this.reference.set_flag(entity, fn);
  }

  set_added_tick(entity: Entity, changed_tick: number) {
    this.reference.set_added_tick(entity, changed_tick);
  }

  set_changed_tick(entity: Entity, changed_tick: number) {
    this.reference.set_changed_tick(entity, changed_tick);
  }

  is_added(entity: Entity) {
    return this.reference.is_added(entity);
  }

  is_changed(entity: Entity) {
    return this.reference.is_changed(entity);
  }

  get_ticks(entity: Entity) {
    return this.reference.get_ticks(entity);
  }

  has(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  check_ticks(change_tick: number) {
    this.reference.check_ticks(change_tick);
  }

  register_phantom(reference: PhantomComponentStorage) {
    this.reference.register_phantom(reference);
  }

  empty(): boolean {
    return this.entities.size === 0;
  }

  entity_slice() {
    return slice_of([...this.entities], 0, this.length);
  }

  get length() {
    return this.entities.size;
  }

  get capacity() {
    return this.reference.capacity;
  }
}
