import { Entities } from "../src/entity/entities";
import { Entity, EntityHandle } from "../src/entity/mod";

test("generation counter", () => {
  const entites = new Entities(1);
  const ITER_COUNT = 8;
  for (let i = 0; i < ITER_COUNT; i++) {
    const entity = entites.allocate();
    const handle = Entity.handle_of(entity);
    expect(handle.index).toBe(0);
    expect(handle.generation).toBe(i);
    entites.dispose(entity);
  }
});

test("entity bits", () => {
  const handle = new EntityHandle(1000, 434);
  const entity = handle.id();
  const from = Entity.handle_of(entity);
  expect(from.index).toBe(handle.index);
  expect(from.generation).toBe(handle.generation);
});
