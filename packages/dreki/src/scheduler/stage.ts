import { MAX_SYSTEMS_PER_STAGE } from "../constants";
import type { World } from "../mod";
import { ResourceNotFoundError } from "../world/mod";
import { System, SystemFunc } from "./system";

export type Runnable = {
  run(world: World): unknown;
};

export type StageLabel = string;

export class Stage implements Runnable {
  public systems: System[];

  last_tick_check: number;

  public constructor(...systems: SystemFunc[]) {
    this.systems = [];
    this.add_systems(...systems);
    this.last_tick_check = 0;
  }

  public add_systems(...systems: SystemFunc[]) {
    const new_length = systems.length + this.systems.length;

    if (new_length > MAX_SYSTEMS_PER_STAGE) {
      throw new Error(
        `Trying to add systems to stage which would exceede max system limit (${MAX_SYSTEMS_PER_STAGE})`,
      );
    }

    this.systems.push(...systems.map((x) => new System(x)));
  }

  public run(world: World) {
    for (let i = 0; i < this.systems.length; i++) {
      try {
        this.systems[i].run(world);
      } catch (err) {
        //@see [ResourceNotFoundError]
        if (err instanceof ResourceNotFoundError) {
          continue;
        } else {
          throw err;
        }
      }
    }

    this.check_change_tick(world);
  }

  public check_change_tick(world: World) {
    const change_tick = world.change_tick;
    const ticks_since_last_check = change_tick - this.last_tick_check;

    /**
     * Only check after at least `MAX_SYSTEMS_PER_STAGE` counts, since thats the maximum
     * allowed systems in a stage and thus a safe threshold so we don't have to check every update.
     */
    if (ticks_since_last_check > MAX_SYSTEMS_PER_STAGE) {
      for (let i = 0; i < this.systems.length; i++) {
        this.systems[i].check_change_tick(change_tick);
      }

      // also check component ticks
      world.check_change_ticks();

      this.last_tick_check = change_tick;
    }
  }
}
