import { World } from "../src/mod";
import { ComponentSparseSet } from "../src/storage/sparse_set";
import { PhantomComponentStorage } from "../src/storage/phantom";
import {
  Point3D,
  Point,
  Point2D,
  Point4D,
  FloatPoint,
  ExtendedPoint,
  DoublePoint,
} from "./utils/data";

test("inheritance uniqueness", () => {
  const world = World.build().done();
  const entity = world.spawn(new Point3D(1, 2, 3));
  world.spawn(Point);
  const phantomStorage = world.storage.sets.dense.raw[0] as PhantomComponentStorage;
  const superStorage = world.storage.sets.dense.raw[1] as ComponentSparseSet;

  expect(phantomStorage).toBeInstanceOf(PhantomComponentStorage);
  expect(phantomStorage.parent).toBe(superStorage);
  expect(world.get(entity, Point2D)).toBeUndefined();
  expect(world.get(entity, Point)).toBe(world.get(entity, Point3D));

  world.spawn(Point4D);
  world.spawn(Point2D);

  expect(world.get(entity, Point2D)).toBeInstanceOf(Point3D);
  expect(world.get(entity, Point)).toBe(world.get(entity, Point3D));
  world.add(entity, new Point4D(1, 2, 3, 4));
  expect(world.get(entity, Point3D)).toBeInstanceOf(Point4D);
});

test("multi-super class", () => {
  const world = World.build().with({ capacity: 3 }).done();
  const entity = world.spawn(FloatPoint, ExtendedPoint, DoublePoint);

  world.spawn(Point);

  expect(world.get(entity, ExtendedPoint)).toBe(undefined);
  expect(world.get(entity, FloatPoint)).toBe(undefined);
  expect(world.get(entity, Point)).toBeInstanceOf(DoublePoint);
  expect(world.get(entity, DoublePoint)).toBeInstanceOf(DoublePoint);
});

test("multi-super class", () => {
  const world = World.build().with({ capacity: 3 }).done();
  const entity = world.spawn(FloatPoint, ExtendedPoint, DoublePoint);

  world.spawn(Point);

  expect(world.get(entity, ExtendedPoint)).toBe(undefined);
  expect(world.get(entity, FloatPoint)).toBe(undefined);
  expect(world.get(entity, Point)).toBeInstanceOf(DoublePoint);
  expect(world.get(entity, DoublePoint)).toBeInstanceOf(DoublePoint);
});

test("add / remove with super components", () => {
  const world = World.build().with({ capacity: 2 }).done();

  const a = world.spawn(new Point4D(2, 2, 2, 2));
  const b = world.spawn(new Point(2));

  world.register(FloatPoint);
  world.remove(a, Point4D);

  expect(world.get(a, Point)).toBeUndefined();

  world.add(a, DoublePoint);

  expect(world.get(a, Point)).toBeInstanceOf(DoublePoint);
  expect(world.get(a, Point).x).toBe(0);

  world.add(b, new DoublePoint(29));

  expect(world.get(b, Point)).toBeInstanceOf(DoublePoint);
  expect(world.get(b, Point).x).toBe(29);

  world.add(a, new Point2D(5, 5));

  world.remove(b, Point);
  world.add(b, new Point3D(3, 3, 3));

  expect(world.get(a, Point)).toBeInstanceOf(Point2D);
  expect(world.get(b, Point)).toBeInstanceOf(Point3D);

  expect(world.get(a, Point).x).toBe(5);
  expect(world.get(b, Point).x).toBe(3);

  expect(world.get(a, DoublePoint)).toBe(undefined);
  expect(world.get(b, DoublePoint)).toBe(undefined);
  expect(world.get(a, Point4D)).toBe(undefined);
  expect(world.get(b, Point4D)).toBe(undefined);
});
