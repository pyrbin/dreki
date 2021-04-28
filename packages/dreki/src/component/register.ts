import { ComponentId, ComponentMask, Component, Components, INVALID_COMPONENT_ID } from "./mod";
import { COMPONENT_ID_PROP_KEY } from "../constants";
import { runtime } from "../world/runtime";
import { has_own_property } from "@dreki.land/shared";

/**
 * Component type
 */
export enum ComponentType {
  Tag = "tag",
  Data = "data",
}

/**
 * Component meta info
 */
export type ComponentInfo = {
  id: ComponentId;
  mask: ComponentMask;
  component: Component;
  type: ComponentType;
  super?: Component;
};

/**
 * Get component info. If it hasn't been registered then register it aswell.
 * @param component
 * @returns
 */
export function get_component_info_or_register(component: Component) {
  return runtime.components.get(get_component_id(component)) ?? register(component)[0];
}

/**
 * Get component id, returns undefined if component haven't been registered
 * @param component
 * @returns
 */
export function get_component_id(component: Component): ComponentId {
  return has_own_property(component, COMPONENT_ID_PROP_KEY)
    ? (component[COMPONENT_ID_PROP_KEY] as ComponentId) ?? INVALID_COMPONENT_ID
    : INVALID_COMPONENT_ID;
}

/**
 * Determines if a component is a tag eg. contains no properties.
 * @param component
 * @returns
 */
function is_tag_internal(component: Component) {
  return Object.getOwnPropertyNames(new component()).length === 0;
}

/**
 * Registers components, generates meta info & sets it's ID. The ID is generated from
 * a global integer counter that increases with each component registered.
 * @param components
 * @returns
 */
export function register(...components: Components) {
  const result: ComponentInfo[] = [];

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const id = ++runtime.component_id_counter;
    const info: ComponentInfo = {
      id,
      mask: 1 << id,
      component,
      type: is_tag_internal(component) ? ComponentType.Tag : ComponentType.Data,
      super: undefined,
    };

    Object.defineProperty(component, COMPONENT_ID_PROP_KEY, {
      value: id,
      writable: false,
      configurable: false,
      enumerable: false,
    });

    runtime.components.set(id, info);
    result.push(info);
  }

  const parent_pairs = resolve_closest_parents(Array.from(runtime.components.values()));
  for (const [info, parent] of parent_pairs) {
    runtime.components.get(info.id)!.super = parent;
  }

  return result;
}

/**
 * Resolves the closest ancestor between every given component info.
 * @example
 * ```ts
 * class Point {};
 * class Point2D extends Point {};
 * class Point3d extends Point2D {};
 *
 * // Consider this as given input
 * [Point, Point2D, Point3D]
 *
 * // Will yield
 * [[Point, undefined], [Point2D, Point], [Point3D, Point2D]]
 *
 * ```
 * @param infos
 * @returns
 */
export function resolve_closest_parents(infos: ComponentInfo[]) {
  const result: [info: ComponentInfo, parent: Component | undefined][] = [];
  const mapped_to_types = infos.map((x) => x.component);

  for (const info of infos) {
    const type = info.component;
    const ancestors = mapped_to_types
      .filter((x) => type.prototype instanceof x)
      .map((x) => ({ value: 0, type: x }));

    if (ancestors.length === 0) {
      result.push([info, undefined]);
      continue;
    }

    if (ancestors.length === 1) {
      result.push([info, ancestors[0].type]);
      continue;
    }

    for (let i = 0; i < ancestors.length; i++) {
      const current = ancestors[i];
      for (let j = 0; j < ancestors.length; j++) {
        if (i === j) continue;
        const other = ancestors[j];
        current.value += other.type.prototype instanceof current.type ? 1 : 0;
      }
    }

    ancestors.sort((a, b) => a.value - b.value);
    result.push([info, ancestors[0].type]);
  }
  return result;
}
