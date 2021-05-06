/**
 * Entites are built on a 32-bit number where the lower 20-bits are reserved for the index
 * & upper 12-bits are used for the generation.
 *
 * This leaves a a restriction of max 1_048_575 (2^20) entities (this is clamped as 1_000_000 in World)
 * with a generation that resets to 0 after 4095 increments.
 */

const ENTITY_BITS = 32;
const ENTITY_INDEX_BITS = 20;
const ENTITY_GENERATION_BITS = ENTITY_BITS - ENTITY_INDEX_BITS;

const ENTITY_MAX_INDEX = 0xfffff; // Math.pow(2, ENTITY_INDEX_BITS)
const ENTITY_INDEX_MASK = ENTITY_MAX_INDEX;

const ENTITY_MAX_GENERATION = 0xfff; // Math.pow(2, ENTITY_GENERATION_BITS)
const ENTITY_GENERATION_MASK = (ENTITY_MAX_GENERATION << ENTITY_INDEX_BITS) >>> 0;

export const INVALID_ENTITY_INDEX = ENTITY_MAX_INDEX;

/**
 * Unique integer ID of an entity.
 */
export type Entity = number;

/**
 *  Create an [Entity] from given index & generation
 */
export const Entity = (index: number, generation: number = 0) =>
  new EntityHandle(index, generation).id();

/**
 *  Create an [Entity] from an [EntityId] instance
 */
Entity.of = (handle: EntityHandle) => handle.id();

/**
 *  Convert an [Entity] to an [EntityId] instance
 * @param entity
 * @returns
 */
Entity.handle_of = (entity: Entity) => EntityHandle.from_id(entity);

/**
 * Retrieves an empty Entity.
 */
Entity.null = INVALID_ENTITY_INDEX as Entity;

/**
 * Unique handle of an entity
 */
export class EntityHandle {
  /**
   * No two simultaneously-alive entities shares the same index,
   * but may share with "dead" ones.
   * @see Entity.generation
   */
  readonly index: number = 0;

  /**
   * The generation is incremented each time an entity with given index is removed.
   * Thus guarantees no "dead" entites can be used to access alive ones.
   */
  readonly generation: number = 0;

  /**
   * Construct an entity handle of given index & generation
   * @param index
   * @param generation
   * @returns
   */
  constructor(index: number, generation: number) {
    this.index = index;
    this.generation = generation;
  }

  /**
   * Represent given entity handle as an entity id
   * @param entity
   * @returns
   */
  id(): Entity {
    return (
      (((this.generation << ENTITY_INDEX_BITS) & ENTITY_GENERATION_MASK) |
        (this.index & ENTITY_INDEX_MASK)) >>>
      0
    );
  }

  /**
   * Convert an id created by Entity.bits to it's original entity.
   * @see Entity.bits
   * @param id
   * @returns
   */
  static from_id(id: number): EntityHandle {
    return new EntityHandle(
      id & ENTITY_INDEX_MASK,
      (id & ENTITY_GENERATION_MASK) >>> ENTITY_INDEX_BITS,
    );
  }

  toString() {
    return `EntityId { index: ${this.index}, generation: ${this.generation}`;
  }
}
