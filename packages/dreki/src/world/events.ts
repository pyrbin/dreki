import { vec, Vec } from "@dreki.land/collections";
import { getOrInsert, OmitTupleIfSingle, record, Type } from "@dreki.land/shared";
import type { World } from "./mod";
import { Runtime } from "./Runtime";

const emptyIterator = [][Symbol.iterator]();

/**
 * Create a read/write access for given Event(s) in active world.
 * @note This should only be used inside systems as it uses the [Runtime]
 * context to fetch current world & system metadata.
 * @param event
 * @returns
 */
export function events<T extends readonly Event[]>(...events: T) {
  const result = events.map((x) => eventInternal(x, Runtime.currentWorld, Runtime.lastEventCounts));
  return (result.length > 1 ? result : result[0]) as OmitTupleIfSingle<EventsWrapper<T>>;
}

type EventsWrapper<T extends readonly Event[]> = {
  [K in keyof T]: T[K] extends Event ? Events<T[K]> : never;
};

export function eventInternal<T extends Event>(
  event: T,
  world: World,
  readerCounts: EventsCounter,
): Events<T> {
  return {
    emit: (data: EventInstance<T>) => {
      const store = getOrInsert(world.events, event, () => new EventStore<T>());
      store?.push(data);
    },
    iter: (): EventIterable<T> => {
      const store = getOrInsert(world.events, event, () => new EventStore<T>());
      const readCount = getOrInsert(readerCounts, event, 0);
      readerCounts.set(event, store.eventCount);
      return {
        [Symbol.iterator]: () => (store?.drain(readCount) ?? emptyIterator) as EventIterator<T>,
      };
    },
    take: (length: number, fn) => {
      const store = getOrInsert(world.events, event, () => new EventStore<T>());
      const readCount = getOrInsert(readerCounts, event, 0);
      readerCounts.set(event, store.eventCount);
      const events = store.events(readCount).slice(-Math.abs(length));
      if (events.length > 0) {
        fn(events);
      }
    },
  };
}

export type Event<T extends record = record> = Type<T>;
export type EventInstance<T extends Event> = InstanceType<T>;

export type EventIterable<T extends Event> = Iterable<Readonly<EventInstance<T>>>;
export type EventIterator<T extends Event> = Iterator<Readonly<EventInstance<T>>>;

export type EventsCounter = Map<Event, number>;
export type EventStorage = Map<Event, EventStore>;

/**
 * A read- & write-accessor for an event.
 */
export type Events<T extends Event> = {
  /**
   * Sends an event.
   * @param event
   */
  emit(event: EventInstance<T>): void;
  /**
   * Iterates over the events that this access has not seen yet.
   * Individual event instances can only be read once per system.
   */
  iter(): EventIterable<T>;
  /**
   * Retrieves a fixed length (or as close as possible) of event instances.
   * The rest of the events can not be read afterwards.
   */
  take(length: number, fn: (events: readonly EventInstance<T>[]) => unknown): void;
};

export type EventWriter<T extends Event> = { emit: Events<T>["emit"] };

export type EventReader<T extends Event> = {
  take: Events<T>["take"];
  iter: Events<T>["iter"];
};

/**
 * A event store
 */
export class EventStore<T extends Event = Event> {
  back: Vec<EventInstance<T>> = vec(64);
  front: Vec<EventInstance<T>> = vec(64);

  eventCount = 0;

  /**
   * Add event instance
   * @param event
   */
  push(event: EventInstance<T>) {
    this.front.push(event);
    this.eventCount++;
  }

  /**
   * Update event store.
   */
  update() {
    const tmp = this.back.raw;

    this.back.setRaw(this.front.raw);
    this.back.resize(this.front.length);

    this.front.setRaw(tmp);
    this.front.clear();
  }

  /**
   * Gets events for given access count.
   * @param accessCount
   * @returns
   */
  events(accessCount: number) {
    const count = this.eventCount - accessCount;
    const diff = count - this.front.length;

    if (diff <= 0) {
      return [...this.front];
    }

    return [...this.back.slice(-diff), ...this.front];
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
