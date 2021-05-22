import { range } from "@dreki.land/shared";
import {
  DoublePoint,
  IsPlayer,
  Point,
  Point2D,
  Point3D,
  Point4D,
  Position,
  Position1D,
  Scale,
  Tag,
} from "./utils/data";
import { Entity } from "../src/entity/mod";
import { added, changed, disabled, not, observe, removed } from "../src/query/filters/mod";
import { World, query } from "../src/mod";

let called = 0;

beforeEach(() => {
  called = 0;
});

test("simple non-filter query", () => {
  const positions = query(Position, Scale);
  const spawnCount = 20;
  const updateCount = 60;
  const world = World.build()
    .systems(() => {
      for (const [p, s] of positions) {
        s.a += p.x;
        s.b += p.y;
        called++;
      }
    })
    .components(Position1D)
    .done();

  for (let i = 0; i < spawnCount; i++) {
    world.spawn(new Position(24, 24), Scale);
  }

  for (let i = 0; i < updateCount; i++) {
    world.update();
  }

  expect(called).toBe(spawnCount * updateCount);
  const component = world.get(Entity(spawnCount - 1, 0), Scale);

  expect(component.a).toBe(updateCount * 24);
});

test("not filter", () => {
  const nonPos = 5;
  const withPos = 15;
  const count = 55;
  const ok = not(Position);
  const notPositions = query(ok, Scale);
  const world = World.build()
    .with({ capacity: 50 })
    .systems(() => {
      for (const _ of notPositions) {
        called++;
      }
    })
    .done();

  world.batch(nonPos, Scale);
  world.batch(withPos, Scale, Position);

  for (const _ of range(0, count)) {
    world.update();
  }

  expect(called).toBe(nonPos * count);
});

test("changed filter same system", () => {
  const ITER = 1000;
  const react = query(changed(Position), Scale);
  const mutate = query(observe(Position));
  let i = 0;
  const world = World.build()
    .with({ capacity: 50 })
    .components(Position1D)
    .systems(() => {
      for (const _ of react) {
        called++;
      }
      for (const [pos] of mutate) {
        if (i % 2 === 0) {
          pos.x *= 2;
        }
      }
      i++;
    })
    .done();

  world.spawn(new Position(20, 20), new Scale(100, 100));
  for (const _ of range(ITER)) {
    world.update();
  }

  expect(called).toBe(Math.ceil(ITER / 2));
});

test("changed filter seperate systems", () => {
  const ITER = 1000;
  const react = query(changed(Position), Scale);
  const mutate = query(observe(Position));
  let i = 0;
  const world = World.build()
    .with({ capacity: 50 })
    .components(Position1D)
    .systems(
      () => {
        for (const _ of react) {
          called++;
        }
      },
      () => {
        for (const [pos] of mutate) {
          if (i % 2 === 0) {
            pos.x *= 2;
          }
        }
        i++;
      },
    )
    .done();

  world.spawn(new Position(20, 20), new Scale(100, 100));
  for (const _ of range(ITER)) {
    world.update();
  }

  expect(called).toBe(Math.ceil(ITER / 2));
});

test("added filter", () => {
  const addedPos = query(added(Position), Scale);
  const addedScale = query(added(Scale));

  const world = World.build()
    .with({ capacity: 50 })
    .systems(() => {
      for (const data of addedPos) {
        called++;
        expect(data.length).toBe(2);
      }
      for (const data of addedScale) {
        called += 200;
        expect(data.length).toBe(1);
      }
    })
    .done();
  const entity = world.spawn();
  world.update();
  world.add(entity, Scale);
  world.update();
  world.add(entity, Position);
  world.update();
  world.update();

  expect(called).toBe(201);
});

test("removed filter", () => {
  const pos = new Position(200, 200);
  const addedPos = query(removed(Position), Scale);
  const world = World.build()
    .with({ capacity: 50 })
    .components(Position1D)
    .systems(() => {
      for (const data of addedPos) {
        expect(data.length).toBe(2);
        expect(data[0]).toEqual(pos);
        called++;
      }
    })
    .done();
  const entity = world.spawn(Scale, pos);
  world.update();
  world.update();
  world.remove(entity, Position);
  world.update();
  world.add(entity, pos);
  world.update();
  world.update();
  world.remove(entity, Position1D);
  expect(world.get(entity, Position)).toBeUndefined();
  world.update();
  world.add(entity, pos);
  world.update();
  world.update();
  world.update();
  world.despawn(entity);
  world.update();
  expect(called).toBe(3);
});

test("disabled filter", () => {
  const addedPos = query(disabled(Position), Scale);
  const world = World.build()
    .with({ capacity: 1 })
    .systems(() => {
      for (const data of addedPos) {
        expect(data.length).toBe(2);
        called++;
      }
    })
    .done();
  const entity = world.spawn(Scale, Position);
  world.update();
  world.update();
  world.disable(entity, Position);
  world.update();
  world.enable(entity, Position);
  world.update();
  world.disable(entity, Position);
  world.update();
  expect(called).toBe(2);
});

test("observed selection", () => {
  const length = 10;
  const changedQuery = query(changed(Position), Scale);
  const observedQuery = query(observe(Position), Scale);

  const world = World.build()
    .with({ capacity: 50 })
    .systems(() => {
      for (const [observedPos] of observedQuery) {
        observedPos.x += 1;
      }
      for (const _ of changedQuery) {
        called++;
      }
      for (const [observedPos] of observedQuery) {
        observedPos.x += 1;
      }
      for (const _ of changedQuery) {
        called++;
      }
    })
    .done();

  const entity = world.spawn(Position, Scale);

  for (const _ of range(length)) {
    world.update();
  }

  expect(world.get(entity, Position).x).toBe(length * 2);
  expect(called).toBe(length * 2 - 2);
});

test("tag component query", () => {
  const tagQuery = query(Tag, added(IsPlayer), Scale);
  const world = World.build()
    .with({ capacity: 50 })
    .systems(() => {
      for (const tag of tagQuery) {
        expect(tag.length).toBe(1);
        called++;
      }
    })
    .done();
  const entity = world.spawn(Tag, Scale);
  world.update();
  world.add(entity, IsPlayer);
  world.update();
  world.update();
  world.update();
});

test("entity parameter", () => {
  const ITER = 2000;
  const queryWithEntity = query(Entity, Position);
  const world = World.build()
    .with({ capacity: ITER })
    .systems((w) => {
      for (const result of queryWithEntity) {
        const [entity, pos] = result;
        expect(result.length).toBe(2);
        expect(typeof result[0]).toBe("number");
        // If we fetch Position for entity `entity` is should be the same as the one
        // returned from the query result.
        expect(w.get(entity, Position)).toEqual(pos);
        called++;
      }
    })
    .done();

  for (const i of range(0, ITER)) {
    const entity = world.spawn(new Position(i * Math.random() * ITER, 0));
    if (i % 2 === 0) {
      world.add(entity, Entity);
    }
  }

  world.update();
  expect(called).toBe(ITER);
});

test("super component batch", () => {
  const point3dCount = 500;
  const doublePointCount = 333;
  const point4dCount = 1000;

  const totalFromPoint2d = point4dCount + point3dCount;
  const totalCount = doublePointCount + totalFromPoint2d;

  const allPoint4d = query(Point4D);
  const allPoint3d = query(Point3D, not(Point4D));
  const allPoint2d = query(Point2D);
  const allPoints = query(Point);

  const world = World.build()
    .systems(() => {
      called = 0;
      for (const [data] of allPoint4d) {
        expect(data).toBeInstanceOf(Point4D);
        called++;
      }
      expect(called).toBe(point4dCount);
      called = 0;
      for (const [data] of allPoint3d) {
        expect(data).toBeInstanceOf(Point3D);
        called++;
      }
      expect(called).toBe(point3dCount);
      called = 0;
      for (const [data] of allPoint2d) {
        expect(data instanceof Point4D || data instanceof Point3D).toBe(true);
        called++;
      }
      expect(called).toBe(totalFromPoint2d);
      called = 0;
      for (const [data] of allPoints) {
        expect(data).toBeInstanceOf(Point);
        called++;
      }
      expect(called).toBe(totalCount);
    })
    .done();

  world.batch(point4dCount, Point4D);
  world.batch(point3dCount, Point3D);
  world.batch(doublePointCount, DoublePoint);

  world.register(Point);
  world.register(Point2D);

  world.update();
});

test("query identifier", () => {
  const params = [IsPlayer, Entity, not(Point), changed(Scale)];

  // query identifier shouldn't be affected by order of params.
  const q1 = query(...params.sort(() => 0.5 - Math.random()));
  const q2 = query(...params.sort(() => 0.5 - Math.random()));

  expect(q1.id).toBe(q2.id);
  expect(q1).toEqual(q2);
});
