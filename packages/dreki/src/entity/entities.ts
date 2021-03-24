import { Vec, vec } from "@dreki.land/collections";
import { Entity } from "./mod";
import { MAX_ENTITY_CAPACITY } from "../constants";

export type EntityMeta = {
  generation: number;
};

export class Entities {
  private meta: Vec<EntityMeta>;

  /**
   * Stores recently freed index. Indices in this list are always
   * prioritized when creating new entities.
   */
  private freelist: Vec<number>;

  private len: number;

  /**
   * Create new entity storage with given capacity. Will call `on_realloc` when reallocations occurs.
   * @param capacity
   * @param on_realloc
   */
  constructor(capacity: number, private readonly on_realloc?: (length: number) => unknown) {
    this.meta = vec(capacity, () => ({ generation: 0 }));
    this.freelist = vec(32, 0);
    this.len = 0;
  }

  /**
   * Create a new entity & returns a unique Entity ID
   * Will grow by half it's capacity if the capacity is reached.
   *
   * Throws an error if the MAX_ENTITY_CAPACITY is reached (1_000_000 entities)
   * @returns
   */
  public allocate(): Entity {
    this.len++;
    let index = this.freelist.pop();

    if (this.len > this.capacity) {
      if (this.capacity === MAX_ENTITY_CAPACITY) {
        this.len--;
        throw new Error(`Can't spawn new entity, max capacity reached (${this.capacity})`);
      }
      this.meta.realloc(Math.min(Math.floor(this.capacity * 1.5), MAX_ENTITY_CAPACITY));
      if (this.on_realloc) this.on_realloc(this.meta.capacity);
    }

    if (index === undefined) {
      index = this.len - 1;
      return new Entity(index, this.meta.raw[index].generation);
    }

    return new Entity(index, this.meta.raw[index].generation);
  }

  /**
   * Disposes an entity
   * @param entity
   * @returns
   */
  public dispose(entity: Entity) {
    const meta = this.meta.raw[entity.index];

    // don't free if there is a generation mismatch
    if (meta.generation !== entity.generation) return;

    meta.generation++;
    this.freelist.push(entity.index);
    this.len--;
  }

  /**
   * Check if an entity ID is valid & contained
   * @param entity
   * @returns
   */
  contains(entity: Entity): boolean {
    return (
      entity.index < this.meta.length &&
      entity.index >= 0 &&
      entity.generation === this.meta.raw[entity.index].generation
    );
  }

  get capacity() {
    return this.meta.capacity;
  }

  get length() {
    return this.len;
  }

  /**
   * Entity iterator
   * @returns
   */
  [Symbol.iterator](): Iterator<Entity> {
    let read_index = 0;
    const data = this.meta;
    const length = this.len;
    return {
      next(): IteratorResult<Entity> {
        if (read_index < length) {
          return {
            value: new Entity(read_index, data.raw[read_index++].generation),
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
