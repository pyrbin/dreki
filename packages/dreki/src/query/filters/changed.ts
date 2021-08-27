import { isChanged } from "../../component/mod";
import { createFilter } from "../filter";

/**
 * Filter that retrieves the given components if they have been changed
 * since the start of the frame. To trigger a change you have to use the selector
 * `observe` in a query or get an observed component with `World.getObserved`.
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
 *   print(`Position changed!`);
 * }
 * ```
 */
export const changed = createFilter((world, entity, [, , ...ticks]) => isChanged(ticks));
