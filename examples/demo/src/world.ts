import { query, World } from "dreki";
import { range } from "@dreki.land/shared";

const BATCH_SIZE = 10_000;

// prettier-ignore
export const world = World.build()
  .startupSystems(setupSystem)
  .systems(positionSystem)
  .done();

function setupSystem(world: World) {
  for (const i of range(BATCH_SIZE)) {
    world.spawn(new Position(i, i), new Name(`name ${i}`));
  }
}

function positionSystem() {
  for (const [p, n] of query(Position, Name)) {
    p.x = p.y / p.x;
    p.y = p.x * p.y;
  }
}

class Position {
  x = 0;
  y = 0;

  constructor(x: number, y: number) {
    (this.x = x), (this.y = y);
  }
}

class Name {
  value = "";

  constructor(value: string) {
    this.value = value;
  }
}
