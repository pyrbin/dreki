import { World } from "../src/world/mod";
import { Scale, Position, Time } from "./utils/data";

test("id generation", () => {
  const world = new World();
  expect(typeof world.id === "number" && world.id >= 0).toBe(true);
});

test("spawn entity", () => {
  const world = new World({ capacity: 1000 });
  const entity = world.spawn(Scale, new Position(200, 200));
  const pos = world.get(entity, Position);
  expect(pos.x).toBe(200);
});

test("resource add/remove", () => {
  const world = new World({ capacity: 10_000 });
  world.add_resource(new Time(25));
  expect(world.resource(Time).dt).toBe(25);
  world.delete_resource(Time);
  expect(world.resource(Time)).toBe(undefined);
});

test("disable / enable components", () => {
  const world = new World({ capacity: 10_000 });
  const entity = world.spawn(Position, Scale);
  world.disable(entity, Position);
});
