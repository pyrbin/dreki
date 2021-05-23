import { range, vec } from "../src/mod";

test("simple allocation", () => {
  const SIZE = 10;
  const vector = vec(SIZE, () => 999);
  for (const i of range(0, SIZE)) {
    expect(vector.raw[i]).toBe(999);
  }
});
