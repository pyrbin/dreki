import { has_own_property, record } from "@dreki.land/shared";
import type { Component } from "../component/mod";
import { SYMBOL_PREFIX } from "../constants";

export const OBSERVE_TYPE_KEY = Symbol(SYMBOL_PREFIX + "observe_selector");

export type Observe<T extends Component = Component> = { include: T; [OBSERVE_TYPE_KEY]: true };

export function observe<T extends Component>(component: T): Observe<T> {
  return { include: component, [OBSERVE_TYPE_KEY]: true } as Observe<T>;
}

export function is_observe<T extends Component>(target: record): target is Observe<T> {
  return has_own_property(target, OBSERVE_TYPE_KEY);
}
