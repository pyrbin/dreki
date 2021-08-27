import { arrayOf, record, Tuple, Type } from "@dreki.land/shared";
import { Component, ComponentInstance, IsTag } from "../component/mod";
import { ComponentInfo, ComponentType, getComponentInfoOrRegister } from "../component/register";
import { MAX_ENTITY_CAPACITY } from "../constants";
import { Entity, World } from "../mod";
import { ComponentStorage, EntitySlice } from "../storage/components";
import { Runtime } from "../world/runtime";
import { ComponentFilter, EntityFilter, Filter, FilterType, isFilter } from "./filter";
import { isObserve, Observe } from "./observe";

/**
 * We omit `predicate` from Filter because else the typing fails for `non-entity` filters
 * when using them as parameters for a query.
 *
 * todo: look in to why & fix it so we don't have to use `Omit`
 */
type QueryParams = readonly (Omit<Filter, "predicate"> | Component | Observe | typeof Entity)[];

type QueryId = string;
type QueryResult<T extends QueryParams> = Tuple.Flatten<UnwrapQueryParams<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queryCache: record<QueryId, Query<any>> = {};

export function query<T extends QueryParams>(...params: T): Query<T> {
  const id = uniqueQueryIdentifier(...params);
  return queryCache[id] ?? (queryCache[id] = new Query<T>(...params));
}

type QueryState = {
  fetches: ComponentFetch[];
  infos: ComponentInfo[];
};

type ComponentFetch = {
  info?: ComponentInfo;
};

class Query<T extends QueryParams> {
  readonly id: QueryId;

  readonly #state: QueryState;
  readonly #result: IteratorResult<QueryResult<T>>;

  #read = 0;
  #resultIndex = 0;

  #storages?: ComponentStorage[];
  #entities?: EntitySlice;
  #world?: World;

  #records: { [key: number]: ComponentStorage[] } = [];

  constructor(...params: T) {
    this.id = uniqueQueryIdentifier(...params);
    this.#state = createQueryState(...params);
    this.#read = 0;
    this.#resultIndex = 0;
    this.#result = {
      value: arrayOf(this.#state.fetches.filter((x) => x.info!.type !== ComponentType.Tag).length),
      done: false,
    } as IteratorResult<QueryResult<T>>;
  }

  #registerWorld(world: World) {
    return (this.#records[world.id] = this.#state.infos.map(
      (x) => world.storage.getOrCreate(x, world.capacity)!,
    ));
  }

  //[Symbol.iterator](): IterableIterator<QueryResult<T>> {
  //  return this.iter(Runtime.currentWorld);
  //}

  forEach(callback: (...components: QueryResult<T>) => unknown) {
    const storages =
      this.#records[Runtime.currentWorld.id] ?? this.#registerWorld(Runtime.currentWorld);

    let smallest = storages[0];
    for (let i = 1; i < storages.length; i++) {
      const current = storages[i];
      if (current.length < smallest.length) {
        smallest = current;
      }
    }

    const entities = smallest.entitySlice();

    root: for (let i = 0; i < entities.length; i++) {
      const entity = entities.get(i);
      for (let j = 0; j < storages.length; j++) {
        const data = storages[j].get(entity);
        if (!data) continue root;
        this.#result.value[j] = data;
      }
      callback(...this.#result.value);
    }
  }

  /*
  iter(world: World = Runtime.currentWorld): IterableIterator<QueryResult<T>> {
    this.#read = 0;
    this.#world = world;
    this.#entities = world.storage.shortestSliceOf(...this.#state.infos)!;
    this.#result.done = false;
    this.#resultIndex = 0;

    return {
      next: () => this.#next(),
    } as IterableIterator<QueryResult<T>>;
  }

  #next(): IteratorResult<QueryResult<T>> {
    /*

    root: while (this.#read < 10_000) {
      const entity = this.#read++;
      this.#resultIndex = 0;
      for (let i = 0; i < this.#state.fetches.length; i++) {
        const fetch = this.#state.fetches[i];
        const storage = this.#world!.storage.get(fetch.info!.id);

        const isTag = fetch.info!.type === ComponentType.Tag;
        const data = storage.get(entity);

        if (!data) continue root;

        if (isTag) continue;

        this.#result.value[this.#resultIndex++] = data;
      }
      return this.#result;
    }
    this.#result.done = true;
    return this.#result;
  }
    */
}

const OBSERVER_ID_PREFIX = "$";
const ENTITY_ID_PREFIX = "e";

/**
 * Generate a unique identifier for given query params.
 *
 * This is used to cache queries so we don't have to re- build the query
 * every time it's created by the `query`-function.
 * @param params
 * @returns
 */
function uniqueQueryIdentifier<T extends QueryParams>(...params: T): QueryId {
  const parsedParams = [];
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    let [prefix, paramId] = ["", ""];
    if (isFilter(param)) {
      prefix = param.identifier;
      for (let i = 0; i < param.include.length; i++) {
        const component = getComponentInfoOrRegister(param.include[i] as Component);
        paramId += component.id.toString();
      }
    } else {
      const paramIsObserve = isObserve(param);
      const symbol =
        param === Entity
          ? ENTITY_ID_PREFIX
          : getComponentInfoOrRegister(
              paramIsObserve ? (param as Observe).include : (param as Component),
            ).id;
      paramId = symbol.toString();
      prefix = paramIsObserve ? OBSERVER_ID_PREFIX : "";
    }
    parsedParams.push(prefix + paramId);
  }
  return parsedParams.sort().join("_");
}

function createQueryState<T extends QueryParams>(...params: T): QueryState {
  const fetches = params.flatMap((x) =>
    isFilter(x)
      ? x.include.map((y) => unpackQueryParamFetchInfo(y, x))
      : unpackQueryParamFetchInfo(x as Component | Observe),
  );

  const infos = fetches.filter((x) => x.info != undefined).map((x) => x.info!);

  return {
    infos,
    fetches,
  };
}

function unpackQueryParamFetchInfo(
  param: Component | Observe | typeof Entity,
  filter?: ComponentFilter | EntityFilter,
): ComponentFetch {
  const component = isObserve(param) ? param.include : param;
  const info = getComponentInfoOrRegister(component as Component);

  return {
    info,
  };
}

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

/**
 * Convert to instance type or empty if Tag component.
 */
type UnwrapQueryParamInstance<T extends Type> = T extends typeof Entity
  ? Entity
  : T extends IsTag<T>
  ? []
  : InstanceType<T>;
