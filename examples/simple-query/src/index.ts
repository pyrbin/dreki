import { World, query } from "dreki";
import { not } from "dreki/filters";

class Position {
  x = 0;
  y = 0;
}

class Dead {}

let accumulator = 0;

const alive = query(Position, not(Dead));
function system() {
  for (const [pos] of alive) {
    accumulator++;
  }
}

const world = World.build().with({ capacity: 200 }).systems(system).done();

world.batch(5, Position, Dead);
world.batch(10, Position);

world.update();

console.assert(accumulator === 10);

console.log(`Found ${accumulator} alive entities.`);
