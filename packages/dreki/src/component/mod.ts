import type { Type, record, ExcludeMethods } from "@dreki.land/shared";
import { Entity } from "../entity/mod";
import { World } from "../mod";

export const INVALID_COMPONENT_ID = -1;

export type ComponentId = number;
export type ComponentMask = number;

export * from "./flags";
export * from "./ticks";

/**
 * Type-guard if component type is a tag.
 */
export type IsTag<T extends Component> = {} extends ExcludeMethods<InstanceType<T>>
  ? InstanceType<T>
  : never;

/**
 * A component type
 */
export type Component<T extends record = record> = T extends Entity ? never : Type<T>;
export type Components = Component[];
export type ReadonlyComponents = readonly Component[];

/**
 * An instance of a component
 */
export type ComponentInstance<T extends Component = Component> = InstanceType<T>;

export type ComponentInstances = ComponentInstance[];
export type ReadonlyComponentInstances = readonly ComponentInstance[];

/**
 * Tuple of component types &/or instances
 */
export type ComponentBundle = readonly (Component | ComponentInstance)[];
