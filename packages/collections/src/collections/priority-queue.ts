import { swap } from "@dreki.land/shared";

export type WithPriority<T = unknown> = T & {
  priority?: number;
};

export class PriorityQueue<T extends WithPriority> {
  private data: T[];

  public constructor() {
    this.data = [];
  }

  get empty() {
    return this.data.length === 0;
  }

  get length() {
    return this.data.length;
  }

  get array() {
    return this.data;
  }

  public push(element: T) {
    this.data.push(element);
    this.heapify_up();
  }

  public at(index: number) {
    return this.data[index];
  }

  public pop(): T {
    const value = this.data[0];

    swap(this.data, 0, this.data.length);
    this.data.splice(-1, 1);

    if (this.data.length > 0) {
      this.heapify_down();
    }

    return value;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.data[Symbol.iterator]();
  }

  private heapify_up() {
    let index = this.data.length - 1;
    while (!this.is_root(index) && this.compare(this.get_parent_index(index), index) > 0) {
      const parent = this.get_parent_index(index);
      swap(this.data, parent, index);
      index = parent;
    }
  }

  private heapify_down() {
    let index = 0;
    while (this.has_left_child(index)) {
      const lci = this.get_left_child_index(index);
      const rci = this.get_right_child_index(index);

      // Find which child has smallest priority
      let smallerChild = lci;
      if (this.has_right_child(index) && this.compare(lci, rci) > 0) {
        smallerChild = rci;
      }

      // If smallest priority child is larger than self's priority, then done
      if (this.compare(index, smallerChild) <= 0) {
        return;
      }

      swap(this.data, index, smallerChild);
      index = smallerChild;
    }
  }

  private compare(i: number, j: number) {
    return this.data[i]?.priority ?? 0 - (this.data[j]?.priority ?? 0);
  }

  private get_left_child_index(i: number) {
    return 2 * i + 1;
  }

  private get_right_child_index(i: number) {
    return 2 * i + 2;
  }

  private get_parent_index(i: number) {
    return +Math.ceil((i - 1) / 2);
  }

  private has_left_child(i: number) {
    return this.get_left_child_index(i) < this.data.length;
  }

  private has_right_child(i: number) {
    return this.get_right_child_index(i) < this.data.length;
  }

  private is_root(i: number) {
    return i === this.data.length;
  }
}
