import type { Component, ComponentId } from "../component/mod";
import { SYMBOL_PREFIX } from "../constants";
import type { Entity } from "../entity/mod";

const IS_PROXY_TYPE: unique symbol = Symbol(SYMBOL_PREFIX + "is_proxy");

export interface ProxyType {
  [IS_PROXY_TYPE]?: boolean;
}

type Proxy = InstanceType<typeof Proxy> & ProxyType;
type Target = Record<PropertyKey, unknown>;

const isValidProxyTarget = (obj: unknown) =>
  (typeof obj === "object" && obj !== null) || typeof obj === "function";

type ProxyCallback = (entity: Entity, id: ComponentId) => unknown;

/**
 * ProxyObserver
 */
export class ProxyObserver {
  private proxies: WeakMap<Target, Proxy>;

  /**
   * Creates a ProxyObserver with given `callback` function.
   * The `callback` will be called whenever a tracked object is being mutated.
   * @param callback
   */
  constructor(private readonly callback: ProxyCallback) {
    this.proxies = new WeakMap();
  }

  /**
   * Retrieves or creates a proxy of `target` that will trigger the
   * changed callback with given `entity` & `component` as parameters.
   * @param target
   * @param entity
   * @param component
   * @returns
   */
  public track<T extends Target>(target: T, entity: Entity, id: ComponentId): T | (T & ProxyType) {
    const { proxies } = this;
    const track = this.track.bind(this);
    const callback = this.callback.bind(this);

    let proxy = proxies.get(target);

    if (proxy) return (proxy as unknown) as T;

    const handlers = {
      get(target: Target, key: PropertyKey) {
        const value = Reflect.get(target, key);
        return typeof key !== "symbol" && isValidProxyTarget(value)
          ? proxies.get(value) ?? track(value, entity, id)
          : value;
      },
      set(target: Target, key: PropertyKey, value: unknown) {
        const has_key = Object.hasOwnProperty.call(target, key);
        const old_value = target[key as any];
        const new_value = Reflect.set(target, key, value);

        if (!has_key || value !== old_value) {
          callback(entity, id);
        }

        return new_value;
      },
      deleteProperty(target: Target, key: PropertyKey) {
        callback(entity, id);
        return Reflect.deleteProperty(target, key);
      },
    };

    proxy = new Proxy(target, handlers) as Proxy;
    proxy[IS_PROXY_TYPE] = true;

    proxies.set(target, proxy);
    return (proxy as unknown) as T;
  }
}
