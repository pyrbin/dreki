import { FilterType, createFilter } from "../filter";

/**
 * Filter that only includes `entities` where given components have been removed
 * since the start of the frame.
 */
export const removed = createFilter((world, entity, component) => {
  return world.wasRemoved(entity, component);
}, FilterType.Entity);
