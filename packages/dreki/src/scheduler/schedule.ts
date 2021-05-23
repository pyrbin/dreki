import { insertAt } from "@dreki.land/shared";
import type { World } from "../mod";
import type { StageLabel, Stage, Runnable } from "./stage";
import type { SystemFunc } from "./system";

/**
 * A schedule of runnable stages
 */
export class Schedule implements Runnable {
  readonly stages: Map<StageLabel, Stage>;
  readonly ordered: [StageLabel, Stage][];

  constructor(initial: [StageLabel, Stage]) {
    const [name, group] = initial;
    this.ordered = [];
    this.stages = new Map();
    this.stages.set(name, group);
    this.ordered.push([name, group]);
  }

  /**
   * Run schedule on given world
   * @param world
   */
  run(world: World) {
    for (let i = 0; i < this.ordered.length; i++) {
      this.ordered[i][1].run(world);
    }
  }

  /**
   * Iterate each stage
   * @returns
   */
  iter() {
    const iterator = this.ordered[Symbol.iterator]();
    return {
      [Symbol.iterator]() {
        return iterator;
      },
    };
  }

  /**
   * Add a new stage after target with label
   * @param target
   * @param label
   * @param stage
   */
  addStageAfter(target: StageLabel, label: StageLabel, stage: Stage) {
    this.#addStageWithOffset(target, 1, label, stage);
  }

  /**
   * Add a new stage before target with label
   * @param target
   * @param label
   * @param stage
   */
  addStageBefore(target: StageLabel, label: StageLabel, stage: Stage) {
    this.#addStageWithOffset(target, 0, label, stage);
  }

  /**
   * Add systems to target stage
   * @param target
   * @param systems
   */
  addSystems(target: StageLabel, systems: SystemFunc[]) {
    if (!this.stages.has(target)) {
      throw new Error(`Target group ${target} doesn't exist`);
    }

    this.stages.get(target)?.addSystems(...systems);
  }

  #addStageWithOffset(target: StageLabel, offset: number, label: StageLabel, group: Stage) {
    if (!this.stages.has(target)) {
      throw new Error(`Target group ${target} doesn't exist`);
    }

    if (this.stages.has(label)) {
      throw new Error(`A group with label ${label} already exist!`);
    }

    const targetIndex = this.ordered.findIndex((x) => x[0] === target);

    insertAt(this.ordered, targetIndex + offset, [label, group]);
    this.stages.set(label, group);
  }
}
