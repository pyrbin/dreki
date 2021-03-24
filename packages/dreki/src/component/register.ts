import type { ComponentId, ComponentMask, Component, Components } from "./mod";
import { COMPONENT_ID_PROP_KEY } from "../constants";
import { runtime } from "../world/runtime";

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
};

/**
 * Get component info. If it hasn't been registered then register it aswell.
 * @param component
 * @returns
 */
export function get_component_info_or_register(component: Component) {
  return runtime().components.get(get_component_id(component)) ?? register(component)[0];
}

type WithId<T> = T & { [COMPONENT_ID_PROP_KEY]: ComponentId };

/**
 * Get component id, returns undefined if component haven't been registered
 * @param component
 * @returns
 */
export function get_component_id(component: Component) {
  return (component as WithId<Component>)[COMPONENT_ID_PROP_KEY];
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
    const id = ++runtime().component_counter;

    const info: ComponentInfo = {
      id,
      mask: 1 << id,
      component,
      type: is_tag_internal(component) ? ComponentType.Tag : ComponentType.Data,
    };

    (component as WithId<Component>)[COMPONENT_ID_PROP_KEY] = id;
    runtime().components.set(id, info);
    result.push(info);
  }
  return result;
}
