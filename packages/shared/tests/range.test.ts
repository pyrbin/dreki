import { range } from "../src/mod";

test("simple iteration", () => {
  let called = 0;
  const ITER = 10;
  for (const i of range(0, ITER)) {
    called++;
  }
  expect(called).toBe(ITER);
});

test("custom step size", () => {
  let called = 0;
  const ITER = 10;
  const STEP = 10;
  for (const i of range(0, ITER, STEP)) {
    called++;
  }
  expect(called).toBe(ITER / STEP);
});
