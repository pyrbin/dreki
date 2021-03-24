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

/**
 * Unique ID of an entity
 */
export class Entity {
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
   * Construct an entity of given index & generation
   * @param index
   * @param generation
   * @returns
   */
  constructor(index: number, generation: number) {
    this.index = index;
    this.generation = generation;
  }

  /**
   * Retrieves an empty Entity ID.
   */
  static get null() {
    return new Entity(-1, 0);
  }

  /**
   * Represent given entity as a unique number
   * @param entity
   * @returns
   */
  bits() {
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
  static from_bits(id: number): Entity {
    return new Entity(id & ENTITY_INDEX_MASK, (id & ENTITY_GENERATION_MASK) >>> ENTITY_INDEX_BITS);
  }

  toString() {
    return `Entity { index: ${this.index}, generation: ${this.generation}`;
  }
}
