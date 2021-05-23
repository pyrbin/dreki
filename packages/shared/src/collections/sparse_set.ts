import { Allocator } from "../types/mod";
import { useAllocator } from "../utils/generic";
import { vec, Vec } from "./vec";

/**
 * A generic sparse-set implementation.
 */
export class SparseSet<I extends number, T> implements Iterable<T> {
  readonly dense: Vec<T>;
  readonly indices: Vec<I>;
  readonly sparse: Vec<I | undefined>;

  constructor(capacity: number, allocator?: Allocator<T>) {
    this.dense = vec(capacity, allocator);
    this.indices = vec(capacity, 0 as Allocator<I>);
    this.sparse = vec(capacity);
    this.sparse.resize(capacity);
  }

  insert(index: I, value: T) {
    if (index >= this.sparse.capacity) {
      this.sparse.realloc(index + 1);
      this.sparse.resize(this.sparse.capacity);
    }
    if (this.sparse.raw[index] !== undefined) {
      this.dense.raw[this.sparse.raw[index]!] = value;
      return value;
    }
    this.sparse.raw[index] = this.dense.length as I;
    this.indices.push(index);
    this.dense.push(value);
    return value;
  }

  get(index: I) {
    return this.sparse.raw[index] !== undefined
      ? this.dense.raw[this.sparse.raw[index]!]
      : undefined;
  }

  getUnchecked(index: I) {
    return this.dense.raw[this.sparse.raw[index]!];
  }

  getOrInsert(index: I, allocator: Allocator<T>) {
    return this.get(index) ?? this.insert(index, useAllocator(allocator));
  }

  remove(index: I) {
    const denseIndex = this.sparse.raw[index]!;
    if (denseIndex === undefined) return;
    const isLast = denseIndex === this.dense.length - 1;
    const value = this.dense.swapRemove(denseIndex);
    this.indices.swapRemove(denseIndex);
    if (!isLast) {
      const swappedIndex = this.indices.raw[denseIndex];
      this.sparse.raw[swappedIndex] = denseIndex;
    }
    this.sparse.raw[index] = undefined;
    return value;
  }

  contains(index: I) {
    return this.sparse.raw[index] !== undefined;
  }

  get length() {
    return this.dense.length;
  }

  get capacity() {
    return this.dense.capacity;
  }

  get empty() {
    return this.length === 0;
  }

  /**
   * Iterates each value in the set
   * @returns
   */
  [Symbol.iterator](): Iterator<T> {
    return this.dense[Symbol.iterator]();
  }
}
