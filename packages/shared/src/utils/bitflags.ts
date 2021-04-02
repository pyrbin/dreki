/**
 * Flags
 */
export type Flags = number;

/**
 * Contains helper functions for Bitflag management
 */
export const bitflags = {
  /**
   * Insert given flags to bits
   * @param bits
   * @param other
   * @returns
   */
  insert(bits: Flags, other: Flags) {
    return bits | other;
  },

  /**
   * Removes given flags from bits
   * @param bits
   * @param other
   * @returns
   */
  remove(bits: Flags, other: Flags) {
    return bits & ~other;
  },

  /**
   * Returns true if given flags is set.
   * @param bits
   * @param other
   * @returns
   */
  contains(bits: Flags, other: Flags) {
    return (bits & other) == other;
  },

  /**
   * Set flag to bits depending on value
   * @param bits
   * @param other
   * @param value
   * @returns
   */
  set(bits: Flags, other: Flags, value: true) {
    return value ? this.insert(bits, other) : this.remove(bits, other);
  },
};
