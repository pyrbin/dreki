import { sliceOf } from "@dreki.land/shared";
import { ComponentInstance, ComponentFlags, ComponentTick } from "../component/mod";
import { ComponentInfo } from "../component/register";
import { Entity } from "../entity/mod";
import { ComponentStorage } from "./components";

/**
 * Phantom component storage. Phantom storages doesn't store data (other than belonging entities) but
 * rather references another component storage.
 */
export class PhantomComponentStorage implements ComponentStorage {
  readonly info: ComponentInfo;
  readonly entities: Set<Entity>;
  readonly removed: Set<Entity>;

  #parent: ComponentStorage;

  constructor(info: ComponentInfo, storage: ComponentStorage) {
    this.info = info;
    this.#parent = storage;
    this.entities = new Set();
    this.removed = new Set();
    this.setParentStorage(storage);
  }

  setParentStorage(storage: ComponentStorage) {
    storage.registerPhantom(this);
    this.#parent = storage;
  }

  registerPhantom(reference: PhantomComponentStorage) {
    this.#parent.registerPhantom(reference);
  }

  insert(
    entity: Entity,
    value: ComponentInstance,
    flags: ComponentFlags,
    changeTick: ComponentTick,
  ): ComponentInstance {
    this.entities.add(entity);
    return this.#parent.insert(entity, value, flags, changeTick);
  }

  remove(entity: Entity): boolean {
    this.entities.delete(entity);
    this.removed.add(entity);
    return this.#parent.remove(entity);
  }

  get(entity: Entity): ComponentInstance {
    return this.entities.has(entity)
      ? this.#parent.get(entity)
      : (undefined as unknown as ComponentInstance);
  }

  getWithState(entity: Entity) {
    return this.entities.has(entity) ? this.#parent.getWithState(entity) : undefined;
  }

  setFlag(entity: Entity, fn: (flag: ComponentFlags) => ComponentFlags) {
    if (!this.entities.has(entity)) return;
    this.#parent.setFlag(entity, fn);
  }

  setAddedTick(entity: Entity, changedTick: number) {
    this.#parent.setAddedTick(entity, changedTick);
  }

  setChangedTick(entity: Entity, changedTick: number) {
    this.#parent.setChangedTick(entity, changedTick);
  }

  isAdded(entity: Entity) {
    return this.#parent.isAdded(entity);
  }

  isChanged(entity: Entity) {
    return this.#parent.isChanged(entity);
  }

  getTicks(entity: Entity) {
    return this.#parent.getTicks(entity);
  }

  has(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  checkTicks(changeTick: number) {
    this.#parent.checkTicks(changeTick);
  }

  addRemoved(entity: Entity, component: ComponentInfo) {
    this.removed.add(entity);
    this.#parent.addRemoved(entity, component);
  }

  hasRemoved(entity: Entity): boolean {
    return this.removed.has(entity);
  }

  getRemoved(entity: Entity) {
    if (!this.removed.has(entity)) return;
    return this.#parent.getRemoved(entity);
  }

  clearRemoved() {
    for (const entity of this.removed) {
      this.removed.delete(entity);
    }
  }

  empty(): boolean {
    return this.entities.size === 0;
  }

  entitySlice() {
    return sliceOf([...this.entities], 0, this.length);
  }

  entitySliceWithRemoved() {
    return sliceOf([...this.entities, ...this.removed], 0, this.lengthWithRemoved);
  }

  get parent() {
    return this.#parent;
  }

  get lengthWithRemoved() {
    return this.length + this.removed.size;
  }

  get length() {
    return this.entities.size;
  }

  get capacity() {
    return this.#parent.capacity;
  }
}
