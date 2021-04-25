import { MAX_CHANGE_TICK_DELTA } from "../constants";
import { World } from "../world/mod";
import { Runnable } from "./stage";

export type SystemFunc = (world: World) => unknown;

export class System implements Runnable {
  readonly func: SystemFunc;

  last_change_tick: number;

  constructor(func: SystemFunc) {
    this.func = func;
    this.last_change_tick = 0;
  }

  run(world: World) {
    // increment world change tick.
    const last_change_tick = world.increment_change_tick();

    // set current last_change_tick runtime context to current systems tick.
    World.runtime.last_change_tick = this.last_change_tick;

    this.func(world);
    this.last_change_tick = last_change_tick;
  }

  check_change_tick(change_tick: number) {
    const tick_delta = change_tick - this.last_change_tick;
    if (tick_delta > MAX_CHANGE_TICK_DELTA) {
      this.last_change_tick = change_tick - MAX_CHANGE_TICK_DELTA;
    }
  }
}
