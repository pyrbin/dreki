import type { World } from "../mod";
import { Schedule } from "./schedule";
import { Stage, Runnable } from "./stage";

export const enum Stages {
  First = "First",
  BeforeUpdate = "BeforeUpdate",
  Update = "Update",
  AfterUpdate = "AfterUpdate",
  Last = "Last",
}

export const enum StartupStages {
  PreStartup = "PreStartup",
  Startup = "Startup",
  PostStartup = "PostStartup",
}

export type StageCreationParams = {
  order: "after" | "before";
  params: Parameters<Schedule["add_stage_before"]>;
};

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

  run_startup(world: World) {
    this.startup.run(world);
  }

  run(world: World) {
    this.schedule.run(world);
  }

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
