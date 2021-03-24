import { array_of, Tuple, Type } from "@dreki.land/shared";
import { World } from "../mod";
import type { Component, ComponentInstance, IsTag } from "../component/mod";
import {
  ComponentInfo,
  ComponentType,
  get_component_info_or_register,
} from "../component/register";
import { Entity } from "../entity/mod";
import type { EntitySlice } from "../storage/mod";
import type { ComponentSparseSet } from "../storage/components";
import {
  ComponentFilter,
  EntityFilter,
  Filter,
  FilterType,
  is_entity_filter,
  is_filter,
  is_omit_filter,
} from "./filter";
import { is_observe } from "./observe";

/**
 * Create a query of given query parameters.
 * @param params
 * @returns
 */
export function query<T extends QueryParams>(...params: T): Query<T> {
  return new Query<T>(...(params as T)) as Query<T>;
}

/**
 * We omit `predicate` from Filter because else the typing fails for `non-entity` filters
 * when using them as parameters for a query.
 *
 * @todo look in to why & fix it so we don't have to use `Omit`
 */
type QueryParams = readonly (Omit<Filter, "predicate"> | Component)[];

type QueryIter<T extends QueryParams> = Iterable<QueryResult<T>>;

type QueryResult<T extends QueryParams> = Tuple.Flatten<UnwrapQueryParams<T>>;

type UnwrapQueryParams<T extends QueryParams> = Tuple.Flatten<
  {
    [K in keyof T]: T[K] extends Omit<Filter, "predicate">
      ? T[K] extends { [FilterType.Omit]: true }
        ? []
        : UnwrapQueryParams<T[K]["include"]>
      : T[K] extends Type
      ? T[K] extends IsTag<T[K]>
        ? []
        : InstanceType<T[K]>
      : never;
  }
>;

type FetchInfo = {
  info: ComponentInfo | "entity";
  filter?: ComponentFilter | EntityFilter;
  observe?: boolean;
};

class Query<T extends QueryParams> implements QueryIter<T> {
  private read_index = -1;
  private result_index = 0;
  private query_length = 0;

  private entities: EntitySlice | undefined;
  private readonly fetch_info: readonly FetchInfo[];
  private readonly entity_filters: readonly EntityFilter[];
  private readonly component_info: readonly ComponentInfo[];
  private readonly components: (ComponentSparseSet | undefined)[];
  private readonly result_array: ComponentInstance[];
  private world: World | undefined;

  private readonly result: IteratorResult<QueryResult<T>> = ({
    value: (null as unknown) as IteratorResult<QueryResult<T>>,
    done: false,
  } as unknown) as IteratorResult<QueryResult<T>>;

  /**
   * Create a query of given query parameters.
   * @param params
   */
  constructor(...params: T) {
    // parse & flatten params
    this.fetch_info = params.flatMap((x) =>
      is_filter(x)
        ? x.include.map((y) => unpack_fetch_info(y, x))
        : unpack_fetch_info(x as Component),
    );

    // get entity_filters
    this.entity_filters = this.fetch_info
      .filter((x) => is_entity_filter(x.filter))
      .map((x) => x.filter) as EntityFilter[];

    // get fetch info of non-omit fetches
    const non_omit_fetches = this.fetch_info.filter((x) => !is_omit_filter(x.filter));

    // get length of fetches that will put in result array (QueryResult<T>)
    const include_in_result = this.fetch_info.filter(
      (x) =>
        !is_omit_filter(x.filter) && (x.info === "entity" || x.info.type !== ComponentType.Tag),
    ).length;

    this.result_array = array_of(include_in_result);
    this.components = array_of(non_omit_fetches.length);

    // This is only needed for `Storage.shortest_slice_of`
    // Ignore `Entity` references.
    this.component_info = Array.from(
      non_omit_fetches.filter((x) => x.info !== "entity").map((x) => x.info as ComponentInfo),
    );

    // clear iterator-related properties
    this.entities = undefined;
    this.result.value = this.result_array;
    this.read_index = -1;
    this.query_length = 0;

    /**
     * In final fetch_info only includes non-omit fetches
     * and no fetches with per-entity filter.
     */
    this.fetch_info = non_omit_fetches.map((x) => {
      if (x.filter && is_entity_filter(x.filter)) delete x.filter;
      return x;
    });
  }

  /**
   * Retrieves iterator of the query for given world.
   * @param world
   * @returns
   */
  public iter_for(world: World): Iterator<QueryResult<T>> {
    if (world !== undefined && (world !== this.world || this.entities === undefined)) {
      // Only find & cache component sparse sets if world has changed since last iteration
      this.world = world;
      for (let i = 0; i < this.fetch_info.length; i++) {
        const info = this.fetch_info[i].info;
        this.components[i] = info !== "entity" ? this.world?.storage.get(info.id) : undefined;
      }
    }

    this.read_index = -1;
    this.entities = this.world?.storage.shortest_slice_of(...this.component_info);
    this.query_length = this.entities?.length ?? 0;
    this.result.done = false;

    return {
      next: () => this.execute(),
    };
  }

  /**
   * Return true if all saved entity filters passes for entity
   * @param entity
   * @returns
   */
  private check_entity_filter(entity: Entity) {
    for (let i = 0; i < this.entity_filters.length; i++) {
      const filter = this.entity_filters[i];
      for (let j = 0; j < filter.include.length; j++) {
        if (!this.entity_filters[i].predicate(this.world!, entity, filter.include[j])) return false;
      }
    }
    return true;
  }

  /**
   * Executes a single iterator step for the query & returns an iterator result.
   * @returns
   */
  private execute(): IteratorResult<QueryResult<T>> {
    root: while (this.read_index < this.query_length - 1) {
      this.result_index = 0;
      const entity = this.entities!.get(++this.read_index);

      if (!this.check_entity_filter(entity)) continue root;

      for (let i = 0; i < this.fetch_info.length; i++) {
        const fetch = this.fetch_info[i];

        if (fetch.info === "entity") {
          this.result_array[this.result_index++] = entity;
          continue;
        }

        const [component, flags] = this.components[i]!.get_with_flags(entity);

        if (component === undefined) {
          continue root;
        }

        if (
          fetch.filter &&
          !(fetch.filter as ComponentFilter).predicate(this.world!, entity, [component, flags])
        ) {
          continue root;
        }

        if (fetch.info.type === ComponentType.Tag) {
          continue;
        }

        this.result_array[this.result_index++] =
          fetch.observe === true
            ? (this.world?.storage.get_observed(entity, fetch.info) as ComponentInstance)
            : component;
      }

      return this.result;
    }

    this.result.done = true;
    return this.result;
  }

  /**
   * Retrieves iterator of the query for the current world.
   * The current world will be the world that had it's `update` function called most recently.
   * @returns
   */
  [Symbol.iterator](): Iterator<QueryResult<T>> {
    return this.iter_for(World.runtime.current_world);
  }
}

function unpack_fetch_info(
  component: Component,
  filter?: ComponentFilter | EntityFilter,
): FetchInfo {
  const entity = component === Entity;
  return {
    info: entity ? "entity" : get_component_info_or_register(component),
    filter: filter,
    observe: is_observe(component),
  };
}
