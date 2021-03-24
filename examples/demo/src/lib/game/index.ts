import { World, query } from "dreki";
import { Position, Velocity } from "./components";

const q = query(Position, Velocity);

function sampleSystem() {
  for (const [p, v] of q) {
    p.x += v.x;
    p.y += v.y;
  }
}

export function init(size: number) {
  //prettier-ignore
  const world = World.build()
    .with({ capacity: size })
    .systems(sampleSystem)
    .done();

  world.batch(size, Position, Velocity);
  return world;
}
