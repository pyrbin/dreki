import { isAdded } from "../../component/ticks";
import { createFilter } from "../filter";

/**
 * Filter that retrieves components if they have been added
 * since the start of the frame
 */
export const added = createFilter("added", (world, entity, [, , ...ticks]) => isAdded(ticks));
