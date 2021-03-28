import { World } from "../src/mod";
import { ComponentSparseSet } from "../src/storage/components";
import { PhantomComponentSparseSet } from "../src/storage/phantom";
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
  const phantom_storage = world.storage.sets.dense.raw[0] as PhantomComponentSparseSet;
  const super_storage = world.storage.sets.dense.raw[1] as ComponentSparseSet;

  expect(phantom_storage).toBeInstanceOf(PhantomComponentSparseSet);
  expect(phantom_storage.reference).toBe(super_storage);
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
