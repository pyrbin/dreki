import type { Type, record, ExcludeMethods } from "@dreki.land/shared";
import { Entity } from "../entity/mod";

export type ComponentId = number;
export type ComponentMask = number;

/**
 * ComponentFlags
 */
export enum ComponentFlags {
  Empty = 0,
  Added = 1 << 1,
  Changed = 1 << 2,
  Disabled = 1 << 3,
}

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
