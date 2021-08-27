import { bitflags } from "@dreki.land/shared";
import { ComponentFlags } from "../../component/mod";
import { createFilter } from "../filter";

/**
 * Filter that retrieves the given components if they are disabled.
 * @see World.disable
 */
export const disabled = createFilter((world, entity, [, flag]) => {
  return bitflags.contains(flag, ComponentFlags.Disabled);
});
