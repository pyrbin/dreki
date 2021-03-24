import { bitflags } from "@dreki.land/shared";
import { ComponentFlags } from "../../component/mod";
import { impl_filter } from "../filter";

/**
 * Filter that retrieves components if they have been added
 * since the start of the frame
 */
export const added = impl_filter((world, entity, [, flag]) => {
  return bitflags.contains(flag, ComponentFlags.Added);
});
