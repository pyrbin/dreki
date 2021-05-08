import { vec, Vec } from "@dreki.land/collections";
import { get_or_insert, OmitTupleIfSingle, record, Type } from "@dreki.land/shared";
import { runtime } from "./runtime";

const empty_iterator = [][Symbol.iterator]();

/**
 * Create a read/write access for given Event(s) in active world.
 * @note This should only be used inside systems as it uses the [runtime]
 * context to fetch current world & system metadata.
 * @param event
 * @returns
 */
export function events<T extends readonly Event[]>(...events: T) {
  const result = events.map((x) => event_internal(x));
  return (result.length > 1 ? result : result[0]) as OmitTupleIfSingle<EventsWrapper<T>>;
}

type EventsWrapper<T extends readonly Event[]> = {
  [K in keyof T]: T[K] extends Event ? Events<T[K]> : never;
};

function event_internal<T extends Event>(event: T): Events<T> {
  return {
    send: (data: EventInstance<T>) => {
      const store = get_or_insert(runtime.current_world.events, event, () => new EventStore<T>());
      store?.push(data);
    },
    iter: (): EventIterable<T> => {
      const store = get_or_insert(runtime.current_world.events, event, () => new EventStore<T>());
      const read_count = get_or_insert(runtime.last_event_counts, event, 0);
      runtime.last_event_counts.set(event, store.event_count);
      return {
        [Symbol.iterator]: () => (store?.drain(read_count) ?? empty_iterator) as EventIterator<T>,
      };
    },
  };
}

export type Event<T extends record = record> = Type<T>;
export type EventInstance<T extends Event> = InstanceType<T>;

export type EventIterable<T extends Event> = Readonly<Iterable<EventInstance<T>>>;
export type EventIterator<T extends Event> = Readonly<Iterator<EventInstance<T>>>;

export type EventsCount = Map<Event, number>;
export type EventStorage = Map<Event, EventStore>;

export type Events<T extends Event> = {
  /**
   * Sends an event.
   * @param event
   */
  send(event: EventInstance<T>): void;
  /**
   * Iterates over the events that this access has not seen yet.
   * Individual event instances can only be read once per system.
   */
  iter(): EventIterable<T>;
};

export class EventStore<T extends Event = Event> {
  public back: Vec<EventInstance<T>> = vec(4);
  public front: Vec<EventInstance<T>> = vec(4);

  public event_count: number = 0;

  public push(event: EventInstance<T>) {
    this.front.push(event);
    this.event_count++;
  }

  public update() {
    const tmp = this.back.raw;

    this.back.set_raw(this.front.raw);
    this.back.resize(this.front.length);

    this.front.set_raw(tmp);
    this.front.clear();
  }

  public drain(access_count: number): EventIterator<T> {
    const count = this.event_count - access_count;
    const diff = count - this.front.length;

    if (diff <= 0) {
      return this.front[Symbol.iterator]();
    }

    return [...this.back.slice(-diff), ...this.front][Symbol.iterator]();
  }
}
