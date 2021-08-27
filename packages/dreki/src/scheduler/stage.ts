import { MAX_SYSTEMS_PER_STAGE } from "../constants";
import type { World } from "../mod";
import { ResourceNotFoundError } from "../world/mod";
import { SystemInput, SystemInputContext } from "./input";
import { System, SystemRunner } from "./system";

/**
 * Stage label
 */
export type StageLabel = string;

/**
 * A stage, have a collection of systems
 */
export class Stage {
  systems: SystemRunner[];
  lastTickCheck: number;

  constructor(...systems: System[]) {
    this.systems = [];
    this.addSystems(...systems);
    this.lastTickCheck = 0;
  }

  /**
   * Add systems to this stage
   * @param systems
   */
  addSystems(...systems: System[]) {
    const newLength = systems.length + this.systems.length;

    if (newLength > MAX_SYSTEMS_PER_STAGE) {
      throw new Error(
        `Trying to add systems to stage which would exceede max system limit (${MAX_SYSTEMS_PER_STAGE})`,
      );
    }

    this.systems.push(...systems.map((x) => new SystemRunner(x)));
  }

  /**
   * Run this stage on given world
   * @param world
   */
  run(context: SystemInputContext) {
    for (let i = 0; i < this.systems.length; i++) {
      try {
        this.systems[i].run(world, context);
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

export function createSystemInput(stage: Stage): SystemInput {
  function res<T extends readonly Resource[]>(...resources: T) {
    const result = resources.map((x) => context.world!.resource(x));
    return (result.length > 1 ? result : result[0]) as OmitTupleIfSingleInstanceTypes<T>;
  }

  function events<T extends readonly Event[]>(...events: T) {
    const result = events.map((x) => context.world!.event(x));
    return (result.length > 1 ? result : result[0]) as OmitTupleIfSingle<EventsWrapper<T>>;
  }

  return {};
}
