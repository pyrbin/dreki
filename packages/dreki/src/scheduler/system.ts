import { MAX_CHANGE_TICK_DELTA } from "../constants";
import { EventsCounter } from "../world/events";
import { World } from "../world/mod";
import { Runtime } from "../world/runtime";
import { Runnable } from "./stage";

export type SystemFunc = (world: World) => unknown;

export class System implements Runnable {
  readonly func: SystemFunc;

  lastChangeTick: number;
  eventsCounter: EventsCounter;

  constructor(func: SystemFunc) {
    this.func = func;
    this.lastChangeTick = 0;
    this.eventsCounter = new Map();
  }

  /**
   * Run this system on given world
   * @param world
   */
  run(world: World) {
    // increment world change tick.
    const lastChangeTick = world.incrementChangeTick();

    // set current lastChangeTick Runtime context to current systems tick.
    Runtime.lastChangeTick = this.lastChangeTick;
    Runtime.lastEventCounts = this.eventsCounter;

    this.func(world);
    this.lastChangeTick = lastChangeTick;
  }

  checkChangeTick(changeTick: number) {
    const tickDelta = changeTick - this.lastChangeTick;
    if (tickDelta > MAX_CHANGE_TICK_DELTA) {
      this.lastChangeTick = changeTick - MAX_CHANGE_TICK_DELTA;
    }
  }
}
