import { vec, Vec, record, Type } from "@dreki.land/shared";
import { EVENT_ID_PROP_KEY } from "../constants";
import { defineIdentifier } from "../utils";
import type { World } from "./mod";
import { Runtime } from "./runtime";

export type EventId = number;
export type Event<T extends record = record> = Type<T> & { [EVENT_ID_PROP_KEY]?: EventId };
export type EventInstance<T extends Event> = InstanceType<T>;

export type EventIterable<T extends Event> = Iterable<Readonly<EventInstance<T>>>;
export type EventIterator<T extends Event> = Iterator<Readonly<EventInstance<T>>>;

export type EventReadCounts = record<EventId, number>;
export type EventRecords = record<EventId, EventRecord>;

const emptyIterator = [][Symbol.iterator]();

export function createEventReadWrite<T extends Event = Event>(
  event: T,
  world: World,
  counters: EventReadCounts,
): EventReadWrite<T> {
  const id =
    event[EVENT_ID_PROP_KEY] ??
    defineIdentifier(event, Runtime.eventIdCounter++, EVENT_ID_PROP_KEY);

  const record = world.events[id] ?? (world.events[id] = new EventRecord<T>());

  return {
    emit(data: EventInstance<T>) {
      record?.push(data);
    },

    iter(): EventIterable<T> {
      const count = counters[id] ?? (counters[id] = record.count());
      counters[id] = record.count();
      return {
        [Symbol.iterator]: () => (record.drain(count) ?? emptyIterator) as EventIterator<T>,
      };
    },

    once(fn: (event: EventInstance<T>) => unknown) {
      const count = counters[id] ?? (counters[id] = record.count());
      counters[id] = record.count();
      const events = record.events(count);
      if (events.length > 0) {
        fn(events[0] as InstanceType<T>);
      }
    },
  };
}

/**
 * A read- & write-accessor for an event.
 */
export type EventReadWrite<T extends Event> = {
  /**
   * Sends an event.
   * @param event
   */
  emit(data: EventInstance<T>): void;
  /**
   * Iterates over the events that this access has not seen yet.
   * Individual event instances can only be read once per system.
   */
  iter(): EventIterable<T>;
  /**
   * Only retrieves the latest event instance.
   * The rest of the events can not be read afterwards.
   */
  once(fn: (event: EventInstance<T>) => unknown): void;
};

/**
 * A write access for an event
 */
export type EventWriter<T extends Event> = { emit: EventReadWrite<T>["emit"] };

/**
 * A read access for an event
 */
export type EventReader<T extends Event> = {
  once: EventReadWrite<T>["once"];
  iter: EventReadWrite<T>["iter"];
};

/**
 * A event store
 */
export class EventRecord<T extends Event = Event> {
  #back: Vec<EventInstance<T>> = vec(64);
  #front: Vec<EventInstance<T>> = vec(64);

  #eventCount = 0;

  /**
   * Returns current event counter
   * @returns
   */
  count() {
    return this.#eventCount;
  }

  /**
   * Add event instance
   * @param event
   */
  push(event: EventInstance<T>) {
    this.#front.push(event);
    this.#eventCount++;
  }

  /**
   * Update event store.
   */
  update() {
    const tmp = this.#back.raw;

    this.#back.setRaw(this.#front.raw);
    this.#back.resize(this.#front.length);

    this.#front.setRaw(tmp);
    this.#front.clear();
  }

  /**
   * Gets events for given access count.
   * @param accessCount
   * @returns
   */
  events(accessCount: number) {
    const count = this.#eventCount - accessCount;
    const diff = count - this.#front.length;

    if (diff <= 0) {
      return [...this.#front];
    }

    return [...this.#back.slice(-diff), ...this.#front];
  }

  /**
   * Return iterator for events for given access count.
   * @param accessCount
   * @returns
   */
  drain(accessCount: number): EventIterator<T> {
    return this.events(accessCount)[Symbol.iterator]();
  }
}
