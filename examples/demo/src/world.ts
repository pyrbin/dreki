import { query, World } from "dreki";
import { range } from "@dreki.land/shared";

class Position {
  x = 0;
  y = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class Name {
  value = "";

  constructor(value: string) {
    this.value = value;
  }
}

const BATCH_SIZE = 10_000;

// prettier-ignore
export const world = World.build()
  .components(Position)
  .startupSystems(setupSystem)
  .systems(positionSystem)
  .done();

function setupSystem(world: World) {
  for (const i of range(BATCH_SIZE)) {
    world.spawn(new Position(i, i), new Name(`name ${i}`));
  }
}

// const transform = query(Position, Name);

function positionSystem(world: World) {
  query(Position, Name).forEach((p) => {
    p.x += 1;
    p.y += 1;
  });

  //for (const [p] of query(Position, Name)) {
  //  p.x += 1;
  //  p.y += 1;
  //}

  //for (let i = 0; i < BATCH_SIZE; i++) {
  //  const p = world.get(i, Position);
  //  const n = world.get(i, Name);
  //  p.x += 1;
  //  p.y += 1;
  //}
}
