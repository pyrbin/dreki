import { iter, range } from "@dreki.land/shared";
import { events, resources, Stage, Stages } from "../src/mod";
import { observe } from "../src/query/observe";
import { StartupStages } from "../src/scheduler/mod";
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
  expect(world.has_resource(Time)).toBe(false);
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

class DepLoaded {
  constructor(readonly value: string) {}
}

class Dependecy {
  constructor(readonly value: string) {}
}

test("startup system only run once", async () => {
  let counter = 0;
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const world = World.build()
    .startup_stage_after(
      StartupStages.PreStartup,
      "CustomBeforeStartup",
      new Stage(() => counter++),
    )
    .startup_systems(async () => {
      expect(counter).toBe(1);
      await sleep(1000);
      const dep_loaded_events = events(DepLoaded);
      dep_loaded_events.send({ value: "fetched_string" });
    })
    .systems(Stages.Last, (world: World) => {
      events(DepLoaded).take(1, ([event]) => {
        world.add_resource(new Dependecy(event.value));
      });
    })
    .done();

  for (const i of range(5000)) {
    world.update();
  }

  await sleep(1000);

  for (const i of range(5000)) {
    world.update();
  }

  expect(world.resource(Dependecy)).toBeDefined();
});

class ExampleResource {}

test("don't run if resource doesn't exist", () => {
  let counter = 0;
  let ran = 0;
  const world = World.build()
    .systems(
      () => {
        if (counter % 50 == 0) {
          world.add_resource(ExampleResource);
        } else {
          world.delete_resource(ExampleResource);
        }
      },
      () => {
        resources(ExampleResource);
        ran++;
      },
      () => {
        counter++;
      },
    )
    .done();

  for (let i of range(200)) {
    world.update();
  }

  expect(ran).toBe(200 / 50);
});

test("commands test", () => {
  const world = World.build().done();
  const player = world.spawn();
  const player2 = world.spawn();

  const pos = world
    .commands(player)
    .add(Position, Scale)
    .disable(Scale)
    .remove(Position)
    .add(Position)
    .get(Position);

  world.commands(player2).despawn();

  expect(world.has(player, Position)).toBe(true);
  expect(world.has(player, Scale)).toBe(true);
  expect(world.enabled(player, Scale)).toBe(false);
  expect(world.disabled(player, Scale)).toBe(true);
  expect(world.get(player, Position)).toBe(pos);

  world.commands(player).enable(Scale);
  expect(world.disabled(player, Scale)).toBe(false);
  expect(world.enabled(player, Scale)).toBe(true);
});
