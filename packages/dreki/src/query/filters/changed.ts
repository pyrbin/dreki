import { bitflags } from "@dreki.land/shared";
import { ComponentFlags } from "../../component/mod";
import { impl_filter } from "../filter";

/**
 * Filter that retrieves the given components if they have been changed
 * since the start of the frame. To trigger a change you have to use the selector
 * `observe` in a query or get an observed component with `World.get_observed`.
 *
 * @example
 * ```ts
 * const observed = query(observe(Position));
 * const changed = query(changed(Position));
 *
 * for (const [pos] of observed) {
 *   pos.y -= GRAVITY;
 * }
 * // This query will only trigger because `observe` was used before
 * for (const [pos] of changed) {
 *   console.log(`Position changed!`);
 * }
 * ```
 */
export const changed = impl_filter((world, entity, [, flag]) => {
  return bitflags.contains(flag, ComponentFlags.Changed);
});
