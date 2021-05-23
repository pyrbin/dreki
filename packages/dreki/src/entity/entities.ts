import { Vec, vec } from "@dreki.land/shared";
import { Entity } from "./mod";
import { MAX_ENTITY_CAPACITY } from "../constants";

export type EntityMeta = {
  generation: number;
};

/**
 * A storage of entities
 */
export class Entities {
  #metadata: Vec<EntityMeta>;

  /**
   * Stores recently freed index. Indices in this list are always
   * prioritized when creating new entities.
   */
  #freelist: Vec<number>;
  #len: number;

  #onRealloc?: (length: number) => unknown;

  /**
   * Create new entity storage with given capacity. Will call `onRealloc` when reallocations occurs.
   * @param capacity
   * @param onRealloc
   */
  constructor(capacity: number, onRealloc?: (length: number) => unknown) {
    this.#metadata = vec(capacity, () => ({ generation: 0 }));
    this.#freelist = vec(32, 0);
    this.#onRealloc = onRealloc;
    this.#len = 0;
  }

  /**
   * Create a new entity & returns a unique Entity ID
   * Will grow by half it's capacity if the capacity is reached.
   *
   * Throws an error if the MAX_ENTITY_CAPACITY is reached (1_000_000 entities)
   * @returns
   */
  allocate(): Entity {
    this.#len++;
    let index = this.#freelist.pop();

    if (this.#len > this.capacity) {
      if (this.capacity === MAX_ENTITY_CAPACITY) {
        this.#len--;
        throw new Error(`Can't spawn new entity, max capacity reached (${this.capacity})`);
      }
      this.#metadata.realloc(Math.min(Math.floor(this.capacity * 1.5), MAX_ENTITY_CAPACITY));
      if (this.#onRealloc) this.#onRealloc(this.#metadata.capacity);
    }

    if (index === undefined) {
      index = this.#len - 1;
      return Entity(index, this.#metadata.raw[index].generation);
    }

    return Entity(index, this.#metadata.raw[index].generation);
  }

  /**
   * Disposes an entity
   * @param entity
   * @returns
   */
  dispose(entity: Entity) {
    const handle = Entity.handleOf(entity);
    const meta = this.#metadata.raw[handle.index];

    // don't free if there is a generation mismatch
    if (meta.generation !== handle.generation) return;

    meta.generation++;
    this.#freelist.push(handle.index);
    this.#len--;
  }

  /**
   * Check if an entity ID is valid & contained
   * @param entity
   * @returns
   */
  contains(entity: Entity): boolean {
    const handle = Entity.handleOf(entity);
    return (
      handle.index < this.#len &&
      handle.index >= 0 &&
      handle.generation === this.#metadata.raw[handle.index].generation
    );
  }

  get capacity() {
    return this.#metadata.capacity;
  }

  get length() {
    return this.#len;
  }

  /**
   * Entity iterator
   * @returns
   */
  [Symbol.iterator](): Iterator<Entity> {
    let readIndex = 0;
    const data = this.#metadata;
    const length = this.#len;
    return {
      next(): IteratorResult<Entity> {
        if (readIndex < length) {
          return {
            value: Entity(readIndex, data.raw[readIndex++].generation),
          };
        }
        return {
          done: true,
          value: undefined,
        };
      },
    };
  }
}
