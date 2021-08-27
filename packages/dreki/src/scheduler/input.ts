import { OmitTupleIfSingle, OmitTupleIfSingleInstanceTypes } from "../../../shared/out/mod";
import { ComponentTick } from "../component/ticks";
import { EventReadCounts, Event, EventReadWrite } from "../world/events";
import { World } from "../world/mod";
import { Resource } from "../world/resources";
import { Stage } from "./stage";

export type SystemInput = {
  res: Res;
  events: Events;
  world: World;
};

type Res = <T extends readonly Resource[]>(...resources: T) => OmitTupleIfSingleInstanceTypes<T>;

type Events = <T extends readonly Event[]>(...events: T) => OmitTupleIfSingle<EventsWrapper<T>>;

type EventsWrapper<T extends readonly Event[]> = {
  [K in keyof T]: T[K] extends Event ? EventReadWrite<T[K]> : never;
};

export type SystemInputContext = {
  res: Res;
  events: Events;
  world: World;
  readCounts: EventReadCounts;
  changeTick: ComponentTick;
};

export interface Executor {
  changeTick: ComponentTick;
  eventReadCounts: EventReadCounts;
}

export class Context {
  world: World;
  executor: Executor;
}

export function createSystemInputContext(): SystemInputContext {
  const world: World | undefined = undefined;
  const readCounts: EventReadCounts | undefined = undefined;

  function res<T extends readonly Resource[]>(...resources: T) {
    const result = resources.map((x) => world!.resource(x));
    return (result.length > 1 ? result : result[0]) as OmitTupleIfSingleInstanceTypes<T>;
  }

  function events<T extends readonly Event[]>(...events: T) {
    const result = events.map((x) => world!.event(x));
    return (result.length > 1 ? result : result[0]) as OmitTupleIfSingle<EventsWrapper<T>>;
  }

  return {
    res,
    events,
    world: world as unknown as World,
    readCounts: readCounts as unknown as EventReadCounts,
  };
}
