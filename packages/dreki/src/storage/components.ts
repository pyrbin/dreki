import { Slice } from "@dreki.land/collections";
import { Entity } from "../entity/mod";
import {
  ComponentInstance,
  ComponentFlags,
  ComponentTick,
  ComponentInstances,
} from "../component/mod";
import { ComponentInfo } from "../component/register";
import { PhantomComponentStorage } from "./phantom";

export type EntitySlice = Slice<Entity>;

export type ComponentState = readonly [
  component: ComponentInstance,
  flags: ComponentFlags,
  added_tick: ComponentTick,
  changed_tick: ComponentTick,
];

/**
 * Generic component storage interface type.
 */
export type ComponentStorage = {
  insert(
    entity: Entity,
    value: ComponentInstance,
    flags: ComponentFlags,
    change_tick: number,
  ): ComponentInstance;
  remove(entity: Entity): boolean;
  has(entity: Entity): boolean;
  get(entity: Entity): ComponentInstance;
  get_with_state(entity: Entity): ComponentState;

  set_flag(entity: Entity, fn: (flag: ComponentFlags) => ComponentFlags): void;
  set_added_tick(entity: Entity, changed_tick: ComponentTick): void;
  set_changed_tick(entity: Entity, changed_tick: ComponentTick): void;
  is_added(entity: Entity): boolean;
  is_changed(entity: Entity): boolean;

  register_phantom(reference: PhantomComponentStorage): void;

  check_ticks(change_tick: ComponentTick): void;
  get_ticks(entity: Entity): readonly [added: ComponentTick, changed: ComponentTick];

  add_removed(entity: Entity, component: ComponentInstance): void;
  has_removed(entity: Entity): boolean;
  get_removed(entity: Entity): ComponentInstance | undefined;
  clear_removed(): void;

  realloc?(length: number): void;

  entity_slice(with_removed?: boolean): EntitySlice;

  empty(): boolean;
  readonly length: number;
  readonly length_with_removed: number;
  readonly capacity: number;
  readonly info: ComponentInfo;
};
