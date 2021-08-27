import { record } from "@dreki.land/shared";
import type { World } from "../mod";
import { Schedule } from "./schedule";
import { Stage, Runnable } from "./stage";

const DEFAULT_STAGES_PREFIX = "default";

/**
 * Default stages
 */
export const Stages = labels(DEFAULT_STAGES_PREFIX, {
  First: "first",
  BeforeUpdate: "before_update",
  Update: "update",
  AfterUpdate: "after_update",
  Last: "last",
});

/**
 * Default startup stages
 */
export const StartupStages = labels(DEFAULT_STAGES_PREFIX, {
  PreStartup: "pre_startup",
  Startup: "startup",
  PostStartup: "post_startup",
});

/**
 * Prefixes the value of each property of given `stages` with ``${prefix}::``.
 *
 * @example
 * ```typescript
 * // generates -> { First: "example::first" }
 * const ExampleStages = labels("example", { First: "first" });
 * ```
 * @param prefix
 * @param stages
 * @returns
 */
export function labels<T extends record>(prefix: string, stages: T) {
  return Object.fromEntries(
    Object.entries(stages).map(([k, v]) => [k, `${prefix}::${v}`]),
  ) as unknown as T;
}

export type StageCreationParams = {
  order: "after" | "before";
  params: Parameters<Schedule["addStageBefore"]>;
};

/**
 * A scheduler
 */
export class Scheduler implements Runnable {
  readonly startup: Schedule;
  readonly schedule: Schedule;

  constructor() {
    // update schedule
    this.schedule = new Schedule([Stages.Update, new Stage()]);
    this.schedule.addStageAfter(Stages.Update, Stages.AfterUpdate, new Stage());
    this.schedule.addStageAfter(Stages.AfterUpdate, Stages.Last, new Stage());
    this.schedule.addStageBefore(Stages.Update, Stages.BeforeUpdate, new Stage());
    this.schedule.addStageBefore(Stages.BeforeUpdate, Stages.First, new Stage());

    // startup schedule
    this.startup = new Schedule([StartupStages.Startup, new Stage()]);
    this.startup.addStageAfter(StartupStages.Startup, StartupStages.PostStartup, new Stage());
    this.startup.addStageBefore(StartupStages.Startup, StartupStages.PreStartup, new Stage());
  }

  /**
   * Run startup schedule
   * @param world
   */
  runStartup(world: World) {
    this.startup.run(world);
  }

  /**
   * Run update schedule
   * @param world
   */
  run(world: World) {
    this.schedule.run(world);
  }

  /**
   * Resolve stage execution order by given params for startup & update schedule
   * @param startup_params
   * @param update_params
   */
  resolveStages(startupParams: StageCreationParams[], updateParams: StageCreationParams[]) {
    this.#resolveStagesInternal(startupParams, this.startup);
    this.#resolveStagesInternal(updateParams, this.schedule);
  }

  #resolveStagesInternal(params: StageCreationParams[], schedule: Schedule) {
    const input = params;
    if (input.length <= 0) return;
    let i = -1;
    while (input.length > 0) {
      i = (i + 1) % input.length;
      const target = input[i].params[0];
      const stage = schedule.stages.get(target);
      if (stage === undefined) continue;
      if (input[i].order === "after") {
        schedule.addStageAfter(...input[i].params);
      } else if (input[i].order === "before") {
        schedule.addStageBefore(...input[i].params);
      }
      input.splice(i, 1);
    }
  }
}
