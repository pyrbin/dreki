import { MAX_SYSTEMS_PER_STAGE } from "../constants";
import type { World } from "../mod";
import { ResourceNotFoundError } from "../world/mod";
import { System, SystemFunc } from "./system";

/**
 * A runnable type
 */
export type Runnable = {
  run(world: World): unknown;
};

/**
 * Stage label
 */
export type StageLabel = string;

/**
 * A stage, have a collection of systems
 */
export class Stage implements Runnable {
  systems: System[];
  lastTickCheck: number;

  constructor(...systems: SystemFunc[]) {
    this.systems = [];
    this.addSystems(...systems);
    this.lastTickCheck = 0;
  }

  /**
   * Add systems to this stage
   * @param systems
   */
  addSystems(...systems: SystemFunc[]) {
    const newLength = systems.length + this.systems.length;

    if (newLength > MAX_SYSTEMS_PER_STAGE) {
      throw new Error(
        `Trying to add systems to stage which would exceede max system limit (${MAX_SYSTEMS_PER_STAGE})`,
      );
    }

    this.systems.push(...systems.map((x) => new System(x)));
  }

  /**
   * Run this stage on given world
   * @param world
   */
  run(world: World) {
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

    this.checkChangeTick(world);
  }

  /**
   * Check & validate change ticks for world
   * @param world
   */
  checkChangeTick(world: World) {
    const changeTick = world.changeTick;
    const ticksSinceLastCheck = changeTick - this.lastTickCheck;

    /**
     * Only check after at least `MAX_SYSTEMS_PER_STAGE` counts, since thats the maximum
     * allowed systems in a stage and thus a safe threshold so we don't have to check every update.
     */
    if (ticksSinceLastCheck > MAX_SYSTEMS_PER_STAGE) {
      for (let i = 0; i < this.systems.length; i++) {
        this.systems[i].checkChangeTick(changeTick);
      }

      // also check component ticks
      world.checkChangeTicks();

      this.lastTickCheck = changeTick;
    }
  }
}
