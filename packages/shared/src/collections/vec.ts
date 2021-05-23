import { Allocator } from "../types/mod";
import { arrayOf, insertAt, swap, useAllocator } from "../utils/mod";

/**
 * Function to create a new vector with given capacity & allocator.
 * @param capacity
 * @param allocator
 * @returns
 */
export function vec<T = number>(capacity = 1, allocator: Allocator<T> = undefined) {
  return new Vec<T>(capacity, allocator) as Vec<T>;
}

/**
 * A vector array class. Inspired by rust's Vec.
 */
export class Vec<T> implements Iterable<T> {
  #data: T[];
  #len = 0;
  #allocator: Allocator<T> = undefined;

  constructor(capacity = 1, allocator: Allocator<T> = undefined) {
    this.#data = arrayOf(capacity, allocator);
    this.#len = 0;
    this.#allocator = allocator;
  }

  get(index: number): T {
    return this.#data[index];
  }

  set(index: number, element: T) {
    return (this.#data[index] = element);
  }

  push(...elements: T[]) {
    const newSize = this.#len + elements.length;
    if (newSize >= this.capacity) this.realloc(Math.max(newSize, this.capacity * 1.5));
    for (const element of elements) {
      this.#data[this.#len++] = element;
    }
    return this.#len;
  }

  insert(index: number, element: T): void {
    if (index >= this.capacity) this.realloc();
    insertAt(this as unknown as Array<T>, index, element);
  }

  remove(index: number) {
    if (index > this.#len) return;
    const value = this.#data[index];
    for (index; index < this.#len - 1; index++) {
      swap(this.#data, index, index + 1);
    }
    this.#len--;
    return value;
  }

  pop(): T | undefined {
    if (this.#len === 0) return;
    return this.#data[--this.#len];
  }

  resize(length: number): number {
    return (this.#len = Math.min(length, this.capacity));
  }

  clear(): void {
    this.resize(0);
  }

  realloc(length?: number): number {
    if (length === undefined) length = this.capacity * 1.5;
    length = Math.floor(length);
    if (length < this.capacity) {
      return this.truncate(length);
    }
    for (let i = this.capacity; i < length; i++) {
      this.#data.push(useAllocator(this.#allocator));
    }
    return this.capacity;
  }

  truncate(length: number): number {
    this.#data.slice(0, length);
    return (this.#len = this.#len > length ? length : this.#len);
  }

  swapRemove(index: number): T {
    const value = this.#data[index];
    swap(this.#data, --this.#len, index);
    return value;
  }

  find(
    callback: (element: T, index: number, array: T[]) => boolean,
    thisArg?: unknown,
  ): T | undefined {
    return this.raw.slice(0, this.#len).find(callback, thisArg);
  }

  findIndex(
    callback: (element: T, index: number, array: T[]) => boolean,
    thisArg?: unknown,
  ): number {
    return this.raw.slice(0, this.#len).findIndex(callback, thisArg);
  }

  slice(start?: number, end?: number): T[] {
    return this.raw.slice(0, this.#len).slice(start, end);
  }

  map<Mapped extends Array<unknown>>(
    callback: (element: T, index: number, array: T[]) => Mapped[number],
    thisArg?: unknown,
  ): Mapped {
    return this.raw.slice(0, this.#len).map(callback, thisArg) as Mapped;
  }

  filter(callback: (element: T, index: number, array: T[]) => boolean, thisArg?: unknown): T[] {
    return this.raw.slice(0, this.#len).filter(callback, thisArg);
  }

  setRaw(array: T[]) {
    this.#data = array;
  }

  full(): boolean {
    return this.capacity === this.#len;
  }

  empty(): boolean {
    return this.#len === 0;
  }

  /**
   * Returns the underlying array object. Using this for set/get access performs better
   * than `set` & `get` but is unchecked.
   */
  get raw(): T[] {
    return this.#data;
  }

  get first(): T {
    return this.#data[0];
  }

  get last(): T {
    return this.#data[this.#len - 1];
  }

  get capacity() {
    return this.#data.length;
  }

  get length() {
    return this.#len;
  }

  [Symbol.iterator](): IterableIterator<T> {
    let readIndex = 0;
    const length = this.#len;
    const array = this.#data;
    return {
      next(): IteratorResult<T> {
        if (readIndex < length) {
          return {
            value: array[readIndex++] as T,
          };
        }
        return {
          done: true,
          value: undefined,
        };
      },
    } as IterableIterator<T>;
  }
}
