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
import { get_component_info_or_register } from "../src/component/register";
import { added, changed, disabled, not, observe, removed } from "../src/query/filters/mod";
import { World, query } from "../src/mod";

let called = 0;

beforeEach(() => {
  called = 0;
});

test("simple non-filter query", () => {
  const positions = query(Position, Scale);
  const spawn_count = 20;
  const update_count = 60;
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

  for (let i = 0; i < spawn_count; i++) {
    world.spawn(new Position(24, 24), Scale);
  }

  for (let i = 0; i < update_count; i++) {
    world.update();
  }

  expect(called).toBe(spawn_count * update_count);
  const component = world.get(new Entity(spawn_count - 1, spawn_count - 1), Scale);
  expect(component.a).toBe(update_count * 24);
});

test("not filter", () => {
  const non_pos = 5;
  const with_pos = 15;
  const count = 55;
  const ok = not(Position);
  const not_positions = query(ok, Scale);
  const world = World.build()
    .with({ capacity: 50 })
    .systems(() => {
      for (const [scale] of not_positions) {
        called++;
      }
    })
    .done();

  world.batch(non_pos, Scale);
  world.batch(with_pos, Scale, Position);

  for (const i of range(0, count)) {
    world.update();
  }

  expect(called).toBe(non_pos * count);
});

test("changed filter", () => {
  const obs_positions = query(changed(Position), Scale);
  const world = World.build()
    .with({ capacity: 50 })
    .components(Position1D)
    .systems(() => {
      for (const [pos, scale] of obs_positions) {
        called++;
        pos.x += scale.a;
      }
    })
    .done();
  const entt = world.spawn(new Position(20, 20), new Scale(100, 100));
  world.update();
  const obs = world.storage.get_observed(entt, get_component_info_or_register(Position));
  obs.x += 20;
  world.update();
  obs.x = obs.x;
  world.update();

  expect(obs.x).toBe(140);
  expect(called).toBe(1);
});

test("added filter", () => {
  const added_pos = query(added(Position), Scale);
  const world = World.build()
    .with({ capacity: 50 })
    .systems(() => {
      for (const data of added_pos) {
        called++;
        expect(data.length).toBe(2);
      }
    })
    .done();
  const entt = world.spawn();
  world.update();
  world.add(entt, Scale);
  world.update();
  world.add(entt, Position);
  world.update();
  world.update();

  expect(called).toBe(1);
});

test("removed filter", () => {
  const added_pos = query(removed(Position), Scale);
  const world = World.build()
    .with({ capacity: 50 })
    .systems(() => {
      for (const data of added_pos) {
        expect(data.length).toBe(1);
        called++;
      }
    })
    .done();
  const entt = world.spawn(Scale, Position);
  world.update();
  world.update();
  world.remove(entt, Position);
  world.update();
  world.update();
  world.update();
  expect(called).toBe(1);
});

test("disabled filter", () => {
  const added_pos = query(disabled(Position), Scale);
  const world = World.build()
    .with({ capacity: 50 })
    .systems(() => {
      for (const data of added_pos) {
        expect(data.length).toBe(2);
        called++;
      }
    })
    .done();
  const entt = world.spawn(Scale, Position);
  world.update();
  world.update();
  world.disable(entt, Position);
  world.update();
  world.enable(entt, Position);
  world.update();
  world.disable(entt, Position);
  world.update();
  expect(called).toBe(2);
});

test("observed selection", () => {
  const changed_query = query(changed(Position), Scale);
  const observed_query = query(observe(Position), Scale);
  const world = World.build()
    .with({ capacity: 50 })
    .systems(() => {
      for (const data of changed_query) {
        called += 25;
      }
      for (const [obs] of observed_query) {
        obs.x += 2;
      }
      for (const data of changed_query) {
        called++;
      }
    })
    .done();
  world.spawn(Position, Scale);
  world.update();
  world.update();
  expect(called).toBe(2);
});

test("tag component query", () => {
  const tag_query = query(Tag, added(IsPlayer), Scale);
  const world = World.build()
    .with({ capacity: 50 })
    .systems(() => {
      for (const tag of tag_query) {
        expect(tag.length).toBe(1);
        called++;
      }
    })
    .done();
  const entt = world.spawn(Tag, Scale);
  world.update();
  world.add(entt, IsPlayer);
  world.update();
  world.update();
  world.update();
});

test("entity parameter", () => {
  const ITER = 2000;
  const query_with_entity = query(Entity, Position);
  const world = World.build()
    .with({ capacity: ITER })
    .systems((w) => {
      for (const result of query_with_entity) {
        const [entt, pos] = result;
        expect(result.length).toBe(2);
        expect(result[0]).toBeInstanceOf(Entity);
        // If we fetch Position for entity `entt` is should be the same as the one
        // returned from the query result.
        expect(w.get(entt, Position)).toEqual(pos);
        called++;
      }
    })
    .done();

  for (const i of range(0, ITER)) {
    const entt = world.spawn(new Position(i * Math.random() * ITER, 0));
    if (i % 2 === 0) {
      world.add(entt, Entity.null);
    }
  }

  world.update();
  expect(called).toBe(ITER);
});

test("super component batch", () => {
  const point3d_count = 500;
  const double_point_count = 333;
  const point4d_count = 1000;

  const total_from_point2d = point4d_count + point3d_count;
  const total_count = double_point_count + total_from_point2d;

  const all_point4d = query(Point4D);
  const all_point3d = query(Point3D, not(Point4D));
  const all_point2d = query(Point2D);
  const all_points = query(Point);

  const world = World.build()
    .systems(() => {
      called = 0;
      for (const [data] of all_point4d) {
        expect(data).toBeInstanceOf(Point4D);
        called++;
      }
      expect(called).toBe(point4d_count);
      called = 0;
      for (const [data] of all_point3d) {
        expect(data).toBeInstanceOf(Point3D);
        called++;
      }
      expect(called).toBe(point3d_count);
      called = 0;
      for (const [data] of all_point2d) {
        expect(data instanceof Point4D || data instanceof Point3D).toBe(true);
        called++;
      }
      expect(called).toBe(total_from_point2d);
      called = 0;
      for (const [data] of all_points) {
        expect(data).toBeInstanceOf(Point);
        called++;
      }
      expect(called).toBe(total_count);
    })
    .done();

  world.batch(point4d_count, Point4D);
  world.batch(point3d_count, Point3D);
  world.batch(double_point_count, DoublePoint);

  world.register(Point);
  world.register(Point2D);

  world.update();
});
