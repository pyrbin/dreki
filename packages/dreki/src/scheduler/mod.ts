import type { World } from "../mod";
import { Schedule } from "./schedule";
import { Stage, Runnable } from "./stage";

export const enum Stages {
  Update = "update",
}

export type StageCreationParams = {
  order: "after" | "before";
  params: Parameters<Schedule["add_stage_before"]>;
};

export class Scheduler implements Runnable {
  readonly schedule: Schedule;

  constructor() {
    this.schedule = new Schedule([Stages.Update, new Stage()]);
  }

  run(world: World) {
    this.schedule.run(world);
  }

  resolve_stages(params: StageCreationParams[]) {
    const input = params;
    let i = -1;
    while (input.length > 0) {
      i = (i + 1) % input.length;
      const target = input[i].params[0];
      const stage = this.schedule.stages.get(target);
      if (stage === undefined) continue;
      if (input[i].order === "after") {
        this.schedule.add_stage_after(...input[i].params);
      } else if (input[i].order === "before") {
        this.schedule.add_stage_before(...input[i].params);
      }
      input.splice(i, 1);
    }
  }
}
