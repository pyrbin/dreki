import type { World } from "../mod";
import type { System } from "./system";

export type Result = unknown;

export type Updateable = {
  update(world: World): Result;
};

export type StageLabel = string;

export class Stage implements Updateable {
  public systems: System[];

  public constructor(...systems: System[]) {
    this.systems = Array.from(systems);
  }

  public update(world: World) {
    for (let i = 0; i < this.systems.length; i++) {
      this.systems[i](world);
    }
  }
}
