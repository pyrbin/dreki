import { FilterType, impl_filter } from "../filter";

/**
 * Filter that only includes `entities` where given components have been removed
 * since the start of the frame.
 */
export const removed = impl_filter(
  "removed",
  (world, entity, component) => {
    return world.was_removed(entity, component);
  },
  FilterType.Entity,
);
