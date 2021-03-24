import { Entities } from "../src/entity/entities";
import { Entity } from "../src/entity/mod";

test("generation counter", () => {
  const entites = new Entities(1);
  const ITER_COUNT = 8;
  for (let i = 0; i < ITER_COUNT; i++) {
    const entity = entites.allocate();
    expect(entity.index).toBe(0);
    expect(entity.generation).toBe(i);
    entites.dispose(entity);
  }
});

test("entity bits", () => {
  const entity = new Entity(1000, 434);
  const bits = entity.bits();
  const from = Entity.from_bits(bits);
  expect(from.index).toBe(entity.index);
  expect(from.generation).toBe(entity.generation);
});
