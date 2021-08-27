import { ComponentTick } from "../component/ticks";
import { MAX_CHANGE_TICK_DELTA } from "../constants";
import { EventReadCounts } from "../world/events";
import { Executor, SystemInput, SystemInputContext } from "./input";

export type System = (input: SystemInput) => unknown;

export class SystemRunner implements Executor {
  readonly system: System;

  eventReadCounts: EventReadCounts;
  changeTick: ComponentTick;

  constructor(system: System) {
    this.system = system;
    this.changeTick = 0;
    this.eventReadCounts = {};
  }

  /**
   * Run this system on given world
   * @param world
   */
  run(context: SystemInputContext) {
    // increment world change tick.
    const tick = context.world.incrementChangeTick();

    this.system({ world: context.world, res: context.res, events: context.events });
    this.changeTick = tick;
  }

  checkChangeTick(changeTick: number) {
    const tickDelta = changeTick - this.changeTick;
    if (tickDelta > MAX_CHANGE_TICK_DELTA) {
      this.changeTick = changeTick - MAX_CHANGE_TICK_DELTA;
    }
  }
}
