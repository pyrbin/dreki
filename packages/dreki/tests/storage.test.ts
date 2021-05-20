import { bitflags } from "@dreki.land/shared";
import { ComponentFlags } from "../src/component/mod";
import { ComponentType, getComponentInfoOrRegister } from "../src/component/register";
import { Entity } from "../src/entity/mod";
import { Storage } from "../src/storage/mod";
import { Position } from "./utils/data";

test("insert / remove", () => {
  const storage = new Storage(21);
  const entity = Entity(20, 20);
  const info = getComponentInfoOrRegister(Position);
  const set = storage.getOrCreate(info, 21);
  const pos = new Position();
  pos.x = 2000;

  set.insert(entity, pos, ComponentFlags.None, 0);

  expect(set.length).toBe(1);
  expect(set.remove(entity)).toBe(true);
  expect(set.get(entity)).toBe(undefined);
  expect(set.length).toBe(0);
  expect(set.remove(entity)).toBe(false);
});

let ccounter = 0;
const getInfoHelper = () => ({
  id: ++ccounter,
  mask: 1 << ccounter,
  component: Position,
  type: ComponentType.Data,
});

test("component disabled flag", () => {
  const storage = new Storage(5);
  const info = getInfoHelper();
  const stg = storage.getOrCreate(info, 24);
  const entity = Entity(0, 0);
  stg.insert(entity, new Position(), ComponentFlags.None, 0);
  storage.get(info.id).setFlag(entity, (flag) => bitflags.insert(flag, ComponentFlags.Disabled));
  const [, flags] = storage.get(info.id).getWithState(entity);
  expect(bitflags.contains(flags, ComponentFlags.Disabled)).toBe(true);
});

test("grow when at capacity", () => {
  const initial = 2;
  const final = 99;
  const storage = new Storage(initial);

  for (let i = 0; i < final; i++) {
    const info = getInfoHelper();
    storage.getOrCreate(info, 24);
  }
  expect(storage.sets.capacity >= final).toBe(true);
});
