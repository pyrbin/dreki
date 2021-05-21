import { swap } from "@dreki.land/shared";

export type WithPriority<T = unknown> = T & {
  priority?: number;
};

export class PriorityQueue<T extends WithPriority> {
  #data: T[];

  public constructor() {
    this.#data = [];
  }

  get empty() {
    return this.#data.length === 0;
  }

  get length() {
    return this.#data.length;
  }

  get array() {
    return this.#data;
  }

  push(element: T) {
    this.#data.push(element);
    this.heapifyUp();
  }

  at(index: number) {
    return this.#data[index];
  }

  pop(): T {
    const value = this.#data[0];

    swap(this.#data, 0, this.#data.length);
    this.#data.splice(-1, 1);

    if (this.#data.length > 0) {
      this.heapifyDown();
    }

    return value;
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.#data[Symbol.iterator]();
  }

  heapifyUp() {
    let index = this.#data.length - 1;
    while (!this.#isRoot(index) && this.compare(this.#getParentIndex(index), index) > 0) {
      const parent = this.#getParentIndex(index);
      swap(this.#data, parent, index);
      index = parent;
    }
  }

  heapifyDown() {
    let index = 0;
    while (this.#hasLeftChild(index)) {
      const lci = this.#getLeftChildIndex(index);
      const rci = this.#getRightChildIndex(index);

      // Find which child has smallest priority
      let smallerChild = lci;
      if (this.#hasRightChild(index) && this.compare(lci, rci) > 0) {
        smallerChild = rci;
      }

      // If smallest priority child is larger than self's priority, then done
      if (this.compare(index, smallerChild) <= 0) {
        return;
      }

      swap(this.#data, index, smallerChild);
      index = smallerChild;
    }
  }

  compare(i: number, j: number) {
    return this.#data[i]?.priority ?? 0 - (this.#data[j]?.priority ?? 0);
  }

  #getLeftChildIndex(i: number) {
    return 2 * i + 1;
  }

  #getRightChildIndex(i: number) {
    return 2 * i + 2;
  }

  #getParentIndex(i: number) {
    return +Math.ceil((i - 1) / 2);
  }

  #hasLeftChild(i: number) {
    return this.#getLeftChildIndex(i) < this.#data.length;
  }

  #hasRightChild(i: number) {
    return this.#getRightChildIndex(i) < this.#data.length;
  }

  #isRoot(i: number) {
    return i === this.#data.length;
  }
}
