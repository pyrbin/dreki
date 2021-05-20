import { arrayOf, Tuple, Type } from "@dreki.land/shared";
import { World } from "../world/mod";
import { Runtime } from "../world/runtime";
import type { Component, ComponentInstance, IsTag } from "../component/mod";
import { ComponentInfo, ComponentType, getComponentInfoOrRegister } from "../component/register";
import { Entity } from "../entity/mod";
import type { EntitySlice, ComponentStorage } from "../storage/components";
import {
  ComponentFilter,
  EntityFilter,
  Filter,
  FilterType,
  isEntityFilter,
  isFilter,
  isOmitFilter,
} from "./filter";
import { isObserve, Observe } from "./observe";
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

/**
 * Maps QueryParams to correct result types.
 */
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

type QueryParamFetchInfo = {
  info: ComponentInfo | undefined;
  fetchEntity: boolean;
  ignoreHasCheck: boolean;
  filter?: ComponentFilter | EntityFilter;
  observe?: boolean;
  fetchFn?: (world: World, entity: Entity) => ComponentInstance;
};

class Query<T extends QueryParams> implements QueryIter<T> {
  #readIndex = -1;
  #resultIndex = 0;
  #queryLength = 0;

  #entities: EntitySlice | undefined;
  #world: World | undefined;

  #hasRemovedFilter = false;
  #hasNonEntityFilters = false;
  #currentEntityRemoved = false;

  readonly #fetchInfo: readonly QueryParamFetchInfo[];
  readonly #entityFilters: readonly EntityFilter[];
  readonly #componentInfo: readonly ComponentInfo[];
  readonly #components: (ComponentStorage | undefined)[];
  readonly #resultArray: (ComponentInstance | Entity)[];

  readonly #result: IteratorResult<QueryResult<T>> = ({
    value: (null as unknown) as IteratorResult<QueryResult<T>>,
    done: false,
  } as unknown) as IteratorResult<QueryResult<T>>;

  /**
   * Create a query of given query parameters.
   * @param params
   */
  constructor(...params: T) {
    // parse & flatten params
    this.#fetchInfo = params.flatMap((x) =>
      isFilter(x)
        ? x.include.map((y) => unpackQueryParamFetchInfo(y, x))
        : unpackQueryParamFetchInfo(x as Component | Observe),
    );

    // get entityFilters
    this.#entityFilters = this.#fetchInfo
      .filter((x) => isEntityFilter(x.filter))
      .map((x) => x.filter) as EntityFilter[];

    // get fetch info of non-omit fetches
    const nonOmitFetches = this.#fetchInfo.filter((x) => !isOmitFilter(x.filter));

    // get length of fetches that will put in result array (QueryResult<T>)
    const includeInResult = this.#fetchInfo.filter(
      (x) =>
        !isOmitFilter(x.filter) &&
        (x.fetchEntity || (x.info as ComponentInfo).type !== ComponentType.Tag),
    ).length;

    this.#resultArray = arrayOf(includeInResult);
    this.#components = arrayOf(nonOmitFetches.length);

    // This is only needed for `Storage.shortestSliceOf`
    // Ignore `Entity` references.
    this.#componentInfo = Array.from(
      nonOmitFetches.filter((x) => !x.fetchEntity).map((x) => x.info as ComponentInfo),
    );

    // clear iterator-related properties
    this.#entities = undefined;
    this.#result.value = this.#resultArray;
    this.#readIndex = -1;
    this.#queryLength = 0;

    // Calculate if this query contains any remove filters
    this.#hasRemovedFilter =
      this.#entityFilters.filter((x) => x.identifier === removed.identifier).length > 0;

    // Calculate if this query contains any non-entity filters
    this.#hasNonEntityFilters =
      this.#fetchInfo.filter((x) => x.filter && !isEntityFilter(x.filter)).length > 0;

    /**
     * In final fetchInfo only includes non-omit fetches
     * and remove filters from per-entity fetches.
     */
    this.#fetchInfo = nonOmitFetches.map((x) => {
      if (x.filter && isEntityFilter(x.filter)) delete x.filter;
      return x;
    });
  }

  /**
   * Retrieves iterator of the query for given world.
   * @param world
   * @returns
   */
  public iterFor(world: World): Iterator<QueryResult<T>> {
    if (world !== undefined && (world !== this.#world || this.#entities === undefined)) {
      // Only find & cache component sparse sets if world has changed since last iteration
      this.#world = world;
      for (let i = 0; i < this.#fetchInfo.length; i++) {
        const info = this.#fetchInfo[i].info;
        this.#components[i] = !this.#fetchInfo[i].fetchEntity
          ? this.#world?.storage.get(info!.id)
          : undefined;
      }
    }

    this.#readIndex = -1;

    // get entites from component storage with lowest count of entities.
    // if this entity has a `removed` filter, also include removed entities
    this.#entities = this.#hasRemovedFilter
      ? this.#world?.storage.shortestSliceOfWithRemoved(...this.#componentInfo)
      : this.#world?.storage.shortestSliceOf(...this.#componentInfo);

    this.#queryLength = this.#entities?.length ?? 0;
    this.#result.done = false;

    return {
      next: () => this.execute(),
    };
  }

  /**
   * Return true if all saved entity filters passes for entity
   * @param entity
   * @returns
   */
  private checkEntityFilter(entity: Entity) {
    for (let i = 0; i < this.#entityFilters.length; i++) {
      const filter = this.#entityFilters[i];
      for (let j = 0; j < filter.include.length; j++) {
        if (!filter.predicate(this.#world!, entity, filter.include[j])) return false;
      }
      // If this filter is an removed filter, check if entity exists & update currentEntityRemoved
      if (filter.identifier === removed.identifier) {
        this.#currentEntityRemoved = !this.#world!.exists(entity);
      }
    }
    return true;
  }

  /**
   * Executes a single iterator step for the query & returns an iterator result.
   * @returns
   */
  private execute(): IteratorResult<QueryResult<T>> {
    // main iteration loop
    root: while (this.#readIndex < this.#queryLength - 1) {
      this.#resultIndex = 0;
      this.#currentEntityRemoved = false;

      // get current entity.
      const entity = this.#entities!.get(++this.#readIndex);

      // if entity filters doesn't pass, goto next.
      if (!this.checkEntityFilter(entity)) continue root;

      // if entity was removed & has other filters, we can be sure this entity won't pass.
      if (this.#currentEntityRemoved && this.#hasNonEntityFilters) continue root;

      // iterate each fetch info
      for (let i = 0; i < this.#fetchInfo.length; i++) {
        const fetch = this.#fetchInfo[i];

        if (fetch.fetchEntity) {
          // if this fetch should fetch the entity, just add the entity & continue.
          this.#resultArray[this.#resultIndex++] = entity;
          continue;
        }

        const isTag = fetch.info!.type === ComponentType.Tag;
        const storage = this.#components[i]!;

        if (this.#currentEntityRemoved) {
          // if current entity is removed, look for component in the removed cache/storage.
          // todo: move this logic to seperate Query iterator for `removed` queries
          const component = storage.getRemoved(entity);
          if (component == undefined) continue root;
          if (!isTag) this.#resultArray[this.#resultIndex++] = component;
          continue;
        }

        const state = storage.getWithState(entity);

        if (!state) {
          // if fetch has ignoreHasCheck & a custom fetch function then the entity
          // could still be valid for the query even if is doesn't have the component.
          if (fetch.ignoreHasCheck && fetch.fetchFn) {
            const component = fetch.fetchFn(this.#world!, entity);
            if (component == undefined) continue root;
            if (!isTag) this.#resultArray[this.#resultIndex++] = component;
            continue;
          }
          continue root;
        }

        // Check component filter predicate if a filter exists.
        if (
          fetch.filter &&
          !(fetch.filter as ComponentFilter).predicate(this.#world!, entity, state)
        ) {
          continue root;
        }

        // Don't add tag component to result array.
        if (isTag) continue;

        // Add component or instance or result from custom fetch- function if it exists.
        this.#resultArray[this.#resultIndex++] = fetch.fetchFn
          ? fetch.fetchFn(this.#world!, entity)
          : state[0];
      }

      return this.#result;
    }

    this.#result.done = true;
    return this.#result;
  }

  /**
   * Retrieves iterator of the query for the current world.
   * The current world will be the world that had it's `update` function called most recently.
   * @returns
   */
  [Symbol.iterator](): Iterator<QueryResult<T>> {
    return this.iterFor(Runtime.currentWorld);
  }
}

/**
 * Unpack a [QueryParamFetchInfo] from a query param.
 * @param param
 * @param filter
 * @returns
 */
function unpackQueryParamFetchInfo(
  param: Component | Observe | typeof Entity,
  filter?: ComponentFilter | EntityFilter,
): QueryParamFetchInfo {
  const observe = isObserve(param);
  const component = isObserve(param) ? param.include : param;
  const isEntity = component === Entity;
  const info = !isEntity ? getComponentInfoOrRegister(component as Component) : undefined;

  let ignoreHasCheck = false;
  let fetchFn: QueryParamFetchInfo["fetchFn"] = undefined;

  if (!isEntity && info && observe) {
    fetchFn = (world: World, entity: Entity) =>
      world.storage.getObserved(entity, info) as ComponentInstance;
  }

  if (!isEntity && info && filter && filter.identifier === removed.identifier) {
    ignoreHasCheck = true;
    fetchFn = (world: World, entity: Entity) =>
      world.storage.get(info.id).getRemoved(entity) as ComponentInstance;
  }

  return {
    info: !isEntity ? getComponentInfoOrRegister(component as Component) : undefined,
    fetchEntity: isEntity,
    filter,
    observe,
    fetchFn,
    ignoreHasCheck,
  };
}
