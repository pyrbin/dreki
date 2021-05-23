import { Slice } from "@dreki.land/shared";
import { Entity } from "../entity/mod";
import { ComponentInstance, ComponentFlags, ComponentTick } from "../component/mod";
import { ComponentInfo } from "../component/register";
import { PhantomComponentStorage } from "./phantom";

export type EntitySlice = Slice<Entity>;

/**
 * A storage state for a component
 */
export type ComponentState = readonly [
  component: ComponentInstance,
  flags: ComponentFlags,
  addedTick: ComponentTick,
  changedTick: ComponentTick,
];

/**
 * Generic component storage interface type.
 */
export interface ComponentStorage {
  insert(
    entity: Entity,
    value: ComponentInstance,
    flags: ComponentFlags,
    changeTick: number,
  ): ComponentInstance;

  remove(entity: Entity): boolean;
  has(entity: Entity): boolean;
  get(entity: Entity): ComponentInstance;
  getWithState(entity: Entity): ComponentState | undefined;

  setFlag(entity: Entity, fn: (flag: ComponentFlags) => ComponentFlags): void;
  setAddedTick(entity: Entity, changedTick: ComponentTick): void;
  setChangedTick(entity: Entity, changedTick: ComponentTick): void;
  isAdded(entity: Entity): boolean;
  isChanged(entity: Entity): boolean;

  registerPhantom(reference: PhantomComponentStorage): void;

  checkTicks(changeTick: ComponentTick): void;
  getTicks(entity: Entity): readonly [added: ComponentTick, changed: ComponentTick];

  addRemoved(entity: Entity, component: ComponentInstance): void;
  hasRemoved(entity: Entity): boolean;
  getRemoved(entity: Entity): ComponentInstance | undefined;
  clearRemoved(): void;

  realloc?(length: number): void;

  entitySlice(withRemoved?: boolean): EntitySlice;

  empty(): boolean;
  readonly length: number;
  readonly lengthWithRemoved: number;
  readonly capacity: number;
  readonly info: ComponentInfo;
}
