import { record } from "@dreki.land/shared";
import type { World } from "../mod";
import { Schedule } from "./schedule";
import { Stage, Runnable } from "./stage";

const DEFAULT_STAGES_PREFIX = "default";

export const Stages = stage_labels(DEFAULT_STAGES_PREFIX, {
  First: "first",
  BeforeUpdate: "before_update",
  Update: "update",
  AfterUpdate: "after_update",
  Last: "last",
});

export const StartupStages = stage_labels(DEFAULT_STAGES_PREFIX, {
  PreStartup: "pre_startup",
  Startup: "startup",
  PostStartup: "post_startup",
});

/**
 * Prefixes the value of each property of given `stages` with ``${prefix}::`` where.
 *
 * @example
 * ```typescript
 * // generates -> { First: "example::first" }
 * const ExampleStages = prefixed_stages("example", { First: "first" });
 * ```
 * @param prefix
 * @param stages
 * @returns
 */
export function stage_labels<T extends record>(prefix: string, stages: T) {
  return Object.fromEntries(Object.entries(stages).map(([k, v]) => [k, `${prefix}::${v}`])) as T;
}

export type StageCreationParams = {
  order: "after" | "before";
  params: Parameters<Schedule["add_stage_before"]>;
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
    this.schedule.add_stage_after(Stages.Update, Stages.AfterUpdate, new Stage());
    this.schedule.add_stage_after(Stages.AfterUpdate, Stages.Last, new Stage());
    this.schedule.add_stage_before(Stages.Update, Stages.BeforeUpdate, new Stage());
    this.schedule.add_stage_before(Stages.BeforeUpdate, Stages.First, new Stage());

    // startup schedule
    this.startup = new Schedule([StartupStages.Startup, new Stage()]);
    this.startup.add_stage_after(StartupStages.Startup, StartupStages.PostStartup, new Stage());
    this.startup.add_stage_before(StartupStages.Startup, StartupStages.PreStartup, new Stage());
  }

  /**
   * Run startup schedule
   * @param world
   */
  run_startup(world: World) {
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
  resolve_stages(startup_params: StageCreationParams[], update_params: StageCreationParams[]) {
    this.resolve_stage_internal(startup_params, this.startup);
    this.resolve_stage_internal(update_params, this.schedule);
  }

  private resolve_stage_internal(params: StageCreationParams[], schedule: Schedule) {
    const input = params;
    if (input.length <= 0) return;
    let i = -1;
    while (input.length > 0) {
      i = (i + 1) % input.length;
      const target = input[i].params[0];
      const stage = schedule.stages.get(target);
      if (stage === undefined) continue;
      if (input[i].order === "after") {
        schedule.add_stage_after(...input[i].params);
      } else if (input[i].order === "before") {
        schedule.add_stage_before(...input[i].params);
      }
      input.splice(i, 1);
    }
  }
}
