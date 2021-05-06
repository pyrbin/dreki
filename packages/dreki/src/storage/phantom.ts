import { slice_of } from "@dreki.land/collections";
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
  readonly reference: ComponentStorage;

  readonly entities: Set<Entity>;
  readonly removed: Set<Entity>;

  constructor(info: ComponentInfo, storage: ComponentStorage) {
    this.info = info;
    this.reference = storage;
    this.entities = new Set();
    this.removed = new Set();
    this.set_reference(storage);
  }

  set_reference(storage: ComponentStorage) {
    storage.register_phantom(this);
    //@ts-ignore
    this.reference = storage;
  }

  register_phantom(reference: PhantomComponentStorage) {
    this.reference.register_phantom(reference);
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
    this.removed.add(entity);
    return this.reference.remove(entity);
  }

  get(entity: Entity): ComponentInstance {
    return this.entities.has(entity)
      ? this.reference.get(entity)
      : ((undefined as unknown) as ComponentInstance);
  }

  get_with_state(entity: Entity) {
    return this.entities.has(entity) ? this.reference.get_with_state(entity) : undefined;
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

  add_removed(entity: Entity, component: ComponentInfo) {
    this.removed.add(entity);
    this.reference.add_removed(entity, component);
  }

  has_removed(entity: Entity): boolean {
    return this.removed.has(entity);
  }

  get_removed(entity: Entity) {
    if (!this.removed.has(entity)) return;
    return this.reference.get_removed(entity);
  }

  clear_removed() {
    for (const entity of this.removed) {
      this.removed.delete(entity);
    }
  }

  empty(): boolean {
    return this.entities.size === 0;
  }

  entity_slice(with_removed: boolean = false) {
    return with_removed
      ? slice_of([...this.entities, ...this.removed], 0, this.length_with_removed)
      : slice_of([...this.entities], 0, this.length);
  }

  get length_with_removed() {
    return this.length + this.removed.size;
  }

  get length() {
    return this.entities.size;
  }

  get capacity() {
    return this.reference.capacity;
  }
}
