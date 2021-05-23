import { Runtime } from "../world/runtime";

/**
 * Number type alias for Component ticks.
 */
export type ComponentTick = number;

/**
 * Returns true if component was changed for given entity for current tick retrieved
 * from `Runtime.changeTick`.
 * @param entity
 * @returns
 */
export function isChanged(
  ticks: readonly [added: ComponentTick, changed: ComponentTick],
  lastChangeTick: ComponentTick = Runtime.lastChangeTick,
  changeTick: ComponentTick = Runtime.currentWorld.changeTick,
) {
  return (
    isTickChanged(ticks[1], lastChangeTick, changeTick) &&
    !isAdded(ticks, lastChangeTick, changeTick)
  );
}

/**
 * Returns true if component was changed for given entity for current tick retrieved
 * from `Runtime.changeTick`.
 * @param entity
 * @returns
 */
export function isAdded(
  ticks: readonly [added: ComponentTick, changed: ComponentTick],
  lastChangeTick: ComponentTick = Runtime.lastChangeTick,
  changeTick: ComponentTick = Runtime.currentWorld.changeTick,
) {
  return isTickChanged(ticks[0], lastChangeTick, changeTick);
}

/**
 * Returns true if tick should be checked relative to given `lastChangeTick` with current `changeTick`.
 * @param tick
 * @param lastChangeTick
 * @param changedTick
 * @returns
 */
function isTickChanged(
  tick: ComponentTick,
  lastChangeTick: ComponentTick,
  changeTick: ComponentTick,
) {
  const componentDelta = changeTick - tick;
  const lastChangeDelta = changeTick - lastChangeTick;
  return componentDelta <= lastChangeDelta;
}
