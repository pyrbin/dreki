import type { ComponentId } from "../component/mod";
import type { Entity } from "../entity/mod";

type Proxy = InstanceType<typeof Proxy>;
type Target = Record<PropertyKey, unknown>;

const isValidProxyTarget = (obj: unknown) =>
  (typeof obj === "object" && obj !== null) || typeof obj === "function";

type ProxyCallback = (entity: Entity, id: ComponentId) => unknown;

/**
 * A proxy observer
 */
export class ProxyObserver {
  #proxies: WeakMap<Target, Proxy>;
  #callback: ProxyCallback;

  /**
   * Creates a ProxyObserver with given `callback` function.
   * The `callback` will be called whenever a tracked object is being mutated.
   * @param callback
   */
  constructor(callback: ProxyCallback) {
    this.#proxies = new Map();
    this.#callback = callback;
  }

  /**
   * Retrieves or creates a proxy of `target` that will trigger the
   * changed callback with given `entity` & `component` as parameters.
   * @param target
   * @param entity
   * @param component
   * @returns
   */
  track<T extends Target>(target: T, entity: Entity, id: ComponentId): T {
    const proxies = this.#proxies;
    const track = this.track.bind(this);
    const callback = this.#callback.bind(this);

    let proxy = proxies.get(target);

    if (proxy) return proxy as unknown as T;

    const handlers = {
      get(target: Target, key: PropertyKey) {
        const value = Reflect.get(target, key);
        return typeof key !== "symbol" && isValidProxyTarget(value)
          ? proxies.get(value) ?? track(value, entity, id)
          : value;
      },
      set(target: Target, key: PropertyKey, value: unknown) {
        const hasKey = Object.hasOwnProperty.call(target, key);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const oldValue = target[key];

        const newValue = Reflect.set(target, key, value);

        if (!hasKey || value !== oldValue) {
          callback(entity, id);
        }

        return newValue;
      },
      deleteProperty(target: Target, key: PropertyKey) {
        callback(entity, id);
        return Reflect.deleteProperty(target, key);
      },
    };

    proxy = new Proxy(target, handlers);
    proxies.set(target, proxy);

    return proxy as T;
  }
}
