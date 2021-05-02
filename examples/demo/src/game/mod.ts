import { Position, Speed, Time } from "./data";
import { World, query } from "dreki";

const all = query(Position, Speed);
const mover = (world: World) => {
  const { dt } = world.resource(Time);
  for (const [pos, { value }] of all) {
    pos.x += value * dt;
  }
};

export function init() {
  const time = new Time();

  // prettier-ignore
  const world = World.build()
    .systems(mover)
    .resources(time)
    .done();

  const player = world.spawn(Position, new Speed(20));

  return {
    world,
    player,
    time,
  };
}
