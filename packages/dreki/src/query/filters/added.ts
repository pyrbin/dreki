import { is_added } from "../../component/ticks";
import { impl_filter } from "../filter";

/**
 * Filter that retrieves components if they have been added
 * since the start of the frame
 */
export const added = impl_filter("added", (world, entity, [, , ...ticks]) => is_added(ticks));
