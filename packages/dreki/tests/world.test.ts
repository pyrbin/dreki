import { observe } from "../src/query/observe";
import { World } from "../src/world/mod";
import { Scale, Position, Time, Point, DoublePoint, IsPlayer } from "./utils/data";

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

test("despawn entity", () => {
  const world = new World({ capacity: 1000 });
  const entity = world.spawn(Scale, new Position(200, 200));
  const pos = world.get(entity, Position);
  expect(pos.x).toBe(200);
  world.despawn(entity);
  expect(world.get(entity, Position)).toBe(undefined);
});

test("resource add/remove", () => {
  const world = new World({ capacity: 10_000 });
  world.add_resource(new Time(25));
  expect(world.resource(Time).dt).toBe(25);
  world.delete_resource(Time);
  expect(world.resource(Time)).toBe(undefined);
});

test("world increase capacity", () => {
  const world = new World({ capacity: 5 });
  world.register(Point);

  expect(world.capacity == 5).toBe(true);
  const entities = world.batch(10, DoublePoint);
  const last = entities[entities.length - 1];
  expect(world.capacity >= 10).toBe(true);
  expect(
    world.get(entities[Math.floor(Math.random() * (entities.length - 1))], DoublePoint),
  ).toBeInstanceOf(Point);

  const new_entity = world.spawn(new Point(200));
  expect(world.get(new_entity, Point)).toBeDefined();
  expect(world.get(new_entity, Point).x).toBe(200);
  world.remove(new_entity, Point);
  expect(world.get(new_entity, Point)).toBeUndefined();
  const new_entity2 = world.spawn(new Point(999));
  expect(world.get(new_entity2, Point)).toBeDefined();
  expect(world.get(new_entity2, Point).x).toBe(999);
});

test("singleton getter", () => {
  const world = new World({ capacity: 5 });
  const entity = world.spawn(Position, Scale);

  const new_pos = new Position(20, 20);
  const player_entity = world.spawn(new_pos, Scale, IsPlayer);

  const player = world.single(IsPlayer);

  expect(player).toBe(player_entity);
  expect(world.get(player, Position)).toBe(new_pos);

  world.add(entity, IsPlayer);
  expect(() => world.single(IsPlayer)).toThrowError();

  world.despawn(player);
  world.despawn(entity);

  expect(world.single(IsPlayer)).toBeUndefined();
});
