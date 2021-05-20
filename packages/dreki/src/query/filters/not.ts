import { FilterType, createFilter } from "../filter";

/**
 * Filter that only includes `entities` that DOESN'T have the given components.
 *
 * **note:** This doesn't include disabled components, use the filter `disabled` for that.
 *
 * @example
 * ```ts
 * // This query retrieves every entity that has `Position`
 * // but doesn't have `Flying`.
 * const grounded = query(Position, not(Flying))
 * ```
 */
export const not = createFilter(
  "not",
  (world, entity, component) => {
    return !world.has(entity, component);
  },
  FilterType.Entity,
  FilterType.Omit,
);
