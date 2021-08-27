import { hasOwnProperty, record } from "@dreki.land/shared";
import type { Entity } from "../entity/mod";
import type { World } from "../mod";
import type { Component, Components } from "../component/mod";
import type { ComponentState } from "../storage/components";
import { FILTER_ID_PROP_KEY } from "../constants";
import { Runtime } from "../world/runtime";

/**
 * A filter id
 */
export type FilterId = number;

/**
 * Filer types
 */
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
export function createFilter<T extends readonly FilterType[]>(
  predicate: Predicate<T>,
  ...types: T
) {
  // set filter types
  const filterTypes = types?.reduce(
    (map, type) => ({
      ...map,
      [type]: true,
    }),
    {},
  );

  const id = Runtime.filterIdCounter++;

  const filter = <U extends Components>(...include: U): Filter<T, U> => {
    return {
      include,
      predicate,
      [FILTER_ID_PROP_KEY]: id,
      [FILTER_TYPE_KEY]: true,
      ...filterTypes,
    } as Filter<T, U>;
  };

  // set identifier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (filter as any)[FILTER_ID_PROP_KEY] = id;

  return filter;
}

/**
 * A component filter
 */
export type ComponentFilter = Filter<[]>;

/**
 * An entity filter
 */
export type EntityFilter = Filter<[FilterType.Entity]>;

/**
 * Returns true if target is a filter
 * @param target
 * @returns
 */
export function isFilter(target: unknown | undefined): target is Filter {
  if (target === undefined) return false;
  return hasOwnProperty(target as record, FILTER_TYPE_KEY);
}

/**
 * Returns true if target is an omit filter
 * @param target
 * @returns
 */
export function isOmitFilter(
  target: record | undefined,
): target is Filter & { [FilterType.Omit]: true } {
  if (target === undefined) return false;
  return Boolean(target[FilterType.Omit]);
}

/**
 * Returns true if target is an entity filter
 * @param target
 * @returns
 */
export function isEntityFilter(target: record | undefined): target is EntityFilter {
  if (target === undefined) return false;
  return Boolean(target[FilterType.Entity]);
}

/**
 * A filter type
 */
export type Filter<
  T extends readonly FilterType[] = [],
  U extends readonly Component[] = readonly Component[],
> = {
  include: U;
  predicate: Predicate<T>;
  [FILTER_ID_PROP_KEY]: number;
  [FILTER_TYPE_KEY]: true;
} & {
  [K in T[number]]: true;
};

type Predicate<T extends readonly FilterType[] = []> = (...params: FilterParams<T>) => boolean;

type FilterParams<T extends readonly FilterType[] = []> = {
  [K in T[number]]: true;
} extends { [FilterType.Entity]: true }
  ? [world: World, entity: Entity, type: Component]
  : [world: World, entity: Entity, compWithState: ComponentState];
