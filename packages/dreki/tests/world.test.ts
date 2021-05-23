import { range } from "@dreki.land/shared";
import { events, res, Stage, Stages } from "../src/mod";
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
  world.addResource(new Time(25));
  expect(world.resource(Time).dt).toBe(25);
  world.deleteResource(Time);
  expect(world.hasResource(Time)).toBe(false);
});

test("world increase capacity", () => {
  const world = new World({ capacity: 5 });
  world.register(Point);

  expect(world.capacity == 5).toBe(true);
  const entities = world.batch(10, DoublePoint);
  expect(world.capacity >= 10).toBe(true);
  expect(
    world.get(entities[Math.floor(Math.random() * (entities.length - 1))], DoublePoint),
  ).toBeInstanceOf(Point);

  const newEntity = world.spawn(new Point(200));
  expect(world.get(newEntity, Point)).toBeDefined();
  expect(world.get(newEntity, Point).x).toBe(200);
  world.remove(newEntity, Point);
  expect(world.get(newEntity, Point)).toBeUndefined();
  const newEntity2 = world.spawn(new Point(999));
  expect(world.get(newEntity2, Point)).toBeDefined();
  expect(world.get(newEntity2, Point).x).toBe(999);
});

test("singleton getter", () => {
  const world = new World({ capacity: 5 });
  const entity = world.spawn(Position, Scale);

  const newPos = new Position(20, 20);
  const playerEntity = world.spawn(newPos, Scale, IsPlayer);

  const player = world.single(IsPlayer);

  expect(player).toBe(playerEntity);
  expect(world.get(player, Position)).toBe(newPos);

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
    .startupStageAfter(StartupStages.PreStartup, "CustomBeforeStartup", new Stage(() => counter++))
    .startupSystems(async () => {
      expect(counter).toBe(1);
      await sleep(1000);
      const depLoadedEvents = events(DepLoaded);
      depLoadedEvents.emit({ value: "fetched_string" });
    })
    .systems(Stages.Last, (world: World) => {
      events(DepLoaded).take(1, ([event]) => {
        world.addResource(new Dependecy(event.value));
      });
    })
    .done();

  for (const _ of range(5000)) {
    world.update();
  }

  await sleep(1000);

  for (const _ of range(5000)) {
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
          world.addResource(ExampleResource);
        } else {
          world.deleteResource(ExampleResource);
        }
      },
      () => {
        res(ExampleResource);
        ran++;
      },
      () => {
        counter++;
      },
    )
    .done();

  for (const _ of range(200)) {
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
