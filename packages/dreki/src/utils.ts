import { Type } from "@dreki.land/shared";

/**
 * Defines an identifier property with given `key` & given value `identifier` on given `type`.
 * @param type
 * @param identifier
 * @param key
 * @returns
 */
export function defineIdentifier<T extends Type>(
  type: T,
  identifier: number,
  key: string | symbol | number,
) {

  Object.defineProperty(type, key, {
    value: identifier,
    writable: false,
    configurable: false,
    enumerable: false,
  });

  return identifier;
}
