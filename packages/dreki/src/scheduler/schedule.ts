import { insert_at } from "@dreki.land/shared";
import type { World } from "../mod";
import type { StageLabel, Stage, Runnable } from "./stage";
import type { System, SystemFunc } from "./system";

export class Schedule implements Runnable {
  readonly stages: Map<StageLabel, Stage>;
  readonly ordered: [StageLabel, Stage][];

  public constructor(initial: [StageLabel, Stage]) {
    const [name, group] = initial;
    this.ordered = [];
    this.stages = new Map();
    this.stages.set(name, group);
    this.ordered.push([name, group]);
  }

  run(world: World) {
    for (let i = 0; i < this.ordered.length; i++) {
      this.ordered[i][1].run(world);
    }
  }

  iter() {
    const iterator = this.ordered[Symbol.iterator]();
    return {
      [Symbol.iterator]() {
        return iterator;
      },
    };
  }

  add_stage_after(target: StageLabel, label: StageLabel, stage: Stage) {
    this.add_stage_with_offset(target, 1, label, stage);
  }

  add_stage_before(target: StageLabel, label: StageLabel, stage: Stage) {
    this.add_stage_with_offset(target, 0, label, stage);
  }

  insert_systems(target: StageLabel, systems: SystemFunc[]) {
    if (!this.stages.has(target)) {
      throw new Error(`Target group ${target} doesn't exist`);
    }

    this.stages.get(target)?.add_systems(...systems);
  }

  private add_stage_with_offset(
    target: StageLabel,
    offset: number,
    label: StageLabel,
    group: Stage,
  ) {
    if (!this.stages.has(target)) {
      throw new Error(`Target group ${target} doesn't exist`);
    }

    if (this.stages.has(label)) {
      throw new Error(`A group with label ${label} already exist!`);
    }

    const target_index = this.ordered.findIndex((x) => x[0] === target);

    insert_at(this.ordered, target_index + offset, [label, group]);
    this.stages.set(label, group);
  }
}
