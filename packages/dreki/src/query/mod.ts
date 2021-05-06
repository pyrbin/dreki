import { array_of, Tuple, Type } from "@dreki.land/shared";
import { World } from "../world/mod";
import { runtime } from "../world/runtime";
import type { Component, ComponentInstance, IsTag } from "../component/mod";
import {
  ComponentInfo,
  ComponentType,
  get_component_info_or_register,
} from "../component/register";
import { Entity } from "../entity/mod";
import type { EntitySlice, ComponentStorage } from "../storage/components";
import {
  ComponentFilter,
  EntityFilter,
  Filter,
  FilterType,
  is_entity_filter,
  is_filter,
  is_omit_filter,
} from "./filter";
import { is_observe, Observe } from "./observe";
import { removed } from "./filters/removed";

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
 * todo: look in to why & fix it so we don't have to use `Omit`
 */
type QueryParams = readonly (Omit<Filter, "predicate"> | Component | Observe | typeof Entity)[];

type QueryIter<T extends QueryParams> = Iterable<QueryResult<T>>;

type QueryResult<T extends QueryParams> = Tuple.Flatten<UnwrapQueryParams<T>>;
type UnwrapQueryParams<T extends QueryParams> = Tuple.Flatten<
  {
    [K in keyof T]: T[K] extends Omit<Filter, "predicate">
      ? T[K] extends { [FilterType.Omit]: true }
        ? []
        : UnwrapQueryParams<T[K]["include"]>
      : T[K] extends Observe
      ? UnwrapQueryParamInstance<T[K]["include"]>
      : T[K] extends Type
      ? UnwrapQueryParamInstance<T[K]>
      : T[K] extends typeof Entity
      ? Entity
      : never;
  }
>;
type UnwrapQueryParamInstance<T extends Type> = T extends typeof Entity
  ? Entity
  : T extends IsTag<T>
  ? []
  : InstanceType<T>;

type FetchInfo = {
  info: ComponentInfo | undefined;
  fetch_entity: boolean;
  ignore_has_check: boolean;
  filter?: ComponentFilter | EntityFilter;
  observe?: boolean;
  fetcher_fn?: (world: World, entity: Entity) => ComponentInstance;
};

class Query<T extends QueryParams> implements QueryIter<T> {
  private read_index = -1;
  private result_index = 0;
  private query_length = 0;

  private entities: EntitySlice | undefined;
  private readonly fetch_info: readonly FetchInfo[];
  private readonly entity_filters: readonly EntityFilter[];
  private readonly component_info: readonly ComponentInfo[];
  private readonly components: (ComponentStorage | undefined)[];
  private readonly result_array: (ComponentInstance | Entity)[];
  private world: World | undefined;

  private has_removed_filter: boolean = false;
  private has_non_entity_filters: boolean = false;
  private current_entity_removed = false;

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
        : unpack_fetch_info(x as Component | Observe),
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
        !is_omit_filter(x.filter) &&
        (x.fetch_entity || (x.info as ComponentInfo).type !== ComponentType.Tag),
    ).length;

    this.result_array = array_of(include_in_result);
    this.components = array_of(non_omit_fetches.length);

    // This is only needed for `Storage.shortest_slice_of`
    // Ignore `Entity` references.
    this.component_info = Array.from(
      non_omit_fetches.filter((x) => !x.fetch_entity).map((x) => x.info as ComponentInfo),
    );

    // clear iterator-related properties
    this.entities = undefined;
    this.result.value = this.result_array;
    this.read_index = -1;
    this.query_length = 0;

    // Calculate if this query contains any remove filters
    this.has_removed_filter =
      this.entity_filters.filter((x) => x.identifier === removed.identifier).length > 0;

    // Calculate if this query contains any non-entity filters
    this.has_non_entity_filters =
      this.fetch_info.filter((x) => x.filter && !is_entity_filter(x.filter)).length > 0;

    /**
     * In final fetch_info only includes non-omit fetches
     * and remove filters from per-entity fetches.
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
        this.components[i] = !this.fetch_info[i].fetch_entity
          ? this.world?.storage.get(info!.id)
          : undefined;
      }
    }

    this.read_index = -1;

    this.entities = this.has_removed_filter
      ? this.world?.storage.shortest_slice_of_with_removed(...this.component_info)
      : this.world?.storage.shortest_slice_of(...this.component_info);

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
        if (!filter.predicate(this.world!, entity, filter.include[j])) return false;
      }
      // If this filter is an removed filter, check if entity exists & update current_entity_removed
      if (filter.identifier === removed.identifier) {
        this.current_entity_removed = !this.world!.exists(entity);
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
      this.current_entity_removed = false;

      const entity = this.entities!.get(++this.read_index);

      if (!this.check_entity_filter(entity)) continue root;

      // if entity was removed & has other filters, we can be sure this entity won't pass
      if (this.current_entity_removed && this.has_non_entity_filters) continue root;

      for (let i = 0; i < this.fetch_info.length; i++) {
        const fetch = this.fetch_info[i];

        if (fetch.fetch_entity) {
          this.result_array[this.result_index++] = entity;
          continue;
        }

        const is_tag = fetch.info!.type === ComponentType.Tag;
        const storage = this.components[i]!;

        if (this.current_entity_removed) {
          // todo: move this logic to seperate Query iterator for `removed` queries
          const component = storage.get_removed(entity);
          if (component == undefined) continue root;
          if (!is_tag) this.result_array[this.result_index++] = component;
          continue;
        }

        const state = storage.get_with_state(entity);

        if (!state) {
          if (fetch.ignore_has_check && fetch.fetcher_fn) {
            const component = fetch.fetcher_fn(this.world!, entity);
            if (component == undefined) continue root;
            if (!is_tag) this.result_array[this.result_index++] = component;
            continue;
          }
          continue root;
        }

        if (
          fetch.filter &&
          !(fetch.filter as ComponentFilter).predicate(this.world!, entity, state)
        ) {
          continue root;
        }

        if (is_tag) continue;

        this.result_array[this.result_index++] = fetch.fetcher_fn
          ? fetch.fetcher_fn(this.world!, entity)
          : state[0];
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
    return this.iter_for(runtime.current_world);
  }
}

function unpack_fetch_info(
  fetch: Component | Observe | typeof Entity,
  filter?: ComponentFilter | EntityFilter,
): FetchInfo {
  const observe = is_observe(fetch);
  const component = is_observe(fetch) ? fetch.include : fetch;
  const is_entity = component === Entity;
  const info = !is_entity ? get_component_info_or_register(component as Component) : undefined;

  let ignore_has_check = false;
  let fetcher_fn: FetchInfo["fetcher_fn"] = undefined;

  if (!is_entity && info && observe) {
    fetcher_fn = (world: World, entity: Entity) =>
      world.storage.get_observed(entity, info) as ComponentInstance;
  }

  if (!is_entity && info && filter && filter.identifier === removed.identifier) {
    ignore_has_check = true;
    fetcher_fn = (world: World, entity: Entity) =>
      world.storage.get(info.id).get_removed(entity) as ComponentInstance;
  }

  return {
    info: !is_entity ? get_component_info_or_register(component as Component) : undefined,
    fetch_entity: is_entity,
    filter,
    observe,
    fetcher_fn,
    ignore_has_check,
  };
}
