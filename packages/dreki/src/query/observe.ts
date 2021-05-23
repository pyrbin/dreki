import { hasOwnProperty, record } from "@dreki.land/shared";
import type { Component } from "../component/mod";
import { SYMBOL_PREFIX } from "../constants";

export const OBSERVE_TYPE_KEY = Symbol(SYMBOL_PREFIX + "observe_selector");

/**
 * Observe selector type
 */
export type Observe<T extends Component = Component> = { include: T; [OBSERVE_TYPE_KEY]: true };

/**
 * A observe selector. When used in a query the resulting component will be observed &
 * trigger `changed` filters.
 * @param component
 * @returns
 */
export function observe<T extends Component>(component: T): Observe<T> {
  return { include: component, [OBSERVE_TYPE_KEY]: true } as Observe<T>;
}

/**
 * Returns true if target is an observe selector
 * @param target
 * @returns
 */
export function isObserve<T extends Component>(target: unknown): target is Observe<T> {
  return hasOwnProperty(target as record, OBSERVE_TYPE_KEY);
}
