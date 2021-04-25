import { World } from "../mod";

/**
 * Number type alias for Component ticks.
 */
export type ComponentTick = number;

/**
 * Returns true if component was changed for given entity for current tick retrieved
 * from `World.runtime.change_tick`.
 * @param entity
 * @returns
 */
export function is_changed(
  ticks: readonly [added: ComponentTick, changed: ComponentTick],
  last_change_tick: ComponentTick = World.runtime.last_change_tick,
  change_tick: ComponentTick = World.runtime.current_world.change_tick,
) {
  return (
    is_tick_changed(ticks[1], last_change_tick, change_tick) &&
    !is_added(ticks, last_change_tick, change_tick)
  );
}

/**
 * Returns true if component was changed for given entity for current tick retrieved
 * from `World.runtime.change_tick`.
 * @param entity
 * @returns
 */
export function is_added(
  ticks: readonly [added: ComponentTick, changed: ComponentTick],
  last_change_tick: ComponentTick = World.runtime.last_change_tick,
  change_tick: ComponentTick = World.runtime.current_world.change_tick,
) {
  return is_tick_changed(ticks[0], last_change_tick, change_tick);
}

/**
 * Returns true if tick should be checked relative to given `last_change_tick` with current `change_tick`.
 * @param tick
 * @param last_tick
 * @param changed_tick
 * @returns
 */
function is_tick_changed(
  tick: ComponentTick,
  last_change_tick: ComponentTick,
  change_tick: ComponentTick,
) {
  const component_delta = change_tick - tick;
  const last_change_delta = change_tick - last_change_tick;
  return component_delta <= last_change_delta;
}
