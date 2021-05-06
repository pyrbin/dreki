import { has_own_property, record } from "@dreki.land/shared";
import type { Entity } from "../entity/mod";
import type { World } from "../mod";
import type { Component, Components } from "../component/mod";
import type { ComponentState } from "../storage/components";

export enum FilterType {
  /**
   * Omit type filters will omit their included
   * components in the query result
   */
  Omit = "$$__dreki__filter_omit",
  /**
   * Entity type filters will be execute per-entity basis
   * rather than per-component.
   */
  Entity = "$$__dreki__filter_entity",
}

/**
 * Filter defining prop key
 */
export const FILTER_TYPE_KEY = "$$__dreki__filter";

/**
 * Implement a filter with given `FilterTypes`. The result of `predicate` determines
 * if the filter should pass or not.
 * @param types
 * @param predicate
 * @returns
 */
export function impl_filter<T extends readonly FilterType[]>(
  identifier: string,
  predicate: Predicate<T>,
  ...types: T
) {
  const filterTypes = types?.reduce(
    (map, type) => ({
      ...map,
      [type]: true,
    }),
    {},
  );

  const filter = <U extends Components>(...include: U): Filter<T, U> => {
    return {
      include,
      identifier,
      predicate,
      [FILTER_TYPE_KEY]: true,
      ...filterTypes,
    } as Filter<T, U>;
  };

  filter.identifier = identifier;

  return filter;
}

export type ComponentFilter = Filter<[]>;

export type EntityFilter = Filter<[FilterType.Entity]>;

export function is_filter(target: record | undefined): target is Filter {
  if (target === undefined) return false;
  return has_own_property(target, FILTER_TYPE_KEY);
}

export function is_omit_filter(
  target: record | undefined,
): target is Filter & { [FilterType.Omit]: true } {
  if (target === undefined) return false;
  return Boolean(target[FilterType.Omit]);
}

export function is_entity_filter(target: record | undefined): target is EntityFilter {
  if (target === undefined) return false;
  return Boolean(target[FilterType.Entity]);
}

export type Filter<
  T extends readonly FilterType[] = [],
  U extends readonly Component[] = readonly Component[]
> = {
  include: U;
  identifier: string;
  predicate: Predicate<T>;
  [FILTER_TYPE_KEY]: true;
} & {
  [K in T[number]]: true;
};

type Predicate<T extends readonly FilterType[] = []> = (...params: FilterParams<T>) => boolean;

type FilterParams<T extends readonly FilterType[] = []> = {
  [K in T[number]]: true;
} extends { [FilterType.Entity]: true }
  ? [world: World, entity: Entity, type: Component]
  : [world: World, entity: Entity, comp_with_state: ComponentState];
